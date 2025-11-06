import { create } from 'zustand';

interface Wallet {
  id: string;
  type: 'GOLD' | 'FEE';
  balanceGrams: number;
  lockedGrams: number;
}

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  currency: string;
  effectiveAt: string;
}

interface AppState {
  // Wallet state
  wallets: Wallet[];
  goldWallet: Wallet | null;

  // Pricing state
  currentPrice: GoldPrice | null;

  // App state
  isRefreshing: boolean;

  // Actions
  setWallets: (wallets: Wallet[]) => void;
  setCurrentPrice: (price: GoldPrice | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
}

const initialState = {
  wallets: [],
  goldWallet: null,
  currentPrice: null,
  isRefreshing: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setWallets: (wallets) => {
    const goldWallet = wallets.find((w) => w.type === 'GOLD') ?? null;
    set({ wallets, goldWallet });
  },

  setCurrentPrice: (price) => {
    set({ currentPrice: price });
  },

  setRefreshing: (refreshing) => {
    set({ isRefreshing: refreshing });
  },

  reset: () => {
    set(initialState);
  },
}));
