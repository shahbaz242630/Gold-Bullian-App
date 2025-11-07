# Gold Products Implementation Guide

**Status:** Schema Complete ✅ | Services In Progress ⏳ | UI Pending 📋

This guide outlines the remaining implementation work for all Gold Product features per PRD requirements.

---

## ✅ COMPLETED

### 1. Database Schema
All models created in `schema.prisma`:
- ✅ Gold Kitty (4 models: GoldKitty, GoldKittyMember, GoldKittyContribution, GoldKittyAllocation)
- ✅ Recurring Savings Plans (2 models: RecurringSavingsPlan, RecurringPlanExecution)
- ✅ Kids Wallets (User model extended with parentUserId, isKidsAccount)
- ✅ Physical Withdrawal Details (PhysicalWithdrawalDetails model)
- ✅ All enums defined

### 2. Gold Validation (0.1gm multiples)
- ✅ `GoldValidationUtil` created with full validation logic
- ✅ Test coverage (100%)
- ✅ Integrated into `BuyGoldService`
- ✅ Helpful error messages with suggestions

---

## 🚧 IN PROGRESS / TODO

### Feature A: Gold Kitty (Group Savings)

**Estimated Time:** 3-4 days

#### Backend (2-3 days)

**1. DTOs** (`src/modules/gold-kitty/dto/`)
- [x] `create-gold-kitty.dto.ts` - Started
- [ ] `add-member.dto.ts`
- [ ] `contribute.dto.ts`
- [ ] `allocate-pot.dto.ts`
- [ ] `update-gold-kitty.dto.ts`

**2. Service** (`src/modules/gold-kitty/gold-kitty.service.ts`)
```typescript
// Methods needed:
- createKitty(dto): Create group with owner
- addMember(kittyId, userId, allocationOrder): Invite member
- removeMember(kittyId, memberId): Remove member
- contribute(kittyId, memberId, roundNumber): Record monthly contribution
- allocatePot(kittyId, memberId, roundNumber): Distribute pot to member
- getKittyById(kittyId): Get kitty details with members
- getUserKitties(userId): Get user's kitties (owned + member)
- getKittyContributions(kittyId, roundNumber): Get round contributions
- pauseKitty(kittyId): Pause kitty
- completeKitty(kittyId): Mark as completed
```

**3. Controller** (`src/modules/gold-kitty/gold-kitty.controller.ts`)
```typescript
// Endpoints needed:
POST   /gold-kitty              - Create kitty
GET    /gold-kitty/:id          - Get kitty details
GET    /gold-kitty/user/:userId - Get user's kitties
POST   /gold-kitty/:id/members  - Add member
DELETE /gold-kitty/:id/members/:memberId - Remove member
POST   /gold-kitty/:id/contribute - Record contribution
POST   /gold-kitty/:id/allocate - Allocate pot
PATCH  /gold-kitty/:id/pause    - Pause kitty
PATCH  /gold-kitty/:id/complete - Complete kitty
GET    /gold-kitty/:id/contributions/:round - Get round contributions
```

**4. Module** (`src/modules/gold-kitty/gold-kitty.module.ts`)

**5. Business Logic**
- Validate total members matches totalRounds
- Enforce contribution order
- Auto-calculate next round date
- Prevent duplicate allocations per round
- Ensure all contributions paid before allocation
- Send notifications for:
  - New member added
  - Contribution due
  - Contribution received
  - Pot allocated

#### Mobile UI (1 day)

**Screens needed:**

1. **Gold Kitty List** (`app/(tabs)/gold-kitty.tsx`)
   - Show user's kitties (owned + member)
   - Status badges (Active, Paused, Completed)
   - Current round indicator
   - Contribution status

2. **Create Kitty** (`app/create-gold-kitty.tsx`)
   - Name, description
   - Monthly amount (AED)
   - Contribution day (1-31)
   - Total rounds
   - Start date
   - Invite members (search users)

3. **Kitty Details** (`app/gold-kitty/[id].tsx`)
   - Kitty info (name, monthly amount, rounds)
   - Member list with allocation order
   - Current round status
   - Contribution status per member
   - History of allocations
   - Actions: Contribute, View History, Settings

4. **Contribute** (`app/gold-kitty/[id]/contribute.tsx`)
   - Show amount due
   - Payment method
   - Confirm contribution

5. **Allocate Pot** (Admin/Owner only) (`app/gold-kitty/[id]/allocate.tsx`)
   - Select member to receive pot
   - Show total pot amount
   - Confirm allocation

---

### Feature B: Monthly Recurring (Goal-based Savings)

**Estimated Time:** 2-3 days

#### Backend (1.5-2 days)

**1. DTOs** (`src/modules/recurring-plans/dto/`)
- [ ] `create-recurring-plan.dto.ts`
- [ ] `update-recurring-plan.dto.ts`
- [ ] `pause-plan.dto.ts`

**2. Service** (`src/modules/recurring-plans/recurring-plans.service.ts`)
```typescript
// Methods needed:
- createPlan(dto): Create recurring plan with goal
- updatePlan(planId, dto): Update plan details
- pausePlan(planId): Pause plan
- resumePlan(planId): Resume plan
- cancelPlan(planId): Cancel plan
- getPlanById(planId): Get plan details
- getUserPlans(userId): Get user's plans
- executePlan(planId): Execute scheduled purchase (cron job)
- calculateProgress(planId): Calculate goal progress
```

**3. Scheduler Service** (`src/modules/recurring-plans/recurring-plans-scheduler.service.ts`)
```typescript
// Cron jobs:
- @Cron('0 0 * * *') checkDuePlans(): Find plans due today
- executeDuePlan(planId): Execute auto-debit and gold purchase
- handleFailedExecution(planId, reason): Handle payment failures
- retryFailedExecutions(): Retry failed executions
```

**4. Controller** (`src/modules/recurring-plans/recurring-plans.controller.ts`)
```typescript
// Endpoints needed:
POST   /recurring-plans              - Create plan
GET    /recurring-plans/:id          - Get plan details
GET    /recurring-plans/user/:userId - Get user's plans
PATCH  /recurring-plans/:id          - Update plan
PATCH  /recurring-plans/:id/pause    - Pause plan
PATCH  /recurring-plans/:id/resume   - Resume plan
DELETE /recurring-plans/:id          - Cancel plan
GET    /recurring-plans/:id/executions - Get execution history
GET    /recurring-plans/:id/progress - Get goal progress
```

**5. Module**

**6. Business Logic**
- Validate card token before creating plan
- Calculate next execution date based on frequency
- Handle payment failures gracefully
- Track goal progress (amount saved vs goal amount)
- Send notifications for:
  - Plan created
  - Execution success
  - Execution failure
  - Goal reached

#### Mobile UI (1 day)

**Screens needed:**

1. **Recurring Plans List** (`app/(tabs)/recurring-plans.tsx`)
   - Show all user's plans
   - Status badges (Active, Paused, Completed)
   - Goal progress bars
   - Next execution date

2. **Create Recurring Plan** (`app/create-recurring-plan.tsx`)
   - Plan name
   - Goal name (optional)
   - Goal amount (optional)
   - Goal date (optional)
   - Recurring amount (AED)
   - Frequency (Daily/Weekly/Monthly/Yearly)
   - Execution day
   - Start date
   - Link card for auto-debit

3. **Plan Details** (`app/recurring-plans/[id].tsx`)
   - Plan info
   - Goal progress (visual)
   - Next execution date
   - Execution history
   - Actions: Pause, Resume, Edit, Cancel

4. **Edit Plan** (`app/recurring-plans/[id]/edit.tsx`)
   - Update recurring amount
   - Update frequency
   - Update execution day
   - Update card

---

### Feature C: Kids Special Wallets

**Estimated Time:** 2-3 days

#### Backend (1.5-2 days)

**1. DTOs** (`src/modules/kids-wallets/dto/`)
- [ ] `create-kid-account.dto.ts`
- [ ] `update-kid-account.dto.ts`

**2. Service** (`src/modules/kids-wallets/kids-wallets.service.ts`)
```typescript
// Methods needed:
- createKidAccount(parentUserId, dto): Create sub-account
- updateKidAccount(kidUserId, dto): Update kid info
- getKidAccounts(parentUserId): Get all kids for parent
- getKidAccount(kidUserId): Get kid details
- getFamilyDashboard(parentUserId): Parent + all kids balances
- transferToKid(parentUserId, kidUserId, amount): Parent transfers to kid
```

**3. Controller** (`src/modules/kids-wallets/kids-wallets.controller.ts`)
```typescript
// Endpoints needed:
POST   /kids-wallets                  - Create kid account
GET    /kids-wallets/parent/:parentId - Get all kids for parent
GET    /kids-wallets/:kidId           - Get kid account details
PATCH  /kids-wallets/:kidId           - Update kid account
GET    /kids-wallets/family/:parentId - Get family dashboard
POST   /kids-wallets/transfer         - Transfer from parent to kid
```

**4. Module**

**5. Business Logic**
- Link kid account to parent (parentUserId)
- Each kid must have own KYC documents (passport, etc.)
- Each kid is own nominee for their wallet
- Parent can view all kids' balances
- Parent can transfer gold to kids
- Kids cannot withdraw without parent approval

#### Mobile UI (1 day)

**Screens needed:**

1. **Family Dashboard** (`app/(tabs)/family.tsx`)
   - Parent balance card
   - Kids balance cards (list)
   - Total family gold holdings
   - Add kid button

2. **Create Kid Account** (`app/create-kid-account.tsx`)
   - Kid's name
   - Date of birth
   - Document upload (passport)
   - Initial funding (optional)

3. **Kid Account Details** (`app/kids/[kidId].tsx`)
   - Kid's info
   - Balance
   - Transaction history
   - Actions: Transfer to kid, View history, Edit

4. **Transfer to Kid** (`app/kids/[kidId]/transfer.tsx`)
   - Select kid
   - Enter amount (grams or AED)
   - Confirm transfer

---

### Feature D: Physical Withdrawal UI Enhancements

**Estimated Time:** 1 day

#### Backend (0.5 day)

**1. Update Withdraw Physical Service**

File: `src/modules/transactions/services/withdraw-physical.service.ts`

```typescript
// Add to WithdrawPhysicalDto:
- coinSize: PhysicalWithdrawalCoinSize (enum)
- quantity: number
- deliveryMethod: PhysicalWithdrawalDeliveryMethod
- partnerJewellerId?: string
- deliveryAddress?: object (if HOME_DELIVERY)
- pickupLocation?: string (if PARTNER_PICKUP or VAULT_PICKUP)
- recipientName: string
- recipientPhone: string
- specialInstructions?: string

// Update service to:
- Create PhysicalWithdrawalDetails record
- Validate coin size availability
- Calculate total grams from coin size * quantity
- Validate user has enough balance
- Store delivery/pickup information
```

**2. Create Admin endpoints for managing withdrawals**
- Approve/reject withdrawal requests
- Update delivery tracking
- Mark as delivered

#### Mobile UI (0.5 day)

**Update Withdraw Screen** (`app/withdraw.tsx`)

When Physical Withdrawal mode is selected:

**Step 1: Select Coin Size**
- Radio buttons for coin sizes:
  - 1 gram
  - 5 grams
  - 10 grams
  - 20 grams
  - 50 grams
  - 100 grams

**Step 2: Enter Quantity**
- Input for quantity
- Show total grams = coinSize * quantity
- Validate against available balance

**Step 3: Select Delivery Method**
- Radio buttons:
  - Home Delivery
  - Partner Jeweller Pickup
  - Vault Pickup

**Step 4: Delivery/Pickup Details**

If **Home Delivery**:
- Full address form
- Recipient name
- Recipient phone
- Special instructions (optional)
- Estimated delivery date display

If **Partner Pickup**:
- Dropdown of partner jewellers
- Show partner location/address
- Pickup hours
- Recipient name
- Recipient phone

If **Vault Pickup**:
- Show vault location
- Pickup hours
- Recipient name
- Recipient phone
- ID verification required notice

**Step 5: Confirmation**
- Review all details
- Show fees
- Confirm withdrawal

---

## 📋 Implementation Priority

Based on business impact and PRD requirements:

### Priority 1 (Critical for MVP)
1. **0.1gm Validation** - ✅ DONE
2. **Physical Withdrawal UI** - 1 day
3. **Database Migration** - Run `npx prisma migrate dev`

### Priority 2 (High Value)
4. **Gold Kitty** - 3-4 days (unique differentiator)
5. **Recurring Plans** - 2-3 days (customer retention)

### Priority 3 (Important)
6. **Kids Wallets** - 2-3 days (market segment)

**Total Estimated Time:** 8-12 days of development

---

## 🚀 Next Steps

### Immediate (Today/Tomorrow)
1. ✅ Run Prisma migration: `npx prisma migrate dev --name add-gold-products`
2. ✅ Run Prisma generate: `npx prisma generate`
3. [ ] Test existing buy/sell with new validation
4. [ ] Start Physical Withdrawal UI enhancements

### This Week
5. [ ] Implement Gold Kitty backend (3 days)
6. [ ] Implement Gold Kitty mobile UI (1 day)

### Next Week
7. [ ] Implement Recurring Plans backend (2 days)
8. [ ] Implement Recurring Plans mobile UI (1 day)
9. [ ] Implement Kids Wallets backend (2 days)
10. [ ] Implement Kids Wallets mobile UI (1 day)

### Testing
11. [ ] Write tests for all new services
12. [ ] Integration tests for complete flows
13. [ ] E2E tests for mobile UI

---

## 📝 Technical Notes

### Database Migration
After schema changes, run:
```bash
cd backend/services/core-api
npx prisma migrate dev --name add-gold-products
npx prisma generate
npm test  # Ensure existing tests pass
```

### Environment Variables
Add to `.env`:
```
# For recurring plans - cron job
RECURRING_PLANS_ENABLED=true
RECURRING_PLANS_CRON=0 0 * * *  # Daily at midnight

# For physical withdrawal
PARTNER_JEWELLERS_API_URL=https://api.partners.bulliun.ae
VAULT_LOCATION=DMCC Dubai
```

### Notifications
All features require notification integration:
- Email (Supabase Email)
- SMS (Twilio)
- Push Notifications (Expo Notifications)
- In-App Notifications

Create notification service: `src/modules/notifications/notifications.service.ts`

### Scheduled Jobs
For recurring plans, use NestJS @Cron:
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async checkDuePlans() {
  // Find plans where nextExecutionDate === today
  // Execute each plan
}
```

### Card Tokenization
For recurring plans auto-debit:
- Use WadzPay tokenization API (when available)
- Store only tokenized card reference
- Never store actual card details

### Testing Strategy
1. **Unit Tests**: Each service method
2. **Integration Tests**: Full flows with database
3. **API Tests**: All endpoints
4. **UI Tests**: React Native Testing Library

---

## 🎯 Success Criteria

Each feature is complete when:
- ✅ Database schema migrated
- ✅ Backend services implemented
- ✅ API endpoints created and documented
- ✅ Mobile UI screens built
- ✅ Unit tests pass (>80% coverage)
- ✅ Integration tests pass
- ✅ Manual testing complete
- ✅ Documentation updated

---

## 📞 Support

Questions? Issues?
- Check PRD: `Bulliun Product requirement doc.pdf`
- Check Blueprint: `Bulliun Digital Gold Platform Blueprint.txt`
- Review Implementation Status: `IMPLEMENTATION_STATUS_REPORT.md`

**Current Status:** Schema ✅ | Validation ✅ | Services 30% | UI 0%

**Next Action:** Continue with Gold Kitty backend services
