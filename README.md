# YoPrint React Coding Project – Anime Search App

A two-page React + TypeScript + Vite application built with Redux Toolkit and the Jikan API.

---

## 🌐 Live Demo
https://your-site-name.netlify.app
> Replace with your actual Netlify URL after deploy.

---

## 🧩 Overview
**Page 1:** Search page displaying anime results with instant search (250 ms debounce, in-flight cancellation).  
**Page 2:** Detail page showing anime information with poster, rating, synopsis, and metadata.

**Built with**
- React 18 + TypeScript + Vite  
- Redux Toolkit (state management)  
- React Router DOM (navigation)  
- Jikan API (free, no auth required)

---

## ⚙️ Run Locally
```bash
npm install
npm run dev
# Runs on http://localhost:4000
If port 4000 is in use, stop other dev servers and rerun.

🧠 Core Features
Instant search with 250 ms debounce and abortable requests (AbortController)
Server-side pagination
Detailed anime page at /anime/:id
Typed Redux Toolkit slices and thunks
Responsive neon UI (desktop + mobile)
SPA routing (Netlify redirects)

💎 Bonus Implementation
🎨 User Experience
Futuristic glass-neon UI with motion and glow effects
Skeleton loaders for search results and detail hero
Helpful empty and error states with search suggestions
Mobile-first full-screen search sheet with scroll lock and safe-area padding
Responsive layout with swipe snap points and desktop arrow hints

⚙️ Technical Excellence
Abortable search pipeline (prevents race conditions)
Debounced instant search (250 ms) with retry guards and rate-limit messaging
Server-side pagination driven by Redux state
Type-safe Redux Toolkit code (minimal any)
SPA routing handled via /* /index.html 200 in public/_redirects
Note: Unit tests are not included in this submission.

🧾 AI Usage
See PROMPTS.md for all ChatGPT / Cursor prompts and their contexts.

✅ Submission Checklist
 npm only
 Runs on port 4000 (npm run dev)
 No environment variables
 Search and Detail pages work
 Redux implemented
 Live Netlify URL included
 PROMPTS.md documented
 Bonus features listed
