# AI Placement Tracker (APT) 🎯

A full-stack **AI-powered Placement Tracker** built with the MERN Stack.

## 🚀 Quick Start

### 1. Configure Environment Variables

Edit `server/.env` and fill in your MongoDB Atlas URI:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/apt-db
JWT_SECRET=your_super_secret_key
```

When you get a Gemini API key, add it:
```env
GEMINI_API_KEY=your_gemini_key
```

### 2. Run the Backend

```bash
cd server
npm run dev
```

Server starts at `http://localhost:5000`

### 3. Run the Frontend

```bash
cd client
npm run dev
```

Frontend starts at `http://localhost:5173`

---

## 🌟 Features

- **Kanban Application Tracker** — Track jobs from Applied → Shortlisted → Interview → Offer/Rejected
- **AI Resume Analyzer** — Score your resume with skill gap analysis (mock, Gemini-ready)
- **JD Matcher** — Get a match % between your resume and any job description
- **Interview Prep Chatbot** — AI-powered STAR method coaching
- **Career Insights** — Trending skills, salary ranges, roadmaps
- **Admin Panel** — Manage company drives, view aggregate placement stats
- **3D Globe** — Interactive Three.js globe on the landing page
- **3D AI Orb** — Animated orb on the dashboard and AI page

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| 3D Models | Three.js (raw) |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Mock (Gemini-ready) |

## 📁 Project Structure

```
APT/
├── client/     # React + Vite frontend
└── server/     # Express + MongoDB backend
```

## 🔑 Activating AI (When You Get the Key)

1. Add `GEMINI_API_KEY=your_key` to `server/.env`
2. In `server/services/aiService.js`, uncomment the Gemini code blocks in each function
3. Remove the mock `await new Promise(...)` delays
