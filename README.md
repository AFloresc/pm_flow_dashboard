# PRO-FLOW: Enterprise Project Manager Dashboard

PRO-FLOW is a modern, high-performance, and high-contrast full-stack project management dashboard. Designed with a sleek, space-age **Bento Grid** theme, it provides seamless timeline tracking (interactive Gantt charts), granular task/subtask workflows, real-time resource allocations, and Gemini AI-driven productivity audits and automated reports.

---

## 🚀 Digital Stack

PRO-FLOW is built on a modern, robust, full-stack environment utilizing state-of-the-art developer tooling:

### Frontend
- **React 19 & TypeScript**: Provides type safety, scalable rendering, and modern functional components.
- **Vite & @tailwindcss/vite**: Next-generation lightning-fast asset bundler, paired with **Tailwind CSS v4** for beautiful utility-first styling.
- **Material-UI (MUI v6)**: Offers a gorgeous, rich suite of accessible, robust, custom-themed UI elements.
- **Lucide Icons**: Clean, light, and customizable SVG vectors for uniform iconography.
- **Motion**: Fluid Micro-animations and high-performance physical tab transition behaviors.

### Backend & Cloud Services
- **Node.js & Express**: Simple, high-performance web server that serves static frontend assets in production and exposes API routes.
- **Firebase Authentication**: Robust, secure cloud authentication for team accounts.
- **Cloud Firestore**: Real-time NoSQL persistent database hosting live projects, task updates, subtasks, and collaborator comments.
- **Server-Side Gemini AI (Gemini 3.5 Flash via @google/genai SDK)**: Runs server-side prompt engineering to audit critical paths, locate capacity bottlenecks, detect schedule deviations, and recommend specific resource re-allocations safely away from browser exposure.

---

## 📂 Project Structure

The codebase is meticulously structured to optimize modularity, type safety, and maintainability:

```text
├── .env.example                  # Template for local environment secrets (e.g., GEMINI_API_KEY)
├── .gitignore                    # Prevents build output, cache, and node_modules from leaking to Git
├── assets/                       # Custom static graphics or assets
├── firebase-applet-config.json   # Secure connection configs for Firebase
├── index.html                    # Single Page Application HTML shell
├── metadata.json                 # AI Studio sandbox configuration (app permissions & capabilities)
├── package.json                  # Node.js dependencies, build pipelines, and start scripts
├── server.ts                     # Custom Express Node server (manages Vite middleware + API routes)
├── tsconfig.json                 # Strict TypeScript compiler flags
├── vite.config.ts                # Bundling and Tailwind CSS plugin configuration
└── src/
    ├── App.tsx                   # Central React shell (theme provider, workspace tabs, active view)
    ├── firebase.ts               # Local SDK initialization for Firebase Auth & Firestore
    ├── index.css                 # Global CSS entry (loads Inter + JetBrains Mono and defines custom scrollbars)
    ├── main.tsx                  # Standard React DOM tree renderer
    ├── types.ts                  # Shared TypeScript interfaces, roles, and entities
    ├── components/
    │   ├── AuthScreen.tsx        # Dynamic sign-in portal with live Firebase authentication + Demo shortcuts
    │   ├── AutomatedReporting.tsx # Exporters (PDF, JSON) + Server-Side Gemini AI audit workspace
    │   ├── GanttChart.tsx        # Customized timeline layout highlighting expected vs real task periods
    │   ├── ResourceAllocation.tsx # Resource matrix, cost registries, and member hour load tracker
    │   └── TaskTracking.tsx      # Taskboards, checklist managers, progress logs, and comment feeds
    └── hooks/
        └── useProjectData.ts     # Firebase synchronization engine with fail-safe LocalStorage fallbacks
```

---

## ✨ Features & Functionality

PRO-FLOW is packed with enterprise-ready project management modules:

1. **Space-Age Bento Grid UI Theme**
   - Immersive, dark space-slate visuals with glowing border accents and rounded Bento cards.
   - Smooth physical navigation powered by custom MUI components.
   - Gorgeous typography pairing: **Inter** (sans-serif) for general copy and **JetBrains Mono** for financial/timeline data.

2. **Gantt Chart Timeline**
   - High-contrast visual gantt rows illustrating **Expected Timeline** vs **Real Execution Timeline**.
   - Integrates interactive event handlers—click any timeline task to immediately jump to its active workspace.
   - Live indicators pointing to delayed, pending, and completed phases.

3. **Active Work Tasks & Backlog Panel**
   - Complete CRUD operations on tasks.
   - Supports subtask checklists, chronological task logs, and a real-time team comment/discussion feed.
   - Real-time percentage progress sliders.

4. **Resource Matrix & Allocations**
   - Resource cost registry: billing rates per hour for employees, or flat unit costs for physical hardware/material resources.
   - Tracks team workload metrics. Staff members with allocations exceeding 40 hours are highlighted as overloaded to prevent burnout.

5. **Automated Audits & Exporters**
   - Instantly downloads a complete **PDF Audit Report** containing financials, registries, progress levels, and date ranges.
   - Export full project datasets in lightweight **JSON** format.
   - **Gemini AI Audit Tool**: Initiates a server-side intelligence model to inspect delays, locate bottlenecks, calculate financial variances, and suggest optimal resource re-assignments.
   - **Export AI Optimization Report as PDF**: Once Gemini AI completes its project analysis, an "Export AI PDF" action unlocks instantly. Users can download a dedicated, styled multi-page PDF containing the exact strategic advice, bottlenecks, and re-allocations recommended by Gemini.

---

## 🔐 How the Demo Sign-In Works

To streamline sandbox previewing, testing, and developer auditing, **PRO-FLOW** implements a dual-mode Auth mechanism:

- **Firebase Mode**: Users can sign up with custom emails, choose their roles, and login. Authentication tokens are verified by Google Auth, and their persistent roles are hosted in Firestore.
- **Instant Demo Mode**: Located under the `OR DEMO SIGN-IN` divider. Clicking **Manager Mode** or **Collaborator Mode** activates the `loginDemoUser` function. This bypassed state loader:
  1. Instantiates a mock user profile with pre-defined security roles (`demo_manager` with `"manager"` role, or `demo_member` with `"member"` role).
  2. Saves the JSON session string directly into client-side `localStorage` under the `"pm_current_user"` key.
  3. Seamlessly calls `onAuthSuccess` to grant immediate access to dashboards.
  4. Allows testers to preview role-based features (like editing campaigns and adding resources, which are gated for standard members) instantly.

---

## 🛠️ Installation & Running Locally

Follow these steps to spin up the full-stack development workspace on your local machine:

### 1. Prerequisite
Ensure you have **Node.js** (v18 or higher) and **npm** installed.

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Setup Environment Secrets
Create a `.env` file in the root directory and specify your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the Development Server
Kick off the live-reloading dev workspace using tsx & express:
```bash
npm run dev
```
The application will boot on **http://localhost:3000**.

### 5. Production Build & Execution
To bundle all assets and compile the server entry point:
```bash
npm run build
npm start
```
The production server compiles TypeScript bundles into `dist/server.cjs` and hosts static files natively.
