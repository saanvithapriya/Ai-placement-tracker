# AI Placement Tracker (APT) 🎯

A full-stack **AI-powered Placement Tracker** built with the MERN Stack.

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** installed and running locally (`mongod`)

### 1. Configure Environment Variables

The default `server/.env` is pre-configured for local MongoDB:

```env
MONGO_URI=mongodb://127.0.0.1:27017/apt-db
JWT_SECRET=your_super_secret_key
```

When you get a Gemini API key, add it:
```env
GEMINI_API_KEY=your_gemini_key
```

### 2. Start MongoDB Locally

```bash
mongod
```

### 3. Run the Backend

```bash
cd server
npm install
npm run dev
```

Server starts at `http://localhost:5000`

### 4. Run the Frontend

```bash
cd client
npm install
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
- **Dashboard & Charts** — Visual analytics with area charts and pie charts

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB (Local) + Mongoose |
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
