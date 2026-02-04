# Lexora

Lexora is a full-stack collaborative knowledge, notes, and publishing
platform with clearly separated public and private zones.

It allows users to manage private notes and workspaces, collaborate
with teams, and publish selected content publicly with SEO optimization.

---

## 🚀 Core Features

### Private Zone
- Secure authentication (JWT + OAuth)
- Personal and team workspaces
- Private notes with file attachments
- Role-based access (Owner, Editor, Viewer)

### Public Zone
- Public blog publishing
- SEO-optimized pages (SSR/SSG)
- Public search and content discovery

### Collaboration
- Shared workspaces
- Comments and activity tracking
- Permission-based access control

---

## 🛠 Tech Stack

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security
- JPA + Hibernate
- PostgreSQL (users, roles, workspaces)
- MongoDB (notes, blog content)
- Redis (caching)
- Kafka (async events)

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS / MUI
- Axios

### DevOps & Infra
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Vercel (Frontend)
- AWS / Render (Backend)

---

## 🧠 Architecture Overview

Lexora follows a layered and modular architecture:

- Frontend handles UI, routing, and API calls
- Backend handles authentication, business logic, and permissions
- Asynchronous communication is used for notifications and activity logs
- Clear separation between public and private content

## 📌 Development Status

- Phase 0: Planning & System Design ✅
- Phase 1: Backend Foundation ⏳
- Phase 2: Authentication ⏳
- Phase 3: Core Notes & Workspaces ⏳