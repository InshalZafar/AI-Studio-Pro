"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { APIKeyItem, Provider } from "@/lib/types";

export function useApiKeys() {
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<APIKeyItem[]>("/api/settings");
      setKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function hasKey(provider: Provider): boolean {
    return keys.some((k) => k.provider === provider && k.is_active);
  }

  return { keys, loading, refresh, hasKey };
}
