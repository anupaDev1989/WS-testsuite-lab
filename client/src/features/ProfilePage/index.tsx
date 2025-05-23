import React, { useState } from 'react';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';
import UsageSection from './UsageSection';
import BillingSection from './BillingSection';
import DangerZone from './DangerZone';

const TABS = {
  PROFILE: 'Profile',
  USAGE: 'Usage & Limits',
  SECURITY: 'Security',
  BILLING: 'Billing',
  ACCOUNT: 'Account Actions',
};

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.PROFILE:
        return <ProfileSection />;
      case TABS.USAGE:
        return <UsageSection />;
      case TABS.SECURITY:
        return <SecuritySection />;
      case TABS.BILLING:
        return <BillingSection />;
      case TABS.ACCOUNT:
        return <DangerZone />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div>
      <h1>User Profile</h1>
      <nav>
        <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {Object.values(TABS).map((tab) => (
            <li key={tab}>
              <button 
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  backgroundColor: activeTab === tab ? '#e0e0e0' : '#f9f9f9',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                }}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfilePage;
