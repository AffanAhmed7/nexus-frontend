# Nexus Frontend Client 

Nexus is a premium, enterprise-grade task management platform built for modern product development teams. This repository contains the **React frontend client**, featuring a sleek glassmorphic dashboard, drag-and-drop Kanban boards, real-time collaboration, analytics dashboards, and keyboard shortcuts.

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![State Management](https://img.shields.io/badge/Zustand-4.5-orange?style=flat-square)](https://github.com/pmndrs/zustand)
[![TanStack Query](https://img.shields.io/badge/React_Query-5.0-FF4154?style=flat-square&logo=reactquery)](https://tanstack.com/query/latest)

---

 Key Features

-  Modern Dashboard**: A glassmorphic control center showcasing workspace activity summary, upcoming tasks, project progressions, and quick action widgets.
-  Real-time Kanban Board**: Interactive, fluid drag-and-drop workflow system powered by `@hello-pangea/dnd` with nested list groups.
-  Instant Notifications**: Real-time collaborative updates and action toasts using Socket.io and `react-hot-toast`.
-  Advanced Analytics**: Interactive, animated data charts powered by `Recharts` providing team velocity and completion insight.
-  Hotkeys & Commands**: Quick-actions command menu (⌘K / Ctrl+K), keyboard shortcuts for task creation, and instant search index.
-  Theme Customization**: Native light and dark theme mode, with responsive UI tailoring layout options on mobile screens down to `320px`.

---

 Tech Stack & Dependencies

- **Core**: React 19, Vite, TypeScript
- **State Management**: Zustand (Global state, auth context, theme settings)
- **Data Fetching**: TanStack React Query (HTTP cache synchronization)
- **Router**: React Router Dom v6
- **Drag-and-Drop**: @hello-pangea/dnd
- **Visuals & Charts**: Recharts, Lucide React (Icons)
- **Styling**: Vanilla CSS with comprehensive CSS custom properties (variables)
- **Communication**: Socket.io-client (WebSockets)

---

 Directory Structure

```text
frontend/src/
├── assets/             # Global image assets & static files
├── components/         # Shared ui components (buttons, inputs, modals)
├── hooks/              # Global custom React hooks
├── modules/            # Domain-driven feature modules
│   ├── auth/           # Login, registration, token refresh views
│   └── dashboard/      # Task boards, analytics, workspace sidebar, settings
├── styles/             # Modular CSS stylesheets (Dashboard.css, LandingPage.css)
├── types/              # Domain-specific TypeScript declarations
├── App.tsx             # Main routing and provider setup
└── main.tsx            # Application entrypoint
```

---

 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

### 2. Environment Configuration
Create a `.env` file in the root of the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Running Locally
Run the development server:
```bash
npm run dev
```
The client will be running at [http://localhost:3000](http://localhost:3000).

### 5. Production Build
To create an optimized production bundle:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```
