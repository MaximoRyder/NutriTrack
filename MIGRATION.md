# Firebase to MongoDB Migration - Complete

## Migration Summary

This document summarizes the complete migration from Firebase (Firestore + Firebase Auth) to MongoDB + NextAuth.

## What Was Migrated

### ✅ Authentication

- **Before**: Firebase Authentication
- **After**: NextAuth with credentials provider
- **Files**:
  - `/api/auth/[...nextauth]/route.ts` - NextAuth config with JWT strategy
  - `/api/auth/register/route.ts` - User registration endpoint
  - `login/page.tsx` - Updated to use NextAuth `signIn`
  - `register/page.tsx` - Updated to call registration API + auto sign-in

### ✅ Database Layer

- **Before**: Firestore collections
- **After**: MongoDB with Mongoose models
- **Files**:
  - `lib/mongodb.ts` - Connection manager
  - `lib/models.ts` - Mongoose schemas (User, Meal, Comment, Notification, WeightLog, WaterLog, MealPlan, Snippet)

### ✅ Data Fetching

- **Before**: Firebase hooks (`useDoc`, `useCollection`, `useMemoFirebase`)
- **After**: SWR hooks with REST APIs
- **Files**:
  - `lib/data-hooks.ts` - All SWR hooks (useUser, useMealsByDate, useComments, useNotifications, useUserProfile, usePatientMealsByDate, useWeightLogs, usePatients)

### ✅ API Routes Created

- `/api/meals` - GET (list/single), POST, PATCH, DELETE
- `/api/comments` - GET, POST (with automatic notification creation)
- `/api/notifications` - GET, PATCH (mark read)
- `/api/users` - GET (single user/patients list)
- `/api/users/assign-patient` - POST (assign patient to nutritionist)
- `/api/weightlogs` - GET, POST

### ✅ Pages Migrated

1. **Journal** (`journal/page.tsx`, `journal/[mealId]/page.tsx`)
   - Meals listing by date
   - Meal detail with comments
   - Add/edit/delete meals
2. **Patients** (`patients/page.tsx`, `patients/[patientId]/page.tsx`)
   - List patients for nutritionist
   - Patient detail with meals, comments, weight chart
   - Add patient dialog
3. **Notifications** (`notification-bell.tsx`)

   - Real-time notifications (polling with SWR)
   - Mark as read functionality

4. **Auth Pages** (`login/page.tsx`, `register/page.tsx`)

   - Login with NextAuth
   - Registration with API + auto sign-in

5. **Navigation** (`layout.tsx`, `sidebar-nav.tsx`, `user-nav.tsx`, `dashboard-header.tsx`, `header.tsx`, `page.tsx`)
   - All navigation components use new hooks

### ✅ Components Updated

- `add-patient-dialog.tsx` - Uses API endpoint
- `notification-bell.tsx` - SWR hook for notifications
- All layout/navigation components

## Files Temporarily Stubbed

These pages had deep Firebase dependencies and were replaced with placeholders. They need to be rewritten:

- `welcome/page.tsx` - Patient onboarding (backup: `page.tsx.bak`)
- `(overview)/settings/page.tsx` - User settings (backup: `page.tsx.bak`)
- `(overview)/overview/page.tsx` - Dashboard overview (backup: `page.tsx.bak`)
- `(overview)/admin/page.tsx` - Admin panel (backup: `page.tsx.bak`)
- `(overview)/admin/[userId]/page.tsx` - Admin user detail (backup: `page.tsx.bak`)

## Environment Variables Required

Add to `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/nutritrack
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:9002
```

## Dependencies Added

- `mongodb` - MongoDB driver
- `mongoose` - ODM
- `bcryptjs` - Password hashing
- `next-auth` - Authentication
- `swr` - Data fetching
- `@types/bcryptjs` - TypeScript types

## Key Changes

### Session Management

- Session now uses NextAuth JWT tokens
- User object structure: `{ id, email, name, role }`
- Access via `useSession()` hook or `getServerSession()` server-side

### Data Flow

1. Client → SWR hook → API route → MongoDB
2. Mutations trigger SWR `mutate()` for cache invalidation
3. Notifications use polling (10s interval) instead of real-time listeners

### Notification Creation

- Automatic notification when nutritionist comments on patient meal
- Server-side logic in `/api/comments` POST handler

## Testing Checklist

Before deploying, test:

- [ ] User registration (patient + nutritionist)
- [ ] User login
- [ ] Add meal with photo
- [ ] Edit/delete meal
- [ ] Nutritionist: add patient by email
- [ ] Nutritionist: view patient detail
- [ ] Nutritionist: comment on patient meal
- [ ] Patient: receive notification bell update
- [ ] Patient: click notification to view meal
- [ ] Weight log creation and chart display

## Next Steps

1. **Rewrite stubbed pages**:

   - Welcome page (patient onboarding flow)
   - Settings page (profile editing)
   - Overview dashboard (stats & charts)
   - Admin pages (user management)

2. **Add missing features**:

   - Water logs UI
   - Meal plan generation/display
   - Snippets (nutritionist shortcuts)
   - Real-time notifications (optional: use polling or WebSockets)

3. **Security improvements**:

   - Add rate limiting to API routes
   - Validate user permissions more strictly (owner checks)
   - Add CSRF protection if needed

4. **Performance**:
   - Add database indexes (userId, timestamp, etc.)
   - Implement pagination for large datasets
   - Optimize image storage (currently base64 in DB - consider external storage)

## Migration Complete ✅

Firebase folder deleted. All core functionality migrated to MongoDB + NextAuth + SWR.
