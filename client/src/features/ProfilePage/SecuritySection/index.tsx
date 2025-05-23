import React, { useState } from 'react';

const SecuritySection: React.FC = () => {
  // Placeholder data - this will eventually come from state/API
  const activeSessions = [
    {
      id: 'session1',
      userAgent: 'Chrome on macOS',
      ipAddress: '192.168.1.100',
      location: 'New York, USA',
      lastActive: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(), // 5 minutes ago
      current: true,
    },
    {
      id: 'session2',
      userAgent: 'Safari on iPhone',
      ipAddress: '10.0.0.5',
      location: 'San Francisco, USA',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(), // 2 hours ago
      current: false,
    },
  ];

  const twoFactorAuth = {
    enabled: false,
  };

  const passwordInfo = {
    lastChangedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toLocaleDateString(), // 30 days ago
  };

  const [showBackupCodes, setShowBackupCodes] = useState(false);

  return (
    <div>
      <h2>Security</h2>

      <div style={{ marginBottom: '30px' }}>
        <h4>Active Sessions</h4>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {activeSessions.map((session) => (
            <li key={session.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
              <strong>Device:</strong> {session.userAgent}<br />
              <strong>IP Address:</strong> {session.ipAddress} ({session.location})<br />
              <strong>Last Active:</strong> {session.lastActive}
              {session.current && <span style={{ marginLeft: '10px', color: 'green' }}>(Current session)</span>}
              {!session.current && <button style={{ marginLeft: '20px' }}>Log out</button>}
            </li>
          ))}
        </ul>
        <button>Log out all other sessions</button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>Two-Factor Authentication (2FA)</h4>
        <p>Status: {twoFactorAuth.enabled ? <span style={{ color: 'green' }}>Enabled</span> : <span style={{ color: 'red' }}>Disabled</span>}</p>
        {twoFactorAuth.enabled ? (
          <div>
            <button>Manage 2FA Settings</button>
            <button onClick={() => setShowBackupCodes(!showBackupCodes)} style={{ marginLeft: '10px' }}>
              {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
            </button>
            {showBackupCodes && (
              <div style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px' }}>
                <p>Your backup codes (save these in a safe place):</p>
                <pre>
                  XXXXX-XXXXX
                  YYYYY-YYYYY
                  ZZZZZ-ZZZZZ
                </pre>
              </div>
            )}
          </div>
        ) : (
          <button>Set Up Two-Factor Authentication</button>
        )}
      </div>

      <div>
        <h4>Password Management</h4>
        <p>Password last changed: {passwordInfo.lastChangedDate}</p>
        <button>Change Password</button>
        <div style={{ marginTop: '10px' }}>
          {/* Placeholder for password strength indicator */}
          Password strength: <span style={{ color: 'grey' }}>Not applicable (placeholder)</span>
        </div>
      </div>

    </div>
  );
};

export default SecuritySection;
