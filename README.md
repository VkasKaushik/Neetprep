# NEET PREP — Personal Preparation Command Center (PWA)

A high-performance, mobile-first Progressive Web App (PWA) engineered specifically for NEET UG aspirants.

> **Core Philosophy**: **PLAN → STUDY → COMPLETE → REVIEW → IMPROVE**  
> NEET PREP is not another cluttered spreadsheet, ERP, or complicated analytics dashboard. It gives you immediate clarity on what to study today, allows 1-tap task completions, tracks syllabus progress, records mock tests with auto-calculations, and turns weak topics into actionable spaced revision.

---

## 🌟 Key Features

### 1. 📱 Native-Feel Progressive Web App (PWA)
- **Installable**: Installs directly on Android, iOS, Windows, macOS with standalone display mode.
- **Offline Capable Shell**: Caches core application assets using service worker (`vite-plugin-pwa`).
- **Dark Glass UI**: Restrained translucent surfaces, backdrop blur, high WCAG contrast, with subtle subject accents (Physics Blue, Chemistry Purple, Biology Green).

### 2. 🧭 Strict 4-Tab Navigation
- **Today**: Daily command center showing countdown to NEET exam date, Overall Preparation progress (68%), Today's Progress bar (6/8 tasks), 1-tap touch checkboxes with optimistic state updates, quick **Log Questions** sheet, and daily summary metrics.
- **Plan**: 14-day horizontal touch date slider, planned vs completed hours against daily targets, task rescheduling, and a weekly overview bar chart.
- **Tests**: Mock test score tracker (Latest, Average, Best score out of 720), test detail breakdown (Physics / Chemistry / Biology marks, % accuracy), actionable **Weak Topics** list with 1-tap **"Create Revision Task"**, and a 4-cycle spaced **Revision Tracker** (Initial, Rev 1, Rev 2, Rev 3, Rev 4).
- **Progress**: Subject progress drilldown (Physics 62%, Chemistry 71%, Biology 78%) with chapter & topic inspection, growth velocity charts (Study Hours, Questions Solved, Mock Scores, Preparation Trend), consistency streak card (12 days), monthly comparison (+6% growth), weekly/monthly reflection prompts, and auto-generated actionable insights.

### 3. ⚡ Lightning-Fast Interactions (1–3 Taps)
- **Complete Task**: 1 tap on touch checkbox.
- **Add Task**: 2–3 taps via floating action button / bottom sheet with auto-populated NEET syllabus chapters and topics.
- **Log MCQs**: 2–3 taps with auto-calculated accuracy and total question counts.
- **Create Revision Task**: 1 tap directly from any flagged weak topic.

### 4. 🔒 Resilient Dual-Mode Persistence (Supabase + Local Fallback)
- **Instant Preview**: Works out of the box with realistic NEET 2027 seed data stored in encrypted local browser storage.
- **Supabase Cloud Sync**: Pre-configured for Supabase PostgreSQL with Row Level Security (RLS) policies. To connect your live Supabase project, provide credentials in `.env` or open the in-app **Backend & Settings** modal.
- Includes `supabase-schema.sql` ready to run in the Supabase SQL editor.

---

## 🛠️ Technology Stack
- **Framework**: React 18 with TypeScript
- **Bundler & PWA**: Vite 6 + `vite-plugin-pwa` (Workbox)
- **Styling**: Tailwind CSS with custom Dark Glass utilities and subject accents
- **Icons**: Lucide React
- **Backend / Database**: Supabase JS Client (`@supabase/supabase-js`) + LocalStorage fallback

---

## 🚀 Running the App Locally

```bash
# 1. Navigate to project directory
cd neet-prep

# 2. Start Vite development server
npm run dev

# 3. Build production PWA bundle
npm run build

# 4. Preview production build
npm run preview
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

---

## 🗄️ Supabase Database Setup (Optional)
To link your own Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and execute the provided `supabase-schema.sql` script.
3. In the NEET PREP app, click **Backend & Settings** in the left sidebar (or top right on mobile) and paste your Project URL and Anon Key.
