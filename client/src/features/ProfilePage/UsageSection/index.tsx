import React, { useState } from 'react';

const UsageSection: React.FC = () => {
  // Placeholder data - this will eventually come from state/API
  const usageData = {
    currentUsage: 750,
    limit: 1000,
    resetTimestamp: Date.now() + (24 * 60 * 60 * 1000), // Approx. 24 hours from now
    window: 'day',
    tier: 'free',
    endpoints: {
      '/api/data': { count: 500, limit: 700 },
      '/api/compute': { count: 250, limit: 300 },
    },
  };

  const planDetails = {
    name: 'Free Tier',
    features: ['1,000 requests/day', 'Basic support', 'Access to core APIs'],
    nextBillingDate: null, // Or a date string for paid plans
    usageResetSchedule: 'Resets daily at midnight UTC',
  };

  const [showHistory, setShowHistory] = useState(false);
  const [showRateLimits, setShowRateLimits] = useState(false);

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage < 70) return 'green';
    if (percentage < 90) return 'orange';
    return 'red';
  };

  const usagePercentage = (usageData.currentUsage / usageData.limit) * 100;

  return (
    <div>
      <h2>Usage & Limits</h2>

      <div style={{ marginBottom: '30px' }}>
        <h4>Current Period Usage</h4>
        <p>Requests: {usageData.currentUsage} of {usageData.limit} used</p>
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '10px' }}>
          <div 
            style={{
              width: `${usagePercentage}%`,
              backgroundColor: getUsageColor(usageData.currentUsage, usageData.limit),
              height: '20px',
              borderRadius: '4px',
              textAlign: 'center',
              color: 'white',
              lineHeight: '20px'
            }}
          >
            {usagePercentage.toFixed(1)}%
          </div>
        </div>
        {usageData.endpoints && (
          <div>
            <h5>Breakdown by endpoint:</h5>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {Object.entries(usageData.endpoints).map(([endpoint, data]) => (
                <li key={endpoint} style={{ marginBottom: '5px' }}>
                  {endpoint}: {data.count} / {data.limit}
                  <div style={{ width: '50%', backgroundColor: '#f0f0f0', borderRadius: '2px', display: 'inline-block', marginLeft: '10px' }}>
                    <div style={{
                      width: `${(data.count/data.limit)*100}%`,
                      backgroundColor: getUsageColor(data.count, data.limit),
                      height: '10px',
                      borderRadius: '2px',
                    }}></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>Plan Details</h4>
        <p><strong>Current Plan:</strong> {planDetails.name}</p>
        <p><strong>Features:</strong></p>
        <ul style={{ listStylePosition: 'inside' }}>
          {planDetails.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        {planDetails.nextBillingDate && <p><strong>Next Billing Date:</strong> {new Date(planDetails.nextBillingDate).toLocaleDateString()}</p>}
        <p><strong>Usage Reset:</strong> {planDetails.usageResetSchedule}</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>
          Historical Usage 
          <button onClick={() => setShowHistory(!showHistory)} style={{ marginLeft: '10px' }}>
            {showHistory ? 'Hide' : 'Show'}
          </button>
        </h4>
        {showHistory && (
          <div>
            <p><em>Chart of last 30 days usage will be displayed here.</em></p>
            <div style={{ height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              [Usage Chart Placeholder]
            </div>
            <button>Export Usage Data (CSV)</button>
            <button style={{ marginLeft: '10px' }}>Export Usage Data (JSON)</button>
          </div>
        )}
      </div>

      <div>
        <h4>
          Rate Limit Information
          <button onClick={() => setShowRateLimits(!showRateLimits)} style={{ marginLeft: '10px' }}>
            {showRateLimits ? 'Hide' : 'Show'}
          </button>
        </h4>
        {showRateLimits && (
          <div>
            <p><em>Current rate limit headers from the API and their explanation will be displayed here.</em></p>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', border: '1px solid #ddd' }}>
              X-RateLimit-Limit: 1000
              X-RateLimit-Remaining: {usageData.limit - usageData.currentUsage}
              X-RateLimit-Reset: {Math.floor(usageData.resetTimestamp / 1000)}
            </pre>
            <p>Your requests are limited to {usageData.limit} per {usageData.window}. This limit resets at {new Date(usageData.resetTimestamp).toLocaleString()}.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default UsageSection;
