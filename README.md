<div align="center">

# 🚀 DevCollab

### *GitHub Meets Notion Meets Slack — Powered by AI*

**A next-generation real-time collaboration platform for developer teams.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Overview

**DevCollab** is a unified, AI-powered collaboration ecosystem built specifically for student developers, startup teams, freelancers, and hackathon groups. Instead of juggling multiple tools — Trello for tasks, Slack for communication, Notion for docs, GitHub for snippets — DevCollab merges everything into one seamless workspace.

> *"A professional SaaS collaboration platform that could realistically become a startup product."*

---

## ✨ Key Features

### 🧠 AI Project Assistant
- **Task Breakdown Generator** — Describe a feature; AI auto-generates 6 actionable subtasks and pushes them to your Kanban board
- **Project Summarizer** — Scans all task statuses and produces progress summaries, sprint updates, and meeting reports
- **Blocker Detector** — Identifies overdue, stalled, or P0-risk tasks with AI-powered remediation suggestions
- **Standup Report Generator** — Automatically creates daily standup reports formatted with Yesterday / Today / Blockers
- **AI Code Reviewer** — Paste any code snippet for an instant quality score (1–10) with detailed Bug, Performance, Readability, and Security analysis

### 📋 Kanban Task Board
- **Drag-and-drop** workflow across **To Do → In Progress → In Review → Done** columns
- Full task detail modals with priority (P0/P1/P2), due dates, labels, checklists, attachments, and assignees
- Real-time cross-user board synchronization via Socket.IO
- Threaded task comments with **@mention** support triggering smart notifications

### ⚡ Real-Time Collaboration
- WebSocket-powered live updates — move a task and every connected team member sees it instantly
- **Live Presence Indicators** showing who is online and which task they're currently viewing
- Socket rooms scoped per project for efficient event broadcasting

### 📚 Documentation Wiki
- Notion-style rich-text wiki pages per project
- **Version History** — every save creates a versioned snapshot with full rollback support
- Hierarchical page nesting (parent-child document linking)
- Real-time collaborative editing awareness

### 💻 Code Snippet Manager
- Team-shared snippet library with syntax highlighting
- Language tagging, searchable by title/tag/description
- One-click copy to clipboard
- Direct **"Review with AI"** pipeline from any snippet to the AI Code Reviewer

### 🔔 Smart Notification Center
- Instant in-app notifications for task assignments, @mentions, status changes, and workspace invitations
- Mark individual or all notifications as read
- Notification badges on the header with zero-latency delivery

### 📡 Activity Feed
- Chronological log of all workspace actions — task moves, comments, document edits, member joins, and AI operations
- Filterable per workspace with timestamps

### 💳 Subscription & Tier System
- **Free Tier**: 1 workspace, 3 projects, 5 team members
- **Pro Tier**: Unlimited projects, unlimited collaborators, full AI access
- Sandbox checkout modal with card validation simulation

### 👤 Developer Profiles
- Avatar (auto-generated via DiceBear), bio, skill tags, GitHub profile link
- Role-based access: **Owner → Admin → Member → Viewer**

---

## 🏗 Architecture

```
devcollab/
├── client/                     # React + Vite Frontend (SPA)
│   └── src/
│       ├── components/
│       │   ├── KanbanBoard.jsx     # Drag-and-drop task board
│       │   ├── TaskModal.jsx       # Full task detail & comments
│       │   ├── AiAssistant.jsx     # AI tools panel (4 AI features + code review)
│       │   ├── WikiSection.jsx     # Notion-style wiki with version history
│       │   ├── SnippetManager.jsx  # Code snippet library
│       │   ├── ActivityFeed.jsx    # Real-time activity timeline
│       │   ├── Sidebar.jsx         # Workspace navigator & project switcher
│       │   ├── Header.jsx          # Notifications, presence, user menu
│       │   └── PaymentsModal.jsx   # Sandbox Pro checkout
│       ├── context/
│       │   ├── AppContext.jsx       # Global auth, workspace, project state
│       │   └── SocketContext.jsx   # Socket.IO connection provider
│       └── utils/
│           └── mockApi.js          # API utility layer
│
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── server.js               # Express routes + Socket.IO controllers
│   ├── db.js                   # File-persisted in-memory data layer (JSON)
│   └── aiService.js            # AI logic engine (breakdown, review, standup, etc.)
│
├── package.json                # Monorepo root with concurrent dev scripts
└── vercel.json                 # Frontend deployment config
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Vanilla CSS (custom dark design system) |
| **UI Icons** | Lucide React |
| **Real-Time** | Socket.IO Client + Server |
| **Backend** | Node.js, Express 4 |
| **Persistence** | File-backed JSON store (no external DB required) |
| **AI Engine** | Rule-based heuristic AI service (extensible to Gemini/OpenAI APIs) |
| **Deployment** | Vercel (frontend), any Node host (backend) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v8 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/vishaaLTS/Collaboration-platforms-for-developers.git
cd Collaboration-platforms-for-developers
```

### 2. Install All Dependencies

```bash
npm run install:all
```

This single command installs dependencies for the root, server, and client simultaneously.

### 3. Start Development Servers

```bash
npm run dev
```

This launches both servers concurrently:
- **Frontend** → `http://localhost:3000`
- **Backend API + WebSockets** → `http://localhost:5050`

---

## 🔐 Demo Accounts

The server auto-seeds a shared sandbox workspace on first boot. Use any of these credentials to log in immediately:

| Name | Email | Password | Role |
|---|---|---|---|
| Ankush | `ankush@devcollab.com` | `password123` | Workspace Owner |
| Riya | `riya@devcollab.com` | `password123` | Admin |
| Siddharth | `siddharth@devcollab.com` | `password123` | Member |

> You can also **Register** a new account — it will automatically be added to the shared "DevCollab Sandbox" workspace.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & receive token |
| `GET` | `/api/auth/verify/:userId` | Validate session |

### Workspaces & Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces?userId=` | List user's workspaces |
| `POST` | `/api/workspaces` | Create workspace |
| `POST` | `/api/workspaces/:id/invite` | Invite member by email |
| `POST` | `/api/workspaces/:id/join` | Accept invite & join |
| `GET` | `/api/workspaces/:id/projects` | List workspace projects |
| `POST` | `/api/projects` | Create project |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task (status, assignee, etc.) |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/tasks/:id/comments` | Get task comments |
| `POST` | `/api/comments` | Add comment + trigger @mentions |

### Wiki & Snippets
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/docs` | List wiki pages |
| `POST` | `/api/docs` | Create wiki page |
| `PUT` | `/api/docs/:id` | Update page (auto-versions) |
| `POST` | `/api/docs/:id/rollback` | Rollback to prior version |
| `DELETE` | `/api/docs/:id` | Delete page |
| `GET` | `/api/projects/:id/snippets` | List snippets |
| `POST` | `/api/snippets` | Save snippet |
| `DELETE` | `/api/snippets/:id` | Delete snippet |

### AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/breakdown` | Generate task breakdown from feature description |
| `POST` | `/api/ai/summarize` | Generate project progress summary |
| `POST` | `/api/ai/blockers` | Detect and diagnose blocked tasks |
| `POST` | `/api/ai/standup` | Generate daily standup report |
| `POST` | `/api/ai/review` | AI code review with quality score |

### Notifications & Activity
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:id/notifications` | Get user notifications |
| `POST` | `/api/notifications/:id/read` | Mark single read |
| `POST` | `/api/notifications/read-all` | Mark all read |
| `GET` | `/api/workspaces/:id/activities` | Get activity feed |
| `POST` | `/api/payments/checkout` | Sandbox Pro upgrade |

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join_project` | Client → Server | Join a project room, register presence |
| `viewing_task` | Client → Server | Broadcast which task a user is viewing |
| `leaving_task` | Client → Server | Clear task viewing presence |
| `presence_updated` | Server → Client | Broadcast updated presence map |
| `task_changed` | Server → Client | Task created / updated / deleted |
| `comment_changed` | Server → Client | Comment posted in real-time |
| `doc_changed` | Server → Client | Wiki page created / updated / deleted |
| `tasks_reload` | Server → Client | Board reload after AI task generation |

---

## 💳 Subscription Tiers

| Feature | Free | Pro |
|---|---|---|
| Workspaces | 1 | Unlimited |
| Projects per workspace | 3 | Unlimited |
| Team members per workspace | 5 | Unlimited |
| AI Assistant features | Limited | Full Access |
| Code Snippet storage | ✅ | ✅ |
| Wiki with Version History | ✅ | ✅ |
| Real-Time Collaboration | ✅ | ✅ |

> **Sandbox Checkout**: Use any 16-digit card number + 3-digit CVC to simulate a Pro upgrade.

---


## 🗺 Roadmap

- [ ] Persistent MongoDB/PostgreSQL backend integration
- [ ] Gemini API / OpenAI GPT integration for production-grade AI
- [ ] Calendar view for deadline tracking
- [ ] Analytics dashboard with charts (task velocity, team productivity)
- [ ] Real-time collaborative document editing (operational transforms)
- [ ] Email notification system (SMTP/SendGrid)
- [ ] GitHub OAuth integration
- [ ] Mobile app (React Native)

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Owner** | Full control — create projects, manage members, billing, analytics |
| **Admin** | Manage tasks, moderate comments, edit wiki, view logs |
| **Member** | Create/update tasks, comment, upload snippets, use AI tools |
| **Viewer** | Read-only — view projects, docs, and progress |

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

*DevCollab — Collaborate Smarter. Ship Faster.*

</div>
