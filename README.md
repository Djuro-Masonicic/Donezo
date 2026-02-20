# Donezo – Smart Task Manager with AI Prioritization

A full-stack productivity app that uses AI (OpenAI GPT-4o-mini) to prioritize tasks, parse natural language input, and generate daily productivity plans.

## Features

- **CRUD Tasks** – Create, read, update, delete tasks with rich metadata
- **Projects & Tags** – Organize tasks under projects with colors/icons and tag them
- **AI Priority Score** – Automatic score (0–100) based on urgency, importance, due date, effort, and priority label
- **Natural Language Input** – "Finish report by Friday, high priority, 3 hours" → structured task
- **AI Daily Plan** – GPT generates a morning/afternoon plan from your active tasks
- **AI Priority Advisor** – Per-task AI suggestions on urgency/importance
- **Calendar View** – Visual monthly calendar with tasks grouped by due date
- **Analytics Dashboard** – Productivity trends, completion rates, status/priority breakdowns, overdue alerts
- **Subtasks** – Nested checklist within tasks
- **Recurring Tasks** – Support structure for daily/weekly/monthly recurrence

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS v4 |
| State | TanStack Query + Zustand |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | OpenAI API (gpt-4o-mini) |

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)
- OpenAI API key

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smarttaskmanager
OPENAI_API_KEY=sk-...your-key-here...
```

### 3. Start development servers
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Priority Score Algorithm

Each task gets a score (0–100+) computed from:

| Factor | Weight |
|--------|--------|
| Urgency (1–10) | ×2 |
| Importance (1–10) | ×3 |
| Due date proximity | +5 to +40 |
| Effort (quick wins boost) | ±5 |
| Priority label | −5 to +20 |
| Overdue | +40 |

## Project Structure

```
SmartTaskManager/
├── server/
│   ├── models/          # Mongoose schemas (Task, Project, Tag)
│   ├── routes/          # Express route handlers
│   ├── services/        # AI service (OpenAI integration)
│   └── index.js         # Express app entry
└── client/
    └── src/
        ├── api/         # Axios API client
        ├── components/  # React components
        │   ├── layout/  # Sidebar, AppLayout
        │   ├── tasks/   # TaskCard, TaskModal, NlpModal, DailyPlanModal
        │   ├── projects/# ProjectModal
        │   └── ui/      # Badges, Modal, shared UI
        ├── pages/       # DashboardPage, TasksPage, CalendarPage, AnalyticsPage
        ├── store/       # Zustand store
        └── utils/       # Helpers & constants
```
