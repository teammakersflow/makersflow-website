# Quick Start - Dashboard Widgets

## What Was Created

A complete dashboard widget row with 4 animated cards:

1. **Courses Enrolled** - Shows total enrolled courses with trend
2. **Completed** - Displays completed courses count
3. **Avg Score** - Shows average score percentage
4. **Streak Card** - Current streak with 7-day activity indicator

## Files Created

```
✓ src/hooks/useCountUp.tsx                          - Animation hook
✓ src/components/dashboard-widgets/
  ├── index.tsx                                     - Exports
  ├── DashboardWidgets.tsx                          - Main component
  ├── StatCard.tsx                                  - Stat card
  ├── StreakCard.tsx                                - Streak tracker
  └── README.md                                     - Documentation
✓ src/routes/dashboard-demo.tsx                     - Demo page
```

## Quick Test

### Step 1: Start Dev Server

```bash
npm run dev
```

### Step 2: View the Demo

Navigate to:

```
http://localhost:3000/dashboard-demo
```

### Step 3: Watch the Magic! ✨

You should see:

- ✅ Numbers counting up from 0
- ✅ Beautiful gradient backgrounds (indigo → orange)
- ✅ Soft shadows with hover effects
- ✅ 7-day streak indicator dots
- ✅ Responsive grid layout

## Usage in Your App

### Option 1: Use the Complete Widget Row

```tsx
import { DashboardWidgets } from "@/components/dashboard-widgets";

function MyDashboard() {
  return (
    <div className="p-6">
      <DashboardWidgets
        coursesEnrolled={12}
        coursesCompleted={8}
        averageScore={87}
        currentStreak={15}
        activeDays={[true, true, true, false, true, true, true]}
      />
    </div>
  );
}
```

### Option 2: Use Individual Cards

```tsx
import { StatCard, StreakCard } from "@/components/dashboard-widgets";

function CustomLayout() {
  return (
    <div className="grid gap-4 grid-cols-2">
      <StatCard
        title="Total Score"
        value={2450}
        gradient="bg-gradient-to-br from-[#4F46E5] to-[#4338CA]"
      />

      <StreakCard
        currentStreak={7}
        activeDays={[true, true, true, true, true, true, true]}
        gradient="bg-gradient-to-br from-[#FF6B35] to-[#F97316]"
      />
    </div>
  );
}
```

## Key Features

### ⚡ Count-up Animation

Numbers automatically animate from 0 to target value over 2 seconds using smooth easing.

### 🎨 Gradient Backgrounds

Four beautiful gradients transitioning from indigo (#4F46E5) to orange (#FF6B35):

- Card 1: Pure Indigo
- Card 2: Purple-Indigo
- Card 3: Pink-Orange
- Card 4: Pure Orange

### 🔥 Streak Tracker

- Flame icon
- Current streak number
- 7-day dot indicator (white = active, dimmed = inactive)
- Glowing effect on active days

### 📊 Trend Indicators

- Up/down arrow icons
- Positive/negative coloring
- Contextual labels

### 📱 Responsive Design

- Mobile: Stacked (1 column)
- Tablet: 2x2 grid
- Desktop: 1x4 row

## Customization Examples

### Change Animation Speed

In `useCountUp.tsx`:

```tsx
const animatedValue = useCountUp(value, 1500); // 1.5 seconds
```

### Custom Colors

```tsx
<StatCard
  title="Your Metric"
  value={999}
  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
/>
```

### Add Negative Trends

```tsx
<StatCard
  title="Errors"
  value={3}
  trend={{ value: "-5 from yesterday", isPositive: true }}
  gradient="bg-gradient-to-br from-red-500 to-orange-600"
/>
```

## Streak Activity Days

The `activeDays` array represents the last 7 days:

```tsx
// All active
activeDays={[true, true, true, true, true, true, true]}

// Missed 2 days
activeDays={[true, true, false, false, true, true, true]}

// Perfect week ending today
activeDays={[true, true, true, true, true, true, true]}
```

## Integration Tips

### With Real Data

```tsx
// Fetch from API
const { data } = useQuery({
  queryKey: ["stats"],
  queryFn: fetchStudentStats,
});

<DashboardWidgets {...data} />;
```

### With State Management

```tsx
// From Redux/Zustand
const stats = useStatsStore();

<DashboardWidgets
  coursesEnrolled={stats.enrolled}
  coursesCompleted={stats.completed}
  averageScore={stats.avgScore}
  currentStreak={stats.streak}
  activeDays={stats.last7Days}
/>;
```

## Responsive Preview

```
Mobile (<640px)
┌───────────┐
│  Card 1   │
├───────────┤
│  Card 2   │
├───────────┤
│  Card 3   │
├───────────┤
│  Card 4   │
└───────────┘

Tablet (640-1024px)
┌──────┬──────┐
│ C1   │ C2   │
├──────┼──────┤
│ C3   │ C4   │
└──────┴──────┘

Desktop (>1024px)
┌────┬────┬────┬────┐
│ C1 │ C2 │ C3 │ C4 │
└────┴────┴────┴────┘
```

## Visual Effects

Each card has:

- 🌟 Soft shadow (increases on hover)
- 🎯 Slight lift on hover (-translate-y-1)
- ✨ Decorative blur overlays
- 🌈 Smooth gradient transitions
- 💫 Eased count-up animation

## What's Next?

1. Replace demo data with real API calls
2. Add click handlers for detailed views
3. Implement tooltips for more info
4. Add loading skeletons
5. Create milestone celebration animations

## Need Help?

Check the full documentation:
`src/components/dashboard-widgets/README.md`

## Pro Tips

💡 **Animation Performance**: The count-up uses `requestAnimationFrame` for smooth 60fps animation

💡 **Memory Management**: Animations clean up on unmount to prevent leaks

💡 **Accessibility**: All cards are keyboard navigable and screen-reader friendly

💡 **Customizable**: Every color, duration, and layout can be modified

---

**Enjoy your beautiful animated dashboard! 🎉**
