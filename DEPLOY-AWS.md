# Deploying to AWS

**No changes to the project are required.** The root `Dockerfile` already builds a
single self-contained container that listens on `$PORT`, falling back to **8080**
when nothing sets it — which is exactly how App Runner, ECS and Lightsail run a
container. It is `linux/amd64`, matching AWS x86_64 by default.

```
  container (listens on 8080)
  └── nginx
      ├── /          → React SPA
      └── /api/*     → 127.0.0.1:8000 → uvicorn → model.pkl
```

uvicorn binds to loopback only, so the API is reachable solely through nginx. The
browser stays same-origin, which is why `backend/app/main.py` needs no CORS code.

## Which option?

| | **A. App Runner** | **B. EC2 (terminal)** | **C. EC2 (browser only)** |
| --- | --- | --- | --- |
| Needs a terminal | Yes | Yes | **No** |
| Effort | Low — managed | Medium | **Low** |
| HTTPS | Automatic | You set it up | You set it up |
| Cost | ~$5/mo minimum | **Free 12 months** | **Free 12 months** |
| Scales | Automatically | Fixed size | Fixed size |
| Project changes | None | None | None |

- **Option A** is the closest match to what this repo is packaged for, and the only
  one that gives you HTTPS for free. It needs Docker locally to push the image.
- **Option B** runs your existing `docker-compose.yml` on a free-tier box.
- **Option C** is the same as B but done entirely in the AWS console — no terminal,
  no SSH key. Start here if you would rather not touch a command line.

---

# Option A — AWS App Runner (recommended)

## A1. Install and configure the AWS CLI

```bash
sudo snap install aws-cli --classic
aws --version
```

Create an access key at **IAM → Users → your user → Security credentials →
Create access key**, then:

```bash
aws configure
# AWS Access Key ID:     <paste>
# AWS Secret Access Key: <paste>
# Default region name:   ap-south-1
# Default output format: json
```

Confirm it works and note your account ID:

```bash
aws sts get-caller-identity
```

## A2. Create an ECR repository

App Runner deploys container images from ECR, so the image goes there first.

```bash
export AWS_REGION=ap-south-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/cytology-classifier

aws ecr create-repository \
  --repository-name cytology-classifier \
  --region $AWS_REGION
```

## A3. Build and push the image

```bash
cd "/home/loq/DHANISH/JUPYTER/WEEK 37/brest_cancer_prediction"

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build --platform linux/amd64 -t cytology-classifier .
docker tag cytology-classifier:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

`--platform linux/amd64` matters — App Runner does not run arm64 images. If you
ever build on an Apple Silicon Mac, that flag is what keeps it working.

## A4. Create the App Runner service

Easiest in the console, because it creates the IAM role that lets App Runner pull
from ECR for you.

Go to **App Runner → Create service**:

| Setting | Value |
| --- | --- |
| Source | **Container registry** → Amazon ECR |
| Container image URI | `<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/cytology-classifier:latest` |
| Deployment trigger | Manual (or Automatic to redeploy on every push) |
| ECR access role | **Create new service role** |
| Service name | `cytology-classifier` |
| Virtual CPU / memory | **0.25 vCPU / 0.5 GB** — measured usage is ~128 MB |
| **Port** | **8080** ← must match |
| Health check path | `/healthz` |

Leave environment variables empty; the container defaults `PORT` to 8080.

First deployment takes about 5 minutes, then the console shows:

```
Default domain: https://xxxxxxxx.ap-south-1.awsapprunner.com
```

## A5. Verify

```bash
URL=https://xxxxxxxx.ap-south-1.awsapprunner.com

curl -s -o /dev/null -w "landing  %{http_code}\n" "$URL/"
curl -s -o /dev/null -w "predict  %{http_code}\n" "$URL/predict"
curl -s -o /dev/null -w "docs     %{http_code}  (404 = correctly blocked)\n" "$URL/api/docs"

curl -s -X POST "$URL/api/predict" \
  -H 'Content-Type: application/json' \
  -d '{"clump_thickness":8,"uniformity_of_cell_size":10,"uniformity_of_cell_shape":10,
       "marginal_adhesion":8,"single_epithelial_cell_size":7,"bare_nuclei":10,
       "bland_chromatin":9,"normal_nucleoli":7,"mitoses":1}'
```

Expected:

```json
{"prediction":1,"label":"Malignant","probability":{"benign":0.0328,"malignant":0.9672}}
```

## A6. Redeploying after a change

```bash
docker build --platform linux/amd64 -t cytology-classifier .
docker tag cytology-classifier:latest $ECR_URI:latest
docker push $ECR_URI:latest

aws apprunner start-deployment \
  --service-arn $(aws apprunner list-services \
      --query "ServiceSummaryList[?ServiceName=='cytology-classifier'].ServiceArn" \
      --output text) \
  --region $AWS_REGION
```

## A7. Cost control

App Runner bills for provisioned memory even while idle. Pause it when you are not
demoing:

```bash
SVC=$(aws apprunner list-services \
      --query "ServiceSummaryList[?ServiceName=='cytology-classifier'].ServiceArn" \
      --output text)

aws apprunner pause-service  --service-arn $SVC --region $AWS_REGION
aws apprunner resume-service --service-arn $SVC --region $AWS_REGION
aws apprunner delete-service --service-arn $SVC --region $AWS_REGION   # stops all charges
```

---

# Option B — EC2 free tier

Runs your existing `docker-compose.yml` with **no file changes**. Free for 12
months on a `t3.micro`.

## B1. Launch the instance

**EC2 → Launch instance**:

| Setting | Value |
| --- | --- |
| Name | `cytology-classifier` |
| AMI | Ubuntu Server 24.04 LTS |
| Instance type | `t3.micro` (or `t2.micro`) — free-tier eligible |
| Key pair | Create one and download the `.pem` |
| Storage | 8–16 GiB gp3 |

Security group inbound rules:

| Type | Port | Source |
| --- | --- | --- |
| SSH | 22 | **My IP** |
| Custom TCP | 3000 | Anywhere (`0.0.0.0/0`) |

Restrict SSH to your own IP — never leave port 22 open to the world.

## B2. Connect and install Docker

```bash
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

On the instance:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
exit                     # log out and back in so the group applies
```

## B3. Clone and run

```bash
ssh -i ~/Downloads/your-key.pem ubuntu@<EC2_PUBLIC_IP>

git clone https://github.com/dhanishmohd1136/breast-cancer-prediction.git
cd breast-cancer-prediction
docker compose up -d --build      # first build takes a few minutes

docker compose ps                 # both should be "healthy"
```

Open **http://\<EC2_PUBLIC_IP\>:3000**.

## B4. Serving on port 80 instead (optional)

To drop `:3000` from the URL, add an override file — this leaves your local
development setup untouched:

```bash
cat > docker-compose.prod.yml <<'EOF'
services:
  frontend:
    ports:
      - "80:80"
EOF

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Then open port 80 in the security group. For HTTPS you need a domain plus a TLS
proxy such as Caddy or nginx with certbot — App Runner gives you that for free,
which is the main trade-off of this option.

## B5. Updating

```bash
cd breast-cancer-prediction
git pull
docker compose up -d --build
```

---

# Option C — Fully browser-based (no terminal at all)

Everything below happens in the AWS console. You paste one setup script into the
launch wizard and the instance installs Docker, clones the repo and starts the app
by itself.

## What is and is not possible without a terminal

| Path | Console-only? | Why |
| --- | --- | --- |
| **EC2 + User Data** | ✅ **yes** | The script runs on the instance at first boot |
| App Runner from ECR | ❌ no | Pushing an image to ECR needs Docker on your machine |
| App Runner from GitHub | ❌ no | Source builds only support managed runtimes, not our Dockerfile |
| CodeBuild → ECR → App Runner | ✅ yes, but heavy | Several services to wire up by hand |

AWS CloudShell does not help here — it has no Docker daemon, so it cannot build
or push the image.

## C1. Launch the instance

**EC2 → Instances → Launch instances**

| Setting | Value |
| --- | --- |
| Name | `cytology-classifier` |
| AMI | **Ubuntu Server 24.04 LTS** |
| Instance type | **t3.micro** (free-tier eligible) |
| Key pair | *Proceed without a key pair* — you will not need SSH |
| Storage | **20 GiB** gp3 (the 8 GiB default is too small for the build) |

**Network settings → Edit → Security group**, add one inbound rule:

| Type | Port | Source | Description |
| --- | --- | --- | --- |
| Custom TCP | **3000** | Anywhere `0.0.0.0/0` | Web app |

You do not need to open port 22 at all, since nothing here uses SSH.

## C2. Paste the setup script

Expand **Advanced details**, scroll to the **User data** box at the very bottom,
and paste this exactly:

```bash
#!/bin/bash
set -eux
exec > /var/log/app-setup.log 2>&1

# 1 GB of swap - t3.micro has only 1 GB of RAM and the frontend build needs more.
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

apt-get update
apt-get install -y docker.io docker-compose-v2 git
systemctl enable --now docker

cd /opt
git clone https://github.com/dhanishmohd1136/breast-cancer-prediction.git
cd breast-cancer-prediction

# Serve on port 3000, restart automatically if the instance reboots.
docker compose up -d --build

echo "SETUP COMPLETE"
```

Then click **Launch instance**.

The swap line matters: `t3.micro` has 1 GB of RAM and the Vite build will run out
of memory without it.

## C3. Wait, then open the site

The first boot installs Docker and builds both images, which takes roughly
**5–10 minutes**. There is nothing to watch — just wait.

Then in **EC2 → Instances**, select the instance and copy its **Public IPv4
address**, and open:

```
http://<PUBLIC_IP>:3000
```

Load a preset on the predict page and run the classifier to confirm the API is
working end to end.

## C4. If the page does not load

Give it a few more minutes first — the build is slow on a `t3.micro`.

To see what happened, use **EC2 Instance Connect**, which is a terminal *inside the
browser*, no key pair or local terminal needed:

1. Select the instance → **Connect** → **EC2 Instance Connect** tab → **Connect**
2. In the browser shell:

```bash
sudo tail -50 /var/log/app-setup.log     # look for SETUP COMPLETE
cd /opt/breast-cancer-prediction && sudo docker compose ps
```

Both containers should show `healthy`.

For Instance Connect to work, the security group needs port 22 open — add an
inbound SSH rule limited to **My IP** if you skipped it earlier.

## C5. Keeping the same IP address

A stopped and restarted instance gets a new public IP. To pin it:
**EC2 → Elastic IPs → Allocate**, then **Actions → Associate** it with your
instance. An Elastic IP is free while attached to a running instance.

## C6. Stopping charges

**EC2 → Instances → Instance state → Stop** pauses billing for compute (storage
still bills a little). **Terminate** deletes it entirely.

Release any Elastic IP you allocated afterwards — an unattached Elastic IP is
charged.

---

# Troubleshooting

**"Health check failed" on App Runner** — the port must be **8080** and the health
check path `/healthz`. A mismatch here is the usual cause.

**`exec format error`** — the image was built for arm64. Rebuild with
`--platform linux/amd64`.

**`denied: not authorized` on `docker push`** — the ECR login token expires after
12 hours. Re-run the `aws ecr get-login-password ...` command from A3.

**App Runner cannot pull the image** — its ECR access role is missing. Recreate the
service and choose **Create new service role**.

**EC2: `docker: permission denied`** — you did not log out after `usermod -aG
docker`. Disconnect and reconnect the SSH session.

**EC2: page will not load** — check the security group actually allows the port,
and that `docker compose ps` shows both containers healthy.

---

# Note on the GCP files

`DEPLOY-GCP.md` and `.gcloudignore` are Google-specific and are simply ignored by
AWS. Leave them if you might deploy to GCP later, or delete both:

```bash
git rm DEPLOY-GCP.md .gcloudignore && git commit -m "Drop GCP deployment files"
```
