/**
 * Family Dashboard Entity
 * Aggregated view of parent and all kids' accounts
 */
export class FamilyDashboardEntity {
  parentAccount: {
    id: string;
    fullName: string;
    balanceGrams: number;
  };

  kidAccounts: Array<{
    id: string;
    fullName: string;
    age: number | null;
    balanceGrams: number;
    kycStatus: string;
  }>;

  totalFamilyGoldGrams: number;
  totalFamilyValueAED: number;
  numberOfKids: number;
}
