// src/lib/hooks/use-analytics.ts

import useSWR from "swr";
import { useWebSocket } from "../hooks/use-websocket";
import { useSession } from "next-auth/react";

interface Analytics {
  totalTransactions: number;
  totalAmount: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: Array<{
    status: string;
    _count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    riskScore: number;
    createdAt: string;
  }>;
  // New real-time KPI fields
  totalAlerts: number;
  highRiskAlerts: number;
  detectionRate: number;
  responseTime: number;
  blockedAmount: number;
  falsePositives: number;
  recentFraudAlerts: Array<any>;
  timeRange?: {
    from: string;
    to: string;
  };
}

const fetcherWithToken = (token?: string) => async (url: string): Promise<Analytics> => {
  console.log("[useAnalytics] Using token:", token); // DEBUG
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  // Convert stringified numbers to numbers recursively
  function parseNumbers(obj: any): any {
    if (Array.isArray(obj)) return obj.map(parseNumbers);
    if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val)) {
          newObj[key] = Number(val);
        } else {
          newObj[key] = parseNumbers(val);
        }
      }
      return newObj;
    }
    return obj;
  }
  return parseNumbers(data) as Analytics;
};



export function useAnalytics() {
  const { data: session, status } = useSession();
  const token = session?.user ? (session.user as any).accessToken : undefined;
  // Always fetch analytics, with or without token
  const { data, error, mutate } = useSWR<Analytics, Error, [string, string | undefined]>(
    ["/api/analytics", token],
    ([url, t]: [string, string | undefined]) => fetcherWithToken(t)(url),
    { refreshInterval: 30000 }
  );

  // WebSocket connection for real-time updates
  useWebSocket({
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000",
    onMessage: (event: any) => {
      if (event.event === "analyticsUpdate") {
        // event.data is the analytics object
        mutate(event.data, false);
      }
    },
  });

  return {
    analytics: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}


import { FraudAlert } from "@/types/fraud";
export function useRealtimeAlerts() {
  const { data: session, status } = useSession();
  const token = session?.user ? (session.user as any).accessToken : undefined;
  const shouldFetch = status === "authenticated" && !!token;
  const { data, error, mutate } = useSWR<FraudAlert[], Error, [string, string] | null>(
    shouldFetch ? ["/api/alerts", token] as [string, string] : null,
    async ([url, t]: [string, string]) => {
      const response = await fetch(url, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      return data;
    },
    { refreshInterval: 30000 }
  );

  return {
    alerts: data,
    isLoading: shouldFetch && !error && !data,
    isError: error,
    mutate,
  };
}
