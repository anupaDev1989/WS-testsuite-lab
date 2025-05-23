import React, { useState } from 'react';

// These would typically be more complex components or trigger modals
const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText: string; children?: React.ReactNode; }> = ({ isOpen, onClose, onConfirm, title, message, confirmText, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', minWidth: '300px' }}>
        <h3>{title}</h3>
        <p>{message}</p>
        {children && <div style={{ marginTop: '15px', marginBottom: '15px' }}>{children}</div>}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm} style={{ backgroundColor: 'red', color: 'white' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const DangerZone: React.FC = () => {
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleDeleteAccount = () => {
    // 1. Ask for password reauthentication
    // 2. Show final warning
    // 3. On confirm, call API
    console.log('Account deletion confirmed with password:', password);
    setDeleteModalOpen(false);
    setPassword('');
    alert('Account deletion process initiated (placeholder).');
  };

  const handleDeactivateAccount = () => {
    console.log('Account deactivation confirmed.');
    setDeactivateModalOpen(false);
    alert('Account deactivation process initiated (placeholder).');
  };

  const handleDownloadData = () => {
    alert('Requesting data export (placeholder)... Check your email for download link.');
  };

  const sectionStyle: React.CSSProperties = {
    border: '2px solid red',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    backgroundColor: '#fff5f5'
  };

  const actionItemStyle: React.CSSProperties = {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px dashed #ffcccc',
  };

  const lastActionItemStyle: React.CSSProperties = {
    ...actionItemStyle,
    borderBottom: 'none',
    paddingBottom: 0,
    marginBottom: 0,
  };

  return (
    <div>
      <h2>Account Actions</h2>
      
      <div style={sectionStyle}>
        <h3>Danger Zone</h3>
        <p style={{ color: 'red', fontWeight: 'bold' }}>Warning: Actions in this section can have permanent consequences.</p>

        <div style={actionItemStyle}>
          <h4>Deactivate Account</h4>
          <p>Temporarily deactivate your account. Your data will be kept, and you can reactivate by logging in.</p>
          <button onClick={() => setDeactivateModalOpen(true)} style={{ backgroundColor: '#ffc107' }}>Deactivate Account</button>
        </div>

        <div style={lastActionItemStyle}>
          <h4>Delete Account</h4>
          <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button onClick={() => setDeleteModalOpen(true)} style={{ backgroundColor: 'red', color: 'white' }}>Delete Account Permanently</button>
        </div>
      </div>

      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <h3>Data & Privacy</h3>
        <div style={actionItemStyle}>
          <h4>Download Your Data</h4>
          <p>Request an export of your personal data.</p>
          <button onClick={handleDownloadData}>Request Data Export</button>
        </div>
        <div style={actionItemStyle}>
          <h4>Privacy Settings</h4>
          <p>Manage your privacy preferences and data sharing options.</p>
          <button onClick={() => alert('Navigate to Privacy Settings (placeholder)')}>Manage Privacy Settings</button>
        </div>
        <div style={lastActionItemStyle}>
          <h4>Email Preferences</h4>
          <p>Control the types of emails you receive from us.</p>
          <button onClick={() => alert('Navigate to Email Preferences (placeholder)')}>Manage Email Preferences</button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isDeactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivateAccount}
        title="Confirm Account Deactivation"
        message="Are you sure you want to temporarily deactivate your account? You can reactivate it by logging in again."
        confirmText="Deactivate"
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPassword('');
        }}
        onConfirm={handleDeleteAccount}
        title="Confirm Permanent Account Deletion"
        message={`This action is irreversible and will permanently delete your account and all associated data. 
Please re-enter your password to confirm.`}
        confirmText="Delete Permanently"
      >
        <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter password to confirm"
            style={{ marginTop: '10px', display: 'block', width: 'calc(100% - 22px)', padding: '10px' }}
        />
        <p style={{fontSize: '0.8em', color: 'grey', marginTop: '5px'}}>Note: Password field in modal is a simplified placeholder for demonstration.</p>
      </ConfirmationModal>

    </div>
  );
};

export default DangerZone;
