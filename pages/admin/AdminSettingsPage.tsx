import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ADMIN_ROLES } from '../../constants';
import { useNavigate } from 'react-router-dom';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const AdminSettingsPage: React.FC = () => {
  const { loggedInUser, changeOwnPassword, changeOwnUsernameAndEmail } = useAuth();
  const { storeName, contactEmail, contactPhone, updateStoreName, updateContactEmail, updateContactPhone, loadSettings } = useAppSettings();
  const navigate = useNavigate();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Username/Email Change State (for self)
  const [selfNewUsername, setSelfNewUsername] = useState('');
  const [selfNewEmail, setSelfNewEmail] = useState('');
  const [selfAuthPassword, setSelfAuthPassword] = useState('');
  const [selfProfileMessage, setSelfProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSelfProfileLoading, setIsSelfProfileLoading] = useState(false);
  
  // Store Info State
  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localContactEmail, setLocalContactEmail] = useState(contactEmail);
  const [localContactPhone, setLocalContactPhone] = useState(contactPhone);
  const [storeInfoMessage, setStoreInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isStoreInfoLoading, setIsStoreInfoLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLocalStoreName(storeName);
    setLocalContactEmail(contactEmail);
    setLocalContactPhone(contactPhone);
  }, [storeName, contactEmail, contactPhone]);
  
  useEffect(() => {
    if (loggedInUser) {
        setSelfNewUsername(loggedInUser.username);
        setSelfNewEmail(loggedInUser.email);
    }
  }, [loggedInUser]);


  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsPasswordLoading(true);
    const result = await changeOwnPassword(currentPassword, newPassword);
    setIsPasswordLoading(false);

    if (result.success) {
      setPasswordMessage({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.message });
    }
  };

  const handleSelfProfileChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelfProfileMessage(null);
    if (!selfNewUsername.trim() || selfNewUsername.trim().length < 3) {
      setSelfProfileMessage({ type: 'error', text: 'New username must be at least 3 characters.' });
      return;
    }
    if (!selfNewEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selfNewEmail.trim())) {
      setSelfProfileMessage({ type: 'error', text: 'Invalid email format.' });
      return;
    }
    if (!selfAuthPassword) {
        setSelfProfileMessage({type: 'error', text: 'Current password is required to update profile.'});
        return;
    }


    setIsSelfProfileLoading(true);
    const result = await changeOwnUsernameAndEmail(selfNewUsername.trim(), selfNewEmail.trim(), selfAuthPassword);
    setIsSelfProfileLoading(false);

    if (result.success) {
      setSelfProfileMessage({ type: 'success', text: result.message });
      setSelfAuthPassword(''); // Clear password field
    } else {
      setSelfProfileMessage({ type: 'error', text: result.message });
    }
  };

  const handleStoreInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreInfoMessage(null);

    if (loggedInUser?.role !== ADMIN_ROLES.SUPERADMIN) {
        setStoreInfoMessage({ type: 'error', text: 'Only superadmin can change store information.' });
        return;
    }

    setIsStoreInfoLoading(true);
    if (localContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localContactEmail)) {
        setStoreInfoMessage({ type: 'error', text: 'Please enter a valid contact email address.' });
        setIsStoreInfoLoading(false);
        return;
    }

    try {
        await updateStoreName(localStoreName);
        await updateContactEmail(localContactEmail);
        await updateContactPhone(localContactPhone);
        setStoreInfoMessage({ type: 'success', text: 'Store information updated successfully.' });
    } catch (error) {
        setStoreInfoMessage({ type: 'error', text: 'Failed to update store information.' });
        console.error("Store info update error:", error);
    } finally {
        setIsStoreInfoLoading(false);
    }
  };
  
  const canEditStoreInfo = loggedInUser?.role === ADMIN_ROLES.SUPERADMIN;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-10">
      <div className="flex items-center justify-center relative">
          <button 
              onClick={() => navigate(-1)} 
              className="absolute left-0 p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Go back"
          >
              <BackArrowIconSvg className="text-darkgray" />
          </button>
          <h1 className="text-3xl font-bold text-darkgray">Admin Settings</h1>
      </div>
      
      {/* Store Information Section */}
      <form onSubmit={handleStoreInfoSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-darkgray border-b pb-2">Store Information</h2>
        {storeInfoMessage && (
          <div className={`p-3 rounded-md text-sm ${storeInfoMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {storeInfoMessage.text}
          </div>
        )}
        <Input
          label="Store Name"
          id="storeName"
          value={localStoreName}
          onChange={(e) => setLocalStoreName(e.target.value)}
          placeholder="Your Application Name"
          disabled={!canEditStoreInfo || isStoreInfoLoading}
        />
        <Input
          label="Contact Email"
          id="contactEmail"
          type="email"
          value={localContactEmail}
          onChange={(e) => setLocalContactEmail(e.target.value)}
          placeholder="admin@example.com"
          disabled={!canEditStoreInfo || isStoreInfoLoading}
        />
        <Input
          label="Contact Phone"
          id="contactPhone"
          type="tel"
          value={localContactPhone}
          onChange={(e) => setLocalContactPhone(e.target.value)}
          placeholder="+1234567890"
          disabled={!canEditStoreInfo || isStoreInfoLoading}
        />
        {canEditStoreInfo && (
            <Button type="submit" variant="primary" isLoading={isStoreInfoLoading} className="w-full sm:w-auto">
            Save Store Information
            </Button>
        )}
        {!canEditStoreInfo && (
            <p className="text-sm text-mediumgray">Only Super Admins can edit store information.</p>
        )}
      </form>

      {/* Change Own Username & Email Section */}
      <form onSubmit={handleSelfProfileChangeSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-darkgray border-b pb-2">My Profile (Username & Email)</h2>
        {selfProfileMessage && (
          <div className={`p-3 rounded-md text-sm ${selfProfileMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {selfProfileMessage.text}
          </div>
        )}
        <Input
          label="My Username"
          id="selfNewUsername"
          value={selfNewUsername}
          onChange={(e) => { setSelfNewUsername(e.target.value); setSelfProfileMessage(null); }}
          required
          autoComplete="username"
        />
         <Input
          label="My Email"
          id="selfNewEmail"
          type="email"
          value={selfNewEmail}
          onChange={(e) => { setSelfNewEmail(e.target.value); setSelfProfileMessage(null); }}
          required
        />
        <Input
          label="My Current Password (for authorization)"
          id="selfAuthPassword"
          type="password"
          value={selfAuthPassword}
          onChange={(e) => { setSelfAuthPassword(e.target.value); setSelfProfileMessage(null); }}
          required
          autoComplete="current-password"
        />
        <Button type="submit" variant="primary" isLoading={isSelfProfileLoading} className="w-full sm:w-auto">
          Update My Profile
        </Button>
      </form>

      {/* Change Password Section (for self) */}
      <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-darkgray border-b pb-2">Change My Password</h2>
        {passwordMessage && (
          <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {passwordMessage.text}
          </div>
        )}
        <Input
          label="My Current Password"
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); setPasswordMessage(null); }}
          required
          autoComplete="current-password"
        />
        <Input
          label="New Password"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setPasswordMessage(null); }}
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm New Password"
          id="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordMessage(null); }}
          required
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" isLoading={isPasswordLoading} className="w-full sm:w-auto">
          Change My Password
        </Button>
      </form>
    </div>
  );
};

export default AdminSettingsPage;