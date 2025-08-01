// Utility functions for handling metadata in SQLite (stored as JSON strings)

export function stringifyMetadata(
  metadata: Record<string, string | number | boolean | null>
): string | null {
  if (!metadata) return null;
  if (typeof metadata === "string") return metadata;
  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.warn("Failed to stringify metadata:", error);
    return null;
  }
}

export function parseMetadata(
  metadata: string | null
): Record<string, string | number | boolean | null> | null {
  if (!metadata) return null;
  if (typeof metadata === "object") return metadata;
  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.warn("Failed to parse metadata:", error);
    return null;
  }
}

// Type-safe metadata handling for transactions
export interface TransactionMetadata {
  channel?: "online" | "mobile" | "atm" | "branch";
  location?: string;
  deviceId?: string;
  userAgent?: string;
  sessionId?: string;
  ipAddress?: string;
  [key: string]: string | number | boolean | null | undefined | string[];
}

// Type-safe metadata handling for alerts
export interface AlertMetadata {
  amount?: number;
  fromAccount?: string;
  toAccount?: string;
  triggeredBy?: string;
  riskFactors?: string[];
  [key: string]: string | number | boolean | null | undefined | string[];
}
