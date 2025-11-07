import { useState, useEffect } from 'react';
import { kycApi } from '../lib/api';

interface KycProfile {
  id: string;
  userId: string;
  status: string;
  provider: string;
  verifiedAt?: string;
}

/**
 * Custom hook for KYC operations
 * Handles fetching and managing KYC profile state
 */
export function useKyc(userId: string | null) {
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKycProfile = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await kycApi.getKycProfile(userId);
      setKycProfile(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KYC profile');
    } finally {
      setLoading(false);
    }
  };

  const submitKyc = async (data: {
    provider: string;
    providerRef?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!userId) throw new Error('User ID is required');

    setLoading(true);
    setError(null);

    try {
      const response = await kycApi.submitKyc({ userId, ...data });
      setKycProfile(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit KYC';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycProfile();
  }, [userId]);

  return {
    kycProfile,
    loading,
    error,
    submitKyc,
    refetch: fetchKycProfile,
  };
}
