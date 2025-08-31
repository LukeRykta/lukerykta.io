# 🌐 lukerykta.io

> A full-stack playground powered by **Angular**, **Spring Boot**, and **Terraform**, all orchestrated with ⚡ **Nx**.

![GitHub last commit](https://img.shields.io/github/last-commit/LukeRykta/lukerykta.io?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/LukeRykta/lukerykta.io/ci.yml?style=flat-square&label=CI)
![License](https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square)

---

## ✨ Features

- 🎨 **Frontend** – Angular app with modern signals, SSR-ready, and Tailwind CSS (soon™).
- 🚀 **Backend** – Spring Boot 3, Gradle, MySQL + Batch jobs.
- 🛠 **Infra** – Terraform IaC for cloud deployment.
- ⚡ **Nx Monorepo** – single command runner, project graph, smart build cache.

---

## 📂 Project Structure

```bash
lukerykta.io/
├── frontend/   # Angular app (served at http://localhost:4200)
├── backend/    # Spring Boot app (Gradle based, REST APIs)
├── infra/      # Terraform IaC
├── nx.json     # Nx workspace config
└── package.json
```

## 🏃 Getting Started
### 1. Clone & install

```bash
git clone https://github.com/yourusername/lukerykta.io.git
cd lukerykta.io
pnpm install
```

### 2. Run the apps
Frontend (Angular) :
```bash
pnpm exec nx serve frontend
```

Backend (Spring Boot) :
```bash
pnpm exec nx serve backend
```

Infrastructure (Terraform) :
```bash
cd infra
terraform init
terraform plan
```
## 🖥 Commands
  - ``nx serve frontend`` → Run Angular dev server on http://localhost:4200
  - ``nx serve backend`` → Boot Spring app via Gradle
  - ``nx build <project>`` → Build frontend or backend
  - ``nx test <project>`` → Run tests
  - ``nx graph`` → Visualize dependency graph

## 🧭 Roadmap
 - Add Tailwind + Angular Material UI kit
 - Secure backend with JWT auth
 - Hook up CI/CD with GitHub Actions + Terraform deploys
 - Launch 🚀 lukerykta.io
