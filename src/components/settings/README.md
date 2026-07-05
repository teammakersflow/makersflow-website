# Student Settings Page

A modern, responsive tabbed settings layout built with shadcn/ui for student profiles.

## Features

✅ **Sidebar Tabs**: Profile, Notifications, Billing, Security
✅ **Form Sections**: Labeled inputs with proper accessibility
✅ **Toggle Switches**: For notification preferences
✅ **Smart Save Button**: Activates only when fields change
✅ **Indigo Theme**: Active tab indicator (#4F46E5)
✅ **Fully Responsive**: Horizontal scroll tabs on mobile

## File Structure

```
src/
├── routes/
│   └── settings.tsx                    # Route definition
└── components/
    └── settings/
        ├── StudentSettings.tsx         # Main layout with tabs
        ├── ProfileTab.tsx              # Profile information form
        ├── NotificationsTab.tsx        # Notification preferences
        ├── BillingTab.tsx              # Billing and payment
        └── SecurityTab.tsx             # Security settings
```

## Usage

### Access the Page

Navigate to `/settings` in your application:

```tsx
import { Link } from "@tanstack/react-router";

<Link to="/settings">Settings</Link>;
```

### Tab Components

Each tab is a separate component with:

- Form state management
- Change detection
- Sticky save button
- Proper validation

### Mobile Responsiveness

- **Desktop (lg+)**: Vertical sidebar with tabs on the left
- **Mobile (<lg)**: Horizontal scrolling tabs at the top
- **Save Button**: Sticky positioning at the bottom

## Customization

### Change Active Tab Color

Update the indigo color in each TabsTrigger:

```tsx
data-[state=active]:border-[#YOUR_COLOR]
data-[state=active]:text-[#YOUR_COLOR]
```

And in the Button components:

```tsx
className = "bg-[#YOUR_COLOR] hover:bg-[#YOUR_DARKER_COLOR]";
```

### Add New Tabs

1. Create a new tab component (e.g., `PreferencesTab.tsx`)
2. Add it to `StudentSettings.tsx`:

```tsx
<TabsTrigger value="preferences">Preferences</TabsTrigger>
```

```tsx
<TabsContent value="preferences">
  <PreferencesTab />
</TabsContent>
```

### Modify Form Fields

Each tab component manages its own state:

```tsx
const [formData, setFormData] = useState({
  // Your fields here
});

const handleChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};
```

## Testing

To test the settings page:

1. Start your dev server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000/settings`

3. Test change detection by:
   - Modifying any input field
   - Toggling switches
   - Observing the "Save changes" button enable/disable

## Key Features Explained

### Change Detection

Each tab tracks changes using `useEffect`:

```tsx
useEffect(() => {
  const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
  setHasChanges(changed);
}, [formData]);
```

### Sticky Save Button

The save button uses sticky positioning:

```tsx
<div className="sticky bottom-4 flex justify-end border-t bg-white pt-4">
  <Button disabled={!hasChanges}>Save changes</Button>
</div>
```

### Responsive Tabs

Uses Tailwind's responsive classes:

- `flex-row` on mobile for horizontal scroll
- `lg:flex-col` for vertical sidebar on desktop
- `shrink-0` prevents tab squishing on mobile

## Dependencies

All required shadcn/ui components are already installed:

- `tabs`
- `card`
- `input`
- `label`
- `button`
- `switch`
- `select`
- `textarea`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
