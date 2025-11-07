/**
 * Centralized API exports
 * Import domain-specific API clients from here
 */
export { authApi, AuthApiClient } from './auth.client';
export { walletApi, WalletApiClient } from './wallet.client';
export { pricingApi, PricingApiClient } from './pricing.client';
export { transactionApi, TransactionApiClient } from './transaction.client';
export { kycApi, KycApiClient } from './kyc.client';
export { nomineeApi, NomineeApiClient } from './nominee.client';

// Legacy compatibility: export a combined API object
import { authApi } from './auth.client';
import { walletApi } from './wallet.client';
import { pricingApi } from './pricing.client';
import { transactionApi } from './transaction.client';
import { kycApi } from './kyc.client';
import { nomineeApi } from './nominee.client';

/**
 * Legacy API object for backward compatibility
 * @deprecated Use individual API clients instead (authApi, walletApi, etc.)
 */
export const api = {
  // Auth
  register: authApi.register.bind(authApi),
  login: authApi.login.bind(authApi),

  // Wallets
  getWallets: walletApi.getWallets.bind(walletApi),
  getWallet: walletApi.getWallet.bind(walletApi),

  // Pricing
  getCurrentPrice: pricingApi.getCurrentPrice.bind(pricingApi),
  getPriceHistory: pricingApi.getPriceHistory.bind(pricingApi),

  // Transactions
  getTransactions: transactionApi.getTransactions.bind(transactionApi),
  buyGold: transactionApi.buyGold.bind(transactionApi),
  sellGold: transactionApi.sellGold.bind(transactionApi),
  withdrawCash: transactionApi.withdrawCash.bind(transactionApi),
  withdrawPhysical: transactionApi.withdrawPhysical.bind(transactionApi),

  // KYC
  getKycProfile: kycApi.getKycProfile.bind(kycApi),
  submitKyc: kycApi.submitKyc.bind(kycApi),

  // Nominees
  getNominee: nomineeApi.getNominee.bind(nomineeApi),
  updateNominee: nomineeApi.updateNominee.bind(nomineeApi),
};
