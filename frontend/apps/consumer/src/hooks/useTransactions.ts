import { useState, useEffect } from 'react';
import { transactionApi } from '../lib/api';

interface Transaction {
  id: string;
  type: string;
  status: string;
  goldGrams: number;
  fiatAmount: number;
  fiatCurrency: string;
  createdAt: string;
}

/**
 * Custom hook for transaction operations
 * Handles fetching and managing transaction state
 */
export function useTransactions(userId: string | null, page: number = 1, limit: number = 20) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await transactionApi.getTransactions(userId, page, limit);
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId, page, limit]);

  return {
    transactions,
    total,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
