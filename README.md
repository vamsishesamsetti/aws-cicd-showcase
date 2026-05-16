# aws-cicd-showcase

A production-ready **Task Manager REST API** demonstrating a complete AWS DevOps pipeline:
**GitHub Actions CI/CD → Amazon ECR → EC2** with Node.js, DynamoDB, and Docker.

## Architecture

```
Developer Push
      │
      ▼
┌─────────────────────────────────────────────┐
│           GitHub Actions                    │
│                                             │
│  ┌─────────┐   ┌──────────────────────┐    │
│  │   CI    │   │         CD           │    │
│  │         │   │                      │    │
│  │ Lint    │   │ 1. Build Docker img  │    │
│  │ Test    │──▶│ 2. Push to ECR       │    │
│  │         │   │ 3. SSH → EC2 deploy  │    │
│  └─────────┘   └──────────────────────┘    │
└─────────────────────────────────────────────┘
                          │
          ┌───────────────┼──────────────────┐
          ▼               ▼                  ▼
   ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
   │ Amazon ECR  │ │  EC2 (t3.   │ │  DynamoDB     │
   │ (Container  │ │  micro)      │ │  (cicd-users  │
   │  Registry)  │ │  Docker      │ │   cicd-tasks) │
   └─────────────┘ └──────────────┘ └───────────────┘
                          │
                  CloudWatch Logs
```

## AWS Services Used

| Service | Purpose |
|---|---|
| **EC2** | Runs the Docker container (t3.micro, free tier eligible) |
| **ECR** | Stores Docker images with versioned tags |
| **DynamoDB** | NoSQL storage for users and tasks |
| **IAM** | Least-privilege roles for EC2 and GitHub Actions |
| **CloudWatch** | Container logs and EC2 metrics |

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, returns JWT |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | Bearer token | Get current user |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | Bearer token | List tasks (filter: `?status=todo`) |
| POST | `/tasks` | Bearer token | Create task |
| GET | `/tasks/:id` | Bearer token | Get task by ID |
| PUT | `/tasks/:id` | Bearer token | Update task |
| DELETE | `/tasks/:id` | Bearer token | Delete task |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check (used by EC2/ALB) |

**Task status values:** `todo` · `in-progress` · `done`

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Run locally
```bash
git clone https://github.com/vamsishesamsetti/aws-cicd-showcase.git
cd aws-cicd-showcase

# Start API + local DynamoDB (tables auto-created)
docker compose up --build

# API is live at http://localhost:3000
curl http://localhost:3000/health
```

### Run tests
```bash
npm install
npm test
npm run test:coverage
```

---

## AWS Setup (one-time)

### 1. Create DynamoDB Tables

```bash
# Users table
aws dynamodb create-table \
  --table-name cicd-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName":"email-index",
    "KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],
    "Projection":{"ProjectionType":"ALL"},
    "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
  }]' \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1

# Tasks table
aws dynamodb create-table \
  --table-name cicd-tasks \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=taskId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=taskId,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 2. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name aws-cicd-showcase \
  --region us-east-1
```

### 3. Create IAM User for GitHub Actions

Create an IAM user with this policy (minimum required permissions):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:*:repository/aws-cicd-showcase"
    }
  ]
}
```

### 4. Launch EC2 Instance

- **AMI:** Amazon Linux 2023
- **Instance type:** t3.micro (free tier)
- **Security group inbound rules:**
  - Port 22 (SSH) — your IP only
  - Port 3000 (API) — 0.0.0.0/0

**Install Docker on EC2:**
```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install AWS CLI (for ECR login on the instance)
sudo yum install -y awscli
```

Attach an **IAM instance profile** to EC2 with ECR read permissions so it can pull images.

### 5. Add GitHub Secrets

Go to **repo Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | `us-east-1` |
| `ECR_REGISTRY` | `<account-id>.dkr.ecr.us-east-1.amazonaws.com` |
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | Contents of your `.pem` private key file |
| `JWT_SECRET` | A long random string (use `openssl rand -hex 32`) |

---

## CI/CD Pipeline

### CI — runs on every push and PR
```
push / PR → lint → test → upload coverage artifact
```

### CD — runs only on push to `main`
```
push to main → test → build Docker → push ECR → SSH EC2 → pull image → restart container → health check
```

Each deployment is tagged with the **git commit SHA** so you can roll back to any previous version:
```bash
docker pull <ecr-registry>/aws-cicd-showcase:<commit-sha>
```

---

## Example Requests

```bash
BASE=http://localhost:3000

# Register
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vamsi@example.com","password":"secret123","name":"Vamsi"}'

# Login → copy the token
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vamsi@example.com","password":"secret123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create task
curl -X POST $BASE/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy to AWS","description":"Set up ECR and EC2","status":"in-progress"}'

# List tasks
curl -H "Authorization: Bearer $TOKEN" $BASE/tasks

# Filter by status
curl -H "Authorization: Bearer $TOKEN" "$BASE/tasks?status=todo"
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | AWS DynamoDB |
| Auth | JWT + bcryptjs |
| Container | Docker (multi-stage build, non-root user) |
| Registry | Amazon ECR |
| Compute | Amazon EC2 |
| CI/CD | GitHub Actions |
| Monitoring | CloudWatch (container logs) |
| Rate Limiting | express-rate-limit |
