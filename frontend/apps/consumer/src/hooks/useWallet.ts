import { useState, useEffect } from 'react';
import { walletApi } from '../lib/api';

interface Wallet {
  id: string;
  type: string;
  balanceGrams: number;
  lockedGrams: number;
}

/**
 * Custom hook for wallet operations
 * Handles fetching and managing wallet state
 */
export function useWallet(userId: string | null) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await walletApi.getWallets(userId);
      setWallets(response.wallets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [userId]);

  return {
    wallets,
    loading,
    error,
    refetch: fetchWallets,
  };
}
