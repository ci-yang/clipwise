/**
 * T059: AI 狀態輪詢 Hook
 * 前端輪詢 AI 處理狀態
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AiStatus } from '@prisma/client';

interface AiStatusResponse {
  bookmarkId: string;
  aiStatus: AiStatus;
  aiSummary: string | null;
  quota: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
}

interface UseAiStatusOptions {
  enabled?: boolean;
  interval?: number; // Polling interval in ms
  onComplete?: (summary: string | null) => void;
  onError?: (error: string) => void;
}

interface UseAiStatusReturn {
  status: AiStatus | null;
  summary: string | null;
  isPolling: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  triggerProcess: () => Promise<void>;
}

export function useAiStatus(
  bookmarkId: string | null,
  options: UseAiStatusOptions = {}
): UseAiStatusReturn {
  const { enabled = true, interval = 3000, onComplete, onError } = options;

  const [status, setStatus] = useState<AiStatus | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!bookmarkId) return;

    try {
      const response = await fetch(`/api/ai/status/${bookmarkId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch AI status');
      }

      const data: AiStatusResponse = await response.json();

      setStatus(data.aiStatus);
      setSummary(data.aiSummary);
      setError(null);

      // Check if processing is complete
      if (data.aiStatus === 'COMPLETED' || data.aiStatus === 'FAILED') {
        setIsPolling(false);
        if (data.aiStatus === 'COMPLETED') {
          onComplete?.(data.aiSummary);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    }
  }, [bookmarkId, onComplete, onError]);

  const triggerProcess = useCallback(async () => {
    if (!bookmarkId) return;

    try {
      setError(null);
      const response = await fetch(`/api/ai/process/${bookmarkId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ retry: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to trigger AI processing');
      }

      const data = await response.json();

      if (data.success) {
        setStatus('COMPLETED');
        setSummary(data.summary);
        onComplete?.(data.summary);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    }
  }, [bookmarkId, onComplete, onError]);

  // Initial fetch and start polling if needed
  useEffect(() => {
    if (!enabled || !bookmarkId) return;

    // Initial fetch
    fetchStatus();

    // Start polling if status is pending
    if (status === 'PENDING' || status === 'PROCESSING') {
      setIsPolling(true);
    }
  }, [enabled, bookmarkId, fetchStatus, status]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !bookmarkId) return;

    const timer = setInterval(fetchStatus, interval);

    return () => clearInterval(timer);
  }, [isPolling, bookmarkId, interval, fetchStatus]);

  return {
    status,
    summary,
    isPolling,
    error,
    refetch: fetchStatus,
    triggerProcess,
  };
}

/**
 * Hook for polling multiple bookmarks' AI status
 * Uses interval-based polling without initial synchronous fetch
 */
export function useMultipleAiStatus(
  bookmarkIds: string[],
  options: UseAiStatusOptions = {}
): Map<string, { status: AiStatus | null; summary: string | null }> {
  const [statuses, setStatuses] = useState<
    Map<string, { status: AiStatus | null; summary: string | null }>
  >(new Map());

  const { enabled = true, interval = 3000 } = options;

  // Keep refs in sync via effect
  const statusesRef = useRef<Map<string, { status: AiStatus | null; summary: string | null }>>(
    new Map()
  );
  const bookmarkIdsRef = useRef<string[]>([]);

  // Update refs in effect, not during render
  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  useEffect(() => {
    bookmarkIdsRef.current = bookmarkIds;
  }, [bookmarkIds]);

  // Polling effect
  useEffect(() => {
    if (!enabled || bookmarkIds.length === 0) return;

    let isMounted = true;

    const fetchAllStatuses = async () => {
      const currentStatuses = statusesRef.current;
      const currentIds = bookmarkIdsRef.current;

      const pendingIds = currentIds.filter((id) => {
        const current = currentStatuses.get(id);
        return !current || current.status === 'PENDING' || current.status === 'PROCESSING';
      });

      if (pendingIds.length === 0) return;

      const results = await Promise.all(
        pendingIds.map(async (id) => {
          try {
            const response = await fetch(`/api/ai/status/${id}`);
            if (!response.ok) return { id, status: null, summary: null };
            const data: AiStatusResponse = await response.json();
            return { id, status: data.aiStatus, summary: data.aiSummary };
          } catch {
            return { id, status: null, summary: null };
          }
        })
      );

      if (isMounted) {
        setStatuses((prev) => {
          const newMap = new Map(prev);
          for (const result of results) {
            newMap.set(result.id, { status: result.status, summary: result.summary });
          }
          return newMap;
        });
      }
    };

    // Initial fetch with slight delay to avoid synchronous setState
    const initialTimer = setTimeout(fetchAllStatuses, 0);

    // Set up polling
    const pollingTimer = setInterval(fetchAllStatuses, interval);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(pollingTimer);
    };
  }, [enabled, bookmarkIds.length, interval]);

  return statuses;
}
