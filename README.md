# ClarityHQ 💡🧠  
**Focus Smarter. Feel Better.**  
A productivity app designed for neurodivergent brains, built with React, Vite, Supabase, and Bolt-powered AI prompts.

![GitHub repo size](https://img.shields.io/github/repo-size/Teach-On/ClarityHQ_ADHD?color=blue&style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/Teach-On/ClarityHQ_ADHD?style=flat-square)
![License](https://img.shields.io/github/license/Teach-On/ClarityHQ_ADHD?style=flat-square)

---

## 🧠 What is ClarityHQ?

**ClarityHQ** is a compassionate productivity app tailored for users with ADHD, executive dysfunction, or anyone looking for a smarter, mood-aware way to manage their day.

Built around supportive, AI-assisted task management, ClarityHQ helps users:
- Break tasks into small, doable steps
- Match activities to mood and energy level
- Track progress and build consistency with encouragement, not shame

---

## ✨ Key Features

- ✅ **Mood-Based Task Matching**  
  Suggests tasks based on current energy and emotional state

- ✅ **Daily Check-Ins**  
  Gentle, guided reflections to help plan your day

- ✅ **Task Energy Planner**  
  Sorts tasks by required energy level to reduce overwhelm

- ✅ **AI Companion Coach**  
  Offers encouragement, support, and next-step prompts

- ✅ **Built with Bolt AI Prompts**  
  Modular `.prompt` files power every smart feature (editable in `.bolt/prompt/`)

---

## 🛠 Tech Stack

- **React + Vite** (Frontend)
- **Supabase** (Auth, DB, Functions)
- **Tailwind CSS** (Styling)
- **Zustand** (State management)
- **Bolt AI** (Local AI prompt agent framework)
- **TypeScript**

---

## 🚀 Installation

```bash
# 1. Clone the repo
git clone https://github.com/Teach-On/ClarityHQ_ADHD.git
cd ClarityHQ_ADHD/project

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

> Make sure you have Node.js ≥ 18 installed

---

## 🔐 Environment Variables

Create a `.env` file based on `.env.example` with your Supabase keys, Stripe test keys, etc.

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📁 Project Structure

```
/project
├── .bolt/               # AI prompt agents
├── public/              # Icons and PWA assets
├── src/                 # Main app logic and components
├── supabase/            # Edge Functions & SQL migrations
├── package.json         # App config and dependencies
└── vite.config.ts       # Vite build config
```

---

## 🧪 Development Notes

- Run `npm install` before executing `npm run lint` or `npm run build` to ensure all dev dependencies like `@eslint/js` and `vite` are available
- Run `npm run build` for a production-ready output
- Prompts can be edited in `.bolt/prompt/*.prompt` and tested with Bolt when tokens are available
- Uses Tailwind for responsive styling and Framer Motion for smooth UI interactions

---

## 📬 Feedback & Collaboration

Got feedback or want to contribute? Open an issue or submit a PR — your support helps shape ClarityHQ.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for full details.
