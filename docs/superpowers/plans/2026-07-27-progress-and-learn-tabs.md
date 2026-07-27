# Progress Page 3-Tab Layout & Learn Page Overview Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve 100% feature and layout parity with mobile app by (1) restructuring Web's `/progress` page into a 3-tab layout (`[Courses, Stats, Leaderboard]`) with live Supabase leaderboard rankings, and (2) replacing Web's mock Discussion tab with a real Overview tab in the lesson player matching mobile's 4-tab set (`[Overview, Quiz, Resources, Notes]`).

**Architecture:** 
- For Progress Page: Restructure [src/routes/progress.tsx](file:///c:/web+mobile/MakersFlow-Web-FINAL/src/routes/progress.tsx) to introduce a 3-tab switcher (`Courses`, `Stats`, `Leaderboard`). Re-organize existing live components (`StatsGrid`, `StreakHeatmap`, `WeeklyChart`, `BadgesGrid`) into the `Stats` tab, render enrolled courses in the `Courses` tab, and create a `Leaderboard` component querying `streaks` ordered by `longest_streak DESC` joined with `profiles`.
- For Learn Page: Modify [src/components/learn/LessonComponents.tsx](file:///c:/web+mobile/MakersFlow-Web-FINAL/src/components/learn/LessonComponents.tsx) and [src/routes/learn.$courseId.$lessonId.tsx](file:///c:/web+mobile/MakersFlow-Web-FINAL/src/routes/learn.$courseId.$lessonId.tsx) to remove the mock `Discussion` tab and render the `Overview` tab displaying lesson summary and description.

**Tech Stack:** React 19, `@tanstack/react-router`, `@tanstack/react-query`, Supabase JS client, Tailwind CSS, Framer Motion, Lucide React icons.

## Global Constraints

- Do not touch `checkout.tsx` payment logic.
- Do not modify files inside `MakersFlow-App-vF-main (1)` (read-only reference).
- No placeholder or fake toasts — all features must be backed by real state or Supabase queries.
- Run `npx tsc --noEmit` after implementing each item and verify 0 type errors.

---

### Task 1: ITEM 1 — Progress Page 3-Tab Layout & Live Leaderboard

**Files:**
- Create: `src/components/progress/Leaderboard.tsx`
- Modify: `src/routes/progress.tsx`

**Interfaces:**
- `LeaderboardEntry`: `{ rank: number; userId: string; name: string; streakDays: number; isSelf: boolean }`
- Query logic: Fetches top 10 rows from `streaks` ordered by `longest_streak DESC`, maps `user_id` to `profiles.full_name`.

- [ ] **Step 1: Create `src/components/progress/Leaderboard.tsx` component**
- [ ] **Step 2: Update `src/routes/progress.tsx` to implement 3-tab layout (`Courses`, `Stats`, `Leaderboard`)**
- [ ] **Step 3: Run `npx tsc --noEmit` to verify type safety**
- [ ] **Step 4: Empirically verify leaderboard rankings with test user accounts**

---

### Task 2: ITEM 2 — Learn Page Tabs: Overview vs Mock Discussion

**Files:**
- Modify: `src/components/learn/LessonComponents.tsx`
- Modify: `src/routes/learn.$courseId.$lessonId.tsx`

**Interfaces:**
- `TabKey`: `"overview" | "quiz" | "resources" | "notes"`
- `Overview`: Renders `lesson.title`, `lesson.description`, and lesson key takeaways/objectives.

- [ ] **Step 1: Update `TABS` array in `LessonComponents.tsx` to replace `discussion` with `overview`**
- [ ] **Step 2: Add `OverviewTab` panel rendering lesson details**
- [ ] **Step 3: Update `src/routes/learn.$courseId.$lessonId.tsx` active tab default and state**
- [ ] **Step 4: Run `npx tsc --noEmit` to verify type safety**
- [ ] **Step 5: Verify tabs match mobile's 4 tabs (`Overview`, `Quiz`, `Resources`, `Notes`)**
