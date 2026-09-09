# Breast Cancer Prediction

A breast cancer cytology classifier built on the Wisconsin Breast Cancer dataset.
Nine cytological grades go in, a benign/malignant probability split comes out.

FastAPI + scikit-learn on the backend, a React single-page app on the front,
both served through nginx from Docker Compose.

## Live demo

| | URL | Notes |
| --- | --- | --- |
| **Render** | **https://cytology-classifier.onrender.com** | HTTPS. Free tier sleeps after 15 min idle — the first request may take ~50s to wake |
| **AWS EC2** | **http://18.215.158.33:3000** | Always on. HTTP only (no TLS certificate) |

Render runs the single-container root `Dockerfile`; the EC2 box runs
`docker compose` with the separate backend and frontend images. Same application
either way. On the predict page, load sample **1017122** or **1000025** to see a
malignant and a benign case.

---

> **⚠️ Not a medical device.** This model is trained on a public dataset for
> educational purposes. It does not diagnose, and it is never a substitute for a
> qualified clinician.

---

## Architecture

The browser only ever talks to nginx. `/api/*` is reverse-proxied to FastAPI on the
internal Docker network, which keeps everything same-origin — so the backend needs
no CORS middleware at all.

```
                     ┌──────────────────────── docker compose ────────────────────────┐
                     │                                                                │
  browser  ──────▶   │  frontend (nginx :80)                backend (uvicorn :8000)   │
  :3000              │  ├── /            React SPA                                    │
                     │  ├── /predict     client-side route                            │
                     │  ├── /healthz     container probe                              │
                     │  └── /api/  ──────────proxy_pass────▶  /  ,  /predict          │
                     │                                          └── breast_cancer     │
                     │                                              _model.pkl        │
                     └────────────────────────────────────────────────────────────────┘
```

---

## Quick start

Requires Docker with Compose v2.

```bash
docker compose up -d --build
```

Then open **http://localhost:3000**.

On the predict page, hit **SAMPLE 1017122** or **SAMPLE 1000025** to load a real row
from the source dataset, then **RUN CLASSIFIER**.

```bash
docker compose down     # stop everything
```

| Service    | Container           | Exposure                                     |
| ---------- | ------------------- | -------------------------------------------- |
| `frontend` | `breast-cancer-web` | http://localhost:3000 — the only public port  |
| `backend`  | `breast-cancer-api` | internal only, reached via `/api/*`           |

The API is deliberately **not** published to the host. nginx proxies `/api/*` to it
over the internal Docker network, so there is no public port bypassing the proxy. To
poke at it directly during development, either add `ports: ["8000:8000"]` back to the
backend service temporarily, or use `docker compose exec backend ...`.

---

## Local development

Run the two halves separately for hot reload. Vite proxies `/api` to
`localhost:8000`, mirroring what nginx does in production, so the frontend code is
identical in both environments.

**Backend**

```bash
python -m venv myenv
source myenv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Other frontend scripts: `npm run build` (type-check + production bundle),
`npm run preview`, `npm run typecheck`.

---

## API

FastAPI's interactive docs (`/docs`, `/redoc`, `/openapi.json`) are **blocked at
nginx** so they are not exposed publicly — remove the matching `location` block in
`frontend/nginx.conf` if you want them reachable.

### `GET /`

```json
{ "Messege": "APP_NAME", "Version": "1.0.0" }
```

### `POST /predict`

All nine fields are required integers in the range **1–10**; out-of-range values
return `422` with a per-field explanation.

```bash
curl -X POST http://localhost:3000/api/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "clump_thickness": 8,
    "uniformity_of_cell_size": 10,
    "uniformity_of_cell_shape": 10,
    "marginal_adhesion": 8,
    "single_epithelial_cell_size": 7,
    "bare_nuclei": 10,
    "bland_chromatin": 9,
    "normal_nucleoli": 7,
    "mitoses": 1
  }'
```

```json
{
  "prediction": 1,
  "label": "Malignant",
  "probability": { "benign": 0.0328, "malignant": 0.9672 }
}
```

`prediction` is `0` for benign and `1` for malignant; `label` is the same thing in
words. The two probabilities sum to 1.

---

## The model

Four candidates were trained and compared in
[`notebooks/model_training.ipynb`](notebooks/model_training.ipynb). An SVM won on F1
and was refit on the full dataset before being serialised to
`models/breast_cancer_model.pkl`.

| Model                   | Accuracy   | Precision  | Recall     | F1         |
| ----------------------- | ---------- | ---------- | ---------- | ---------- |
| **SVM** *(selected)*    | **0.9630** | **0.9375** | **0.9574** | **0.9474** |
| Random Forest           | 0.9630     | 0.9375     | 0.9574     | 0.9474     |
| Logistic Regression     | 0.9556     | 0.9362     | 0.9362     | 0.9362     |
| Gradient Boosting       | 0.9556     | 0.9362     | 0.9362     | 0.9362     |

Everything is wrapped in a single scikit-learn `Pipeline`, so the exact preprocessing
used in training is applied at inference time:

```
Pipeline
└── ColumnTransformer
    └── numerical: SimpleImputer(strategy="median") → StandardScaler
└── SVC(probability=True, random_state=42)
```

### Dataset

`data/raw/Brest_cancer_data.csv` — 683 records, 9 integer features graded 1–10, and a
`Class` column where `2` = benign and `4` = malignant.

| Class     | Records |
| --------- | ------- |
| Benign    | 444     |
| Malignant | 239     |

### Features

| Field                         | Dataset column                | Meaning                                              |
| ----------------------------- | ----------------------------- | ---------------------------------------------------- |
| `clump_thickness`             | Clump Thickness               | Benign cells cluster in monolayers, malignant stack   |
| `uniformity_of_cell_size`     | Uniformity of Cell Size       | Cancer cells vary widely in size                      |
| `uniformity_of_cell_shape`    | Uniformity of Cell Shape      | Irregular outlines point toward malignancy            |
| `marginal_adhesion`           | Marginal Adhesion             | Loss of adhesion is a malignancy signal               |
| `single_epithelial_cell_size` | Single Epithelial Cell Size   | Significantly enlarged cells may be malignant         |
| `bare_nuclei`                 | Bare Nuclei                   | Nuclei without cytoplasm; typical of *benign* tumours |
| `bland_chromatin`             | Bland Chromatin               | Uniform in benign cells, coarser in cancer cells      |
| `normal_nucleoli`             | Normal Nucleoli               | More prominent in cancer cells                        |
| `mitoses`                     | Mitoses                       | Rate of cell division                                 |

---

## Frontend

React 18 + TypeScript, built with Vite and served as static files by nginx.

The visual language is **Bauhaus**: the primary triad (red `#E63329`, blue `#1B4FA0`,
yellow `#F2B417`) on warm paper, hard 3px black rules, zero border radius, oversized
grotesk display type, and circle/square/half-round motifs.

| Route      | Page                                                              |
| ---------- | ----------------------------------------------------------------- |
| `/`        | Landing — hero composition, model stats, feature reference         |
| `/predict` | Classifier — nine sliders, dataset presets, live probability split |

The result panel encodes the class two ways rather than colour alone: benign is a blue
banner with a **circle** glyph, malignant a red banner with a **square**.

```
frontend/src/
├── api/client.ts          typed fetch wrapper, abort + 422 handling
├── components/            Header, Footer, FeatureField, ResultCard
├── data/features.ts       feature metadata and dataset presets
├── pages/                 Landing.tsx, Predict.tsx
└── styles/bauhaus.css     design tokens and the whole system
```

---

## Project structure

```
brest_cancer_prediction/
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app, model loading, /predict
│   │   ├── schema.py         Pydantic request model (1–10 bounds)
│   │   └── config.py         paths, app name, version
│   ├── requirements.txt
│   └── Dockerfile            python:3.12-slim
├── frontend/
│   ├── src/                  React application
│   ├── Dockerfile            node build → nginx runtime
│   └── nginx.conf            static serving, SPA fallback, /api proxy
├── models/
│   └── breast_cancer_model.pkl
├── data/raw/
│   └── Brest_cancer_data.csv
├── notebooks/
│   └── model_training.ipynb  training, comparison, model selection
└── docker-compose.yml
```

---

## Versions

| Backend         |          | Frontend         |         |
| --------------- | -------- | ---------------- | ------- |
| Python          | 3.12.14  | React            | 18.3.1  |
| FastAPI         | 0.141.1  | React Router     | 6.30.6  |
| Uvicorn         | 0.52.4   | TypeScript       | 5.9.3   |
| scikit-learn    | 1.9.0    | Vite             | 5.4.21  |
| pandas          | 3.0.5    | nginx            | 1.27.5  |
| NumPy           | 2.5.3    | Node (build)     | 20      |
| joblib          | 1.6.0    |                  |         |

---

## Author

**Muhammed Dhanish K**

- GitHub — [@dhanishmohd1136](https://github.com/dhanishmohd1136)
- LinkedIn — [muhammed-dhanish-k007](https://www.linkedin.com/in/muhammed-dhanish-k007/)

---

## Deploying

Step-by-step guides, both using the single-container root `Dockerfile`:

- **[DEPLOY-AWS.md](DEPLOY-AWS.md)** — App Runner (managed) or EC2 free tier
- **[DEPLOY-GCP.md](DEPLOY-GCP.md)** — Cloud Run

The root `Dockerfile` packages nginx and uvicorn into one container listening on
`$PORT` (default 8080), so it runs unmodified on App Runner, ECS, Lightsail and
Cloud Run. Local development still uses `docker compose` with the separate
`backend/Dockerfile` and `frontend/Dockerfile`.

---

## Before deploying to a cloud host

Already handled in this repo:

- ✅ **Dependencies are pinned** in `backend/requirements.txt` to the exact versions
  the model was trained and verified against, so a rebuild cannot silently change
  scikit-learn out from under the pickled pipeline.
- ✅ **The API is not publicly published** — only the frontend's port is, and the
  interactive docs are blocked at the proxy.
- ✅ **Backend healthcheck and restart policy** — the frontend waits for
  `service_healthy` before starting, so nginx never fronts an unloaded model.

Still worth doing, depending on your host:

- **Run the backend as a non-root user** and trim the image (currently ~680 MB; the
  frontend is ~74 MB). Both require changes to `backend/Dockerfile`.
- **Build multi-arch** if the target is ARM (Graviton, Ampere) — the images are
  currently `linux/amd64` only:
  `docker buildx build --platform linux/amd64,linux/arm64 ...`
- **Terminate TLS** at a load balancer or reverse proxy in front of the frontend
  container; nothing here serves HTTPS.
- **Set resource limits** (`deploy.resources`) so a runaway request cannot starve the
  host.
