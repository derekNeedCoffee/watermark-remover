/**
 * Hook for managing user entitlements
 */
import { useState, useEffect, useCallback } from 'react';
import { getEntitlements, Entitlement } from '../services/api';
import { getInstallId } from '../services/storage';
import { DEV_MODE } from '../constants/config';

interface UseEntitlementResult {
  entitlement: Entitlement | null;
  installId: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canUseService: boolean;
}

// Dev mode entitlement - unlimited access
const DEV_ENTITLEMENT: Entitlement = {
  installId: 'dev-mode',
  isPro: true,
  freeRemaining: 999,
};

export function useEntitlement(): UseEntitlementResult {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(
    DEV_MODE ? DEV_ENTITLEMENT : null
  );
  const [installId, setInstallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const id = await getInstallId();
      setInstallId(id);

      // In dev mode, always return pro status
      if (DEV_MODE) {
        console.log('🔧 DEV MODE: Bypassing paywall, unlimited access enabled');
        setEntitlement({ ...DEV_ENTITLEMENT, installId: id });
        setLoading(false);
        return;
      }

      const ent = await getEntitlements(id);
      setEntitlement(ent);
    } catch (err) {
      console.error('Failed to fetch entitlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
      
      // In dev mode, still allow usage even on error
      if (DEV_MODE) {
        const id = await getInstallId();
        setEntitlement({ ...DEV_ENTITLEMENT, installId: id });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlement();
  }, [fetchEntitlement]);

  // In dev mode, always allow service usage
  const canUseService = DEV_MODE 
    ? true 
    : (entitlement ? entitlement.isPro || entitlement.freeRemaining > 0 : false);

  return {
    entitlement,
    installId,
    loading,
    error,
    refresh: fetchEntitlement,
    canUseService,
  };
}
