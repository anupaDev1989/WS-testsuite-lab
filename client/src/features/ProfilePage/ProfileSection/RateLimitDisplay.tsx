import React from 'react';
import type { RateLimitInfo } from '../../../types';

interface RateLimitDisplayProps {
  rateLimitData: RateLimitInfo | null;
  isLoading: boolean;
  error: string | null;
}

const RateLimitDisplay: React.FC<RateLimitDisplayProps> = ({ 
  rateLimitData, 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return <div>Loading rate limit information...</div>;
  }

  if (error) {
    return <div style={{ color: '#888' }}>Rate limit information unavailable</div>;
  }

  if (!rateLimitData) {
    return <div style={{ color: '#888' }}>No rate limit information available</div>;
  }

  // Format the window string to be more readable
  const formatWindow = (window: string | undefined): string => {
    if (!window) return 'unknown period';
    
    if (window.endsWith('s')) {
      const seconds = parseInt(window.slice(0, -1));
      if (isNaN(seconds)) return window; // If parsing fails, return the original string
      
      if (seconds === 60) return '1 minute';
      if (seconds === 3600) return '1 hour';
      if (seconds === 86400) return '1 day';
      if (seconds > 60 && seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
      if (seconds > 3600 && seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
      return `${seconds} seconds`;
    }
    return window;
  };

  // Calculate time until reset (with defensive checks)
  const resetTimestamp = rateLimitData.reset || 0;
  const minutesUntilReset = Math.max(0, Math.ceil((resetTimestamp * 1000 - Date.now()) / (60 * 1000)));
  const resetTime = resetTimestamp > 0 ? new Date(resetTimestamp * 1000).toLocaleTimeString() : 'unknown';
  
  // Determine color based on remaining percentage
  const getRemainingColor = () => {
    const limit = rateLimitData.limit || 0;
    const remaining = rateLimitData.remaining || 0;
    
    if (limit === 0) return '#888'; // Gray for unknown limit
    const remainingPercentage = (remaining / limit) * 100;
    if (remainingPercentage > 50) return '#4caf50'; // Green
    if (remainingPercentage > 20) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  // Calculate usage percentage for progress bar
  const limit = rateLimitData.limit || 0;
  const usage = limit > 0 ? limit - (rateLimitData.remaining || 0) : 0;
  const usagePercent = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;
  const remaining = rateLimitData.remaining || 0;

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px 24px',
        marginTop: '24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        maxWidth: 440,
      }}
      data-component-name="RateLimitDisplay"
    >
      <h3 style={{ margin: '0 0 18px 0', fontSize: 20, color: '#222' }}>API Rate Limits</h3>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Limit</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#333', lineHeight: 1 }}>{limit}</div>
          <div style={{ fontSize: 13, color: '#888' }}>requests per {formatWindow(rateLimitData.window)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>Remaining</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: getRemainingColor(),
              lineHeight: 1,
              padding: '0 8px',
              borderRadius: 6,
              background: '#f5f5f5',
              display: 'inline-block',
              minWidth: 56,
            }}
          >
            {remaining}
          </div>
        </div>
      </div>
      {/* Progress Bar */}
      <div style={{ width: '100%', background: '#eee', borderRadius: 6, height: 14, marginBottom: 12 }}>
        <div
          style={{
            width: `${usagePercent}%`,
            background: getRemainingColor(),
            height: '100%',
            borderRadius: 6,
            transition: 'width 0.5s',
          }}
        ></div>
      </div>
      <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
        <span style={{ fontWeight: 500 }}>Resets:</span> in {minutesUntilReset} {minutesUntilReset === 1 ? 'minute' : 'minutes'} (<span style={{ color: '#444' }}>{resetTime}</span>)
      </div>
    </div>
  );
};

export default RateLimitDisplay;
