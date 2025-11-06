import { useState, useEffect } from 'react';
import { pricingApi } from '../lib/api';

interface PriceQuote {
  buyPrice: number;
  sellPrice: number;
  currency: string;
  effectiveAt: string;
}

/**
 * Custom hook for gold pricing
 * Handles fetching current gold prices
 */
export function usePricing(autoRefresh: boolean = false, refreshInterval: number = 30000) {
  const [price, setPrice] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await pricingApi.getCurrentPrice();
      setPrice(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();

    if (autoRefresh) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    price,
    loading,
    error,
    refetch: fetchPrice,
  };
}
