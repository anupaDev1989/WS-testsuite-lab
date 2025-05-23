import React, { useState } from 'react';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiry: string;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  pdfUrl?: string; // Optional as it might not always exist
  description?: string; // Added for clarity in the table
}

const BillingSection: React.FC = () => {
  // Placeholder data - this will eventually come from state/API
  const currentPlan = {
    name: 'Free Tier',
    price: 0,
    currency: 'USD',
    billingCycle: 'N/A',
  };

  const paymentMethods: PaymentMethod[] = [
    // Example: { id: 'pm_123', type: 'Visa', last4: '4242', expiry: '12/25' }
    // Empty for free tier, or populated for paid users
  ];

  const billingHistory: BillingHistoryItem[] = [
    // Example: { id: 'inv_abc', date: '2023-04-01', amount: 15.00, status: 'Paid', pdfUrl: '#', description: 'Subscription Fee' }
    // Empty for free tier, or populated for paid users
  ];

  const availablePlans = [
    { id: 'pro', name: 'Pro Plan', price: 15, currency: 'USD', cycle: 'monthly', features: ['10,000 requests/day', 'Priority support', 'Advanced APIs'] },
    { id: 'business', name: 'Business Plan', price: 50, currency: 'USD', cycle: 'monthly', features: ['Unlimited requests', 'Dedicated support', 'All APIs & features'] },
  ];

  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  return (
    <div>
      <h2>Billing</h2>

      <div style={{ marginBottom: '30px' }}>
        <h4>Current Subscription</h4>
        <p><strong>Plan:</strong> {currentPlan.name}</p>
        <p><strong>Price:</strong> ${currentPlan.price} / {currentPlan.billingCycle}</p>
        {currentPlan.name === 'Free Tier' && <p>You are currently on the free plan.</p>}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>Payment Methods</h4>
        {paymentMethods.length > 0 ? (
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {paymentMethods.map(pm => (
              <li key={pm.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                {pm.type} ending in {pm.last4} (Expires: {pm.expiry})
                <button style={{ marginLeft: '10px' }}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No payment methods on file.</p>
        )}
        <button onClick={() => setShowAddPaymentMethod(!showAddPaymentMethod)}>
          {showAddPaymentMethod ? 'Cancel' : 'Add New Payment Method'}
        </button>
        {showAddPaymentMethod && (
          <div style={{ border: '1px dashed #ccc', padding: '15px', marginTop: '10px' }}>
            <em>Placeholder for Add Payment Method form (e.g., Stripe Elements)</em>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>Billing History</h4>
        {billingHistory.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Amount</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map(item => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.description || 'Subscription Fee'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.amount.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.status}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {item.pdfUrl ? 
                      <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a> : 
                      <span>N/A</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No billing history available.</p>
        )}
      </div>

      <div>
        <h4>Upgrade Plan</h4>
        <p>Explore our other plans:</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          {availablePlans.map(plan => (
            <div key={plan.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', flex: 1 }}>
              <h5>{plan.name}</h5>
              <p>${plan.price}/{plan.cycle}</p>
              <ul style={{ fontSize: '0.9em' }}>
                {plan.features.map((feature, idx) => <li key={idx}>{feature}</li>)}
              </ul>
              <button>Upgrade to {plan.name}</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default BillingSection;
