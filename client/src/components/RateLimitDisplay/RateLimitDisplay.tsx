import { useEffect, useState } from 'react';
import { getRateLimitInfo, type RateLimitInfo } from '@/services/rateLimitService';

function formatTimeLeft(resetTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Math.max(0, resetTimestamp - now);
  if (secondsLeft === 0) return 'resetting...';
  if (secondsLeft < 60) return `${secondsLeft}s`;
  const minutes = Math.floor(secondsLeft / 60);
  return `${minutes}m${secondsLeft % 60}s`;
}

export default function RateLimitDisplay() {
  const [limits, setLimits] = useState<RateLimitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLimits() {
      try {
        const data = await getRateLimitInfo();
        setLimits(data);
        setError(null); // Clear previous errors on success
        setDetailedError(null);
      } catch (err: any) {
        console.error('RateLimitDisplay fetchLimits error:', err);
        setError('Failed to load rate limits.');
        if (err instanceof Error) {
          setDetailedError(err.message);
        } else {
          setDetailedError('An unknown error occurred.');
        }
      }
    }
    fetchLimits();
    // Refresh every 5 seconds to keep the countdown accurate
    const intervalId = setInterval(fetchLimits, 5000);
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return (
      <span className="text-xs text-red-500">
        {error} {detailedError && `(${detailedError})`}
      </span>
    );
  }

  if (!limits) {
    return <span className="text-xs text-gray-400">Loading limits...</span>;
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-300">
      <span>
        Worker:{' '}
        <span className="font-semibold">
          {limits.worker.remaining}/{limits.worker.limit}
        </span>{' '}
        <span className="text-gray-400">({formatTimeLeft(limits.worker.reset)})</span>
      </span>
      <span>|</span>
      <span>
        LLM ({limits.llm.tier}):{' '}
        <span className="font-semibold">
          {limits.llm.remaining}/{limits.llm.limit}
        </span>{' '}
        <span className="text-gray-400">({formatTimeLeft(limits.llm.reset)})</span>
      </span>
    </div>
  );
}
