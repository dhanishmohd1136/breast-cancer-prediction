# Deploying to Google Cloud Run

Everything runs on GCP — one Cloud Run service, one URL. No Vercel, no second
provider, and no CORS changes to the backend.

## Why a single service

The root `Dockerfile` builds **one container** holding both halves:

```
  Cloud Run service  (listens on $PORT)
  └── nginx
      ├── /          → React SPA (static files)
      └── /api/*     → 127.0.0.1:8000 → uvicorn → model.pkl
```

uvicorn binds to **loopback only**, so the API is not reachable from outside
except through nginx. That keeps the browser same-origin — exactly like the local
compose setup — which is why `backend/app/main.py` needs no CORS middleware.

Local development is unchanged: `docker compose up` still uses
`backend/Dockerfile` + `frontend/Dockerfile`. The root `Dockerfile` is only for
Cloud Run.

---

## Before you start

- A Google account with **billing enabled** (Cloud Run's free tier still requires
  a billing account on file — 2 million requests/month are free, and the service
  scales to zero when idle).
- The `gcloud` CLI. If `gcloud version` fails, install it:
  https://cloud.google.com/sdk/docs/install

---

## Step 1 — Sign in and pick a project

```bash
gcloud auth login
```

Create a project (or reuse one). The ID must be globally unique:

```bash
gcloud projects create cytology-classifier-001 --name="Cytology Classifier"
gcloud config set project cytology-classifier-001
```

Confirm which project you are pointed at — everything below applies to it:

```bash
gcloud config get-value project
```

Then link billing: https://console.cloud.google.com/billing → select the project
→ **Link a billing account**.

## Step 2 — Enable the APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

This takes a minute the first time.

## Step 3 — Deploy

From the project root (the folder holding `Dockerfile`):

```bash
cd "/home/loq/DHANISH/JUPYTER/WEEK 37/brest_cancer_prediction"

gcloud run deploy cytology-classifier \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 60
```

What these mean:

| Flag                       | Why                                                          |
| -------------------------- | ------------------------------------------------------------ |
| `--source .`               | Cloud Build builds the root `Dockerfile` for you              |
| `--region asia-south1`     | Mumbai. Use `asia-south2` (Delhi) or `us-central1` if nearer  |
| `--allow-unauthenticated`  | Makes it a public website. Omit to require a Google login     |
| `--memory 512Mi`           | Measured usage is ~128 MiB, so this is comfortable            |
| `--min-instances 0`        | Scales to zero — you pay nothing while idle                   |
| `--max-instances 3`        | Caps spend if the URL gets hammered                           |

First deploy takes 3–5 minutes. Answer `y` if it offers to create an Artifact
Registry repository.

It finishes by printing your URL:

```
Service URL: https://cytology-classifier-xxxxxxxxxx-el.a.run.app
```

## Step 4 — Verify

```bash
URL=$(gcloud run services describe cytology-classifier \
      --region asia-south1 --format='value(status.url)')

curl -s -o /dev/null -w "landing  %{http_code}\n" "$URL/"
curl -s -o /dev/null -w "predict  %{http_code}\n" "$URL/predict"
curl -s -o /dev/null -w "docs     %{http_code}  (404 = correctly blocked)\n" "$URL/api/docs"

curl -s -X POST "$URL/api/predict" \
  -H 'Content-Type: application/json' \
  -d '{"clump_thickness":8,"uniformity_of_cell_size":10,"uniformity_of_cell_shape":10,
       "marginal_adhesion":8,"single_epithelial_cell_size":7,"bare_nuclei":10,
       "bland_chromatin":9,"normal_nucleoli":7,"mitoses":1}'
```

Expected from that last call:

```json
{"prediction":1,"label":"Malignant","probability":{"benign":0.0328,"malignant":0.9672}}
```

Then open `$URL` in a browser and run a prediction from the UI.

---

## Redeploying after a change

Same command as Step 3 — it builds and rolls out a new revision:

```bash
gcloud run deploy cytology-classifier --source . --region asia-south1
```

Flags set previously are remembered, so you only repeat ones you want to change.

## Useful commands

```bash
# Live logs
gcloud run services logs tail cytology-classifier --region asia-south1

# Recent logs
gcloud run services logs read cytology-classifier --region asia-south1 --limit 50

# Service details (URL, revision, resources)
gcloud run services describe cytology-classifier --region asia-south1

# Roll back to the previous revision
gcloud run revisions list --service cytology-classifier --region asia-south1
gcloud run services update-traffic cytology-classifier \
  --region asia-south1 --to-revisions REVISION_NAME=100

# Delete the service (stops all charges)
gcloud run services delete cytology-classifier --region asia-south1
```

---

## Cost

With `--min-instances 0` the container is shut down when nobody is using it, and
you are billed only for request time. A portfolio project well inside the free
tier (2M requests, 360k GiB-seconds per month) typically costs **nothing**.

The trade-off is a **cold start** — the first request after an idle period waits
a few seconds while Python imports scikit-learn and loads the model. To remove
that, set `--min-instances 1`, but you then pay for an always-warm instance.

## Troubleshooting

**Build fails on `npm ci`** — commit `frontend/package-lock.json`; the build
needs it.

**"Container failed to start and listen on PORT"** — nginx must bind `$PORT`.
`entrypoint.sh` substitutes it into the config; don't hardcode a port there.

**Upload is huge / slow** — check `.gcloudignore` still excludes `myenv/` and
`frontend/node_modules/`. Correct upload size is well under 1 MB.

**502 on `/api/*`** — uvicorn didn't start. Check the logs; the entrypoint waits
for the model to load before starting nginx, and exits if uvicorn dies.

**Billing not enabled** — Cloud Run refuses to deploy without a billing account
linked, even for free-tier usage.

## Custom domain (optional)

```bash
gcloud beta run domain-mappings create \
  --service cytology-classifier \
  --domain your-domain.com \
  --region asia-south1
```

Then add the DNS records it prints. TLS certificates are issued and renewed
automatically.
