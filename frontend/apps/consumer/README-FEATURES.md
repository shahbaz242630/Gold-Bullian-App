# Gold Bullion App - Consumer Mobile App

## Features Implemented

### 1. Authentication System
Complete authentication flow with Supabase integration.

**Screens:**
- `/app/(auth)/login.tsx` - User login
- `/app/(auth)/register.tsx` - User registration
- `/app/forgot-password.tsx` - Password reset

**Features:**
- Email/password authentication
- Session management with persistent storage
- Protected route navigation
- Automatic redirect based on auth state
- Form validation
- Loading states

**Store:**
- `src/stores/auth.store.ts` - Auth state management with Zustand + AsyncStorage persistence

---

### 2. Main Dashboard
Central hub showing portfolio overview and quick actions.

**Screen:**
- `/app/(tabs)/dashboard.tsx`

**Features:**
- Portfolio value display (gold balance in grams and AED value)
- Current buy/sell prices
- Locked balance indicator
- Recent transactions preview
- Quick action buttons (Buy, Sell, Withdraw, History)
- Pull-to-refresh functionality
- Real-time data fetching from backend

---

### 3. Transaction Management

#### Buy Gold
**Screen:** `/app/buy-gold.tsx`

**Features:**
- Dual input mode: by fiat amount (AED) or by grams
- Real-time price calculation
- Transaction preview before purchase
- Current price display
- Form validation
- Loading states

#### Sell Gold
**Screen:** `/app/sell-gold.tsx`

**Features:**
- Available balance display
- Locked balance indicator
- "Sell All" quick action
- Real-time value calculation
- Confirmation dialog
- Insufficient balance validation

#### Withdraw
**Screen:** `/app/withdraw.tsx`

**Features:**
- Two withdrawal modes:
  - **Cash Withdrawal:** Bank transfer with full bank details form
  - **Physical Gold Delivery:** Gold delivery to physical address
- Mode toggle UI
- Complete address forms
- Available balance checking
- Form validation

#### Transaction History
**Screen:** `/app/(tabs)/transactions.tsx`

**Features:**
- Paginated transaction list
- Transaction type indicators (Buy, Sell, Withdraw Cash, Withdraw Physical)
- Status badges (Completed, Pending, Failed, Cancelled)
- Reference codes
- Pull-to-refresh
- Infinite scroll for older transactions
- Empty state with call-to-action

---

### 4. KYC Verification
Complete identity verification flow.

**Screen:**
- `/app/(tabs)/kyc.tsx`

**Features:**
- KYC status tracking (Pending, In Review, Verified, Rejected)
- Submission form with:
  - ID type selection (Passport, Emirates ID)
  - ID number
  - Nationality
  - Date of birth
  - Address
- Status display with visual indicators
- Review notes display
- Submission timestamps
- Pull-to-refresh for status updates
- Information banners

**States:**
- Not submitted: Show submission form
- Submitted/In Review: Show status card
- Verified: Show success state
- Rejected: Allow resubmission

---

### 5. Profile & Settings
User account management and app preferences.

**Screen:**
- `/app/(tabs)/profile.tsx`
- `/app/edit-profile.tsx`

**Features:**
- User information display
- Account menu items:
  - Personal Information
  - KYC Verification
  - Nominee Management
- Preferences section:
  - Notifications (placeholder)
  - Security (placeholder)
  - Language selection (placeholder)
- Support section:
  - Help Center
  - Contact Us
  - Terms & Privacy
- App version display
- Logout functionality with confirmation

---

### 6. Nominee Management
Beneficiary designation system.

**Screen:**
- `/app/nominee.tsx`

**Features:**
- View mode: Display current nominee details
- Edit mode: Update nominee information
- Form fields:
  - Full name
  - Relationship
  - Email
  - Phone number (with country code)
- Save/Cancel actions
- Information banner explaining nominee purpose
- Form validation

---

### 7. Global State Management

**Stores:**
- `src/stores/auth.store.ts` - Authentication state
  - Session management
  - User data
  - Persistent storage with AsyncStorage
  - Auto-initialization

- `src/stores/app.store.ts` - Application state
  - Wallet data
  - Current gold prices
  - Refresh state
  - Reset functionality

---

### 8. API Integration Layer

**File:** `src/lib/api.ts`

**Features:**
- Centralized API client
- Automatic Bearer token injection
- Error handling
- Type-safe methods for:
  - Authentication (register, login)
  - Wallets (get wallets, get specific wallet)
  - Pricing (current price, price history)
  - Transactions (list, buy, sell, withdraw cash, withdraw physical)
  - KYC (get profile, submit KYC)
  - Nominees (get nominee, update nominee)

---

### 9. Navigation Structure

**Root Layout:** `/app/_layout.tsx`
- Auth state monitoring
- Automatic routing based on authentication
- Supabase auth listener
- Protected route enforcement

**Auth Group:** `/app/(auth)/_layout.tsx`
- Login, Register, Forgot Password flows

**Tabs Group:** `/app/(tabs)/_layout.tsx`
- Dashboard
- Transactions
- KYC
- Profile

---

### 10. UI Components & Error Handling

**Error Boundary:**
- `src/components/ErrorBoundary.tsx`
- Catches React errors
- User-friendly error display
- Reset functionality

**Loading States:**
- Activity indicators throughout the app
- Skeleton loaders where appropriate
- Pull-to-refresh on list screens

**Form Validation:**
- Email validation
- Phone number validation
- Required field checking
- Password strength requirements
- Confirmation dialogs for destructive actions

---

## Technical Stack

- **Framework:** React Native 0.76 with Expo 51
- **Routing:** Expo Router 3.5 (file-based routing)
- **Styling:** NativeWind 4.0 (Tailwind CSS for React Native)
- **State Management:** Zustand 4.5
- **Storage:** AsyncStorage for persistence
- **Authentication:** Supabase Auth
- **Backend Integration:** RESTful API client

---

## Environment Variables

Required variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Running the App

1. Install dependencies:
```bash
cd frontend/apps/consumer
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS/Android:
```bash
npm run ios
# or
npm run android
```

---

## Screen Flow

### Unauthenticated Users:
1. Login/Register → Dashboard

### Authenticated Users:
1. **Dashboard** (default)
   - View portfolio
   - Quick actions
   - Recent transactions

2. **Buy/Sell/Withdraw**
   - Accessible via dashboard quick actions
   - Complete transactions

3. **Transactions Tab**
   - View all transaction history
   - Check status

4. **KYC Tab**
   - Submit verification
   - Check status

5. **Profile Tab**
   - Manage account
   - Edit nominee
   - Logout

---

## Key Features Summary

✅ Complete authentication flow
✅ Real-time portfolio tracking
✅ Buy gold (by amount or grams)
✅ Sell gold with balance validation
✅ Cash withdrawals with bank details
✅ Physical gold delivery requests
✅ Transaction history with pagination
✅ KYC submission and status tracking
✅ Nominee management
✅ Profile management
✅ Pull-to-refresh everywhere
✅ Loading states
✅ Error handling
✅ Form validation
✅ Responsive UI with Tailwind
✅ Persistent auth sessions
✅ Protected routes

---

## Future Enhancements

- Profile editing API integration
- Document upload for KYC
- Real-time price updates (WebSocket)
- Push notifications
- Biometric authentication
- Multi-language support
- Dark mode
- Transaction details view
- Charts and analytics
- Export transactions
- Two-factor authentication
- In-app support chat
