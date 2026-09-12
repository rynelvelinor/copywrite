"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";

type WorldVerificationContextValue = {
  verified: boolean;
  loading: boolean;
  refresh: () => Promise<boolean>;
  markVerified: () => void;
};

const WorldVerificationContext =
  createContext<WorldVerificationContextValue | null>(null);

export function WorldVerificationProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setVerified(false);
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/worldid/status?address=${encodeURIComponent(address)}`,
      );
      const data = (await res.json()) as { verified?: boolean };
      const next = Boolean(data.verified);
      setVerified(next);
      return next;
    } catch {
      setVerified(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      verified,
      loading,
      refresh,
      markVerified: () => setVerified(true),
    }),
    [verified, loading, refresh],
  );

  return (
    <WorldVerificationContext.Provider value={value}>
      {children}
    </WorldVerificationContext.Provider>
  );
}

export function useWorldVerification() {
  const ctx = useContext(WorldVerificationContext);
  if (!ctx) {
    throw new Error(
      "useWorldVerification must be used within WorldVerificationProvider",
    );
  }
  return ctx;
}
