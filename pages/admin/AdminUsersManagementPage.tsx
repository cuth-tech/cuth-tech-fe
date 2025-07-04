import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AdminUser, AdminRole } from '../../types';
import { ADMIN_ROLES } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';

const UserIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const EditIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const KeyIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const AdminUsersManagementPage: React.FC = () => {
  const { loggedInUser, adminUsers, addAdminUser, updateAdminUser, resetAdminPassword, deleteAdminUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [currentUserForModal, setCurrentUserForModal] = useState<Partial<AdminUser> & { password?: string }>({});
  const [isEditing, setIsEditing] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUser | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  
  const navigate = useNavigate();
  const availableRoles = Object.values(ADMIN_ROLES);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  }

  const openAddModal = () => {
    clearMessages();
    setCurrentUserForModal({ name: '', username: '', email: '', role: ADMIN_ROLES.EDITOR as AdminRole, isActive: true, password: '' });
    setIsEditing(false);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    clearMessages();
    setCurrentUserForModal({ ...user });
    setIsEditing(true);
    setIsAddEditModalOpen(true);
  };

  const openDeleteModal = (user: AdminUser) => {
    clearMessages();
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const openResetPasswordModal = (user: AdminUser) => {
    clearMessages();
    setUserToResetPassword(user);
    setNewPasswordForReset('');
    setIsResetPasswordModalOpen(true);
  };
  
  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setCurrentUserForModal(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setCurrentUserForModal(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveUser = async () => {
    clearMessages();
    if (!currentUserForModal.username || !currentUserForModal.name || !currentUserForModal.email || !currentUserForModal.role) {
      setError("Username, Name, Email, and Role are required.");
      return;
    }
    if (!isEditing && (!currentUserForModal.password || currentUserForModal.password.length < 6)) {
        setError("Password is required for new users and must be at least 6 characters.");
        return;
    }
    if (currentUserForModal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUserForModal.email)) {
      setError("Invalid email format.");
      return;
    }


    setIsLoading(true);
    let result;
    if (isEditing && currentUserForModal.id) {
      const { id, username, password, createdAt, updatedAt, ...updateData } = currentUserForModal;
      result = await updateAdminUser(currentUserForModal.id, updateData as Partial<Pick<AdminUser, 'name' | 'email' | 'role' | 'isActive'>>);
    } else {
      const { id, createdAt, updatedAt, ...addData } = currentUserForModal;
      result = await addAdminUser(addData as Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(result.message);
      setIsAddEditModalOpen(false);
    } else {
      setError(result.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    clearMessages();
    setIsLoading(true);
    const result = await deleteAdminUser(userToDelete.id);
    setIsLoading(false);
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setError(result.message);
    }
    setIsDeleteModalOpen(false);
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword || !newPasswordForReset) {
        setError("New password cannot be empty for reset.");
        return;
    }
    if (newPasswordForReset.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
    }
    clearMessages();
    setIsLoading(true);
    const result = await resetAdminPassword(userToResetPassword.id, newPasswordForReset);
    setIsLoading(false);
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setError(result.message);
      return;
    }
    setIsResetPasswordModalOpen(false);
  };


  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Go back"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Admin User Management</h1>
        </div>
        <Button variant="primary" onClick={openAddModal} disabled={isLoading}>
          <UserIcon /> Add New Admin
        </Button>
      </div>

      {error && !isAddEditModalOpen && !isDeleteModalOpen && !isResetPasswordModalOpen && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4">{successMessage}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adminUsers.map(user => (
              <tr key={user.id} className="hover:bg-lightgray">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-darkgray">{user.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(user)} title="Edit" disabled={isLoading}><EditIcon /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openResetPasswordModal(user)} title="Reset Password" disabled={isLoading}><KeyIcon /></Button>
                  {loggedInUser?.id !== user.id && ( // Superadmin cannot delete themselves
                    <Button variant="ghost" size="sm" onClick={() => openDeleteModal(user)} className="text-red-500 hover:text-red-700" title="Delete" disabled={isLoading}><TrashIcon /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={isEditing ? 'Edit Admin User' : 'Add New Admin User'}
        footerContent={
          <>
            <Button variant="outline" onClick={() => setIsAddEditModalOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveUser} isLoading={isLoading}>Save User</Button>
          </>
        }
      >
        {error && isAddEditModalOpen && <p className="text-red-500 bg-red-100 p-2 rounded-sm mb-3 text-sm">{error}</p>}
        <div className="space-y-4">
          <Input label="Full Name" name="name" value={currentUserForModal.name || ''} onChange={handleModalInputChange} required />
          <Input label="Username" name="username" value={currentUserForModal.username || ''} onChange={handleModalInputChange} required disabled={isEditing} />
          <Input label="Email" name="email" type="email" value={currentUserForModal.email || ''} onChange={handleModalInputChange} required />
          {!isEditing && (
            <Input label="Password" name="password" type="password" value={currentUserForModal.password || ''} onChange={handleModalInputChange} required />
          )}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-darkgray mb-1">Role</label>
            <select name="role" id="role" value={currentUserForModal.role || ''} onChange={handleModalInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
              {availableRoles.map(role => <option key={role} value={role} className="capitalize">{role}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="isActive" className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="isActive" id="isActive" checked={currentUserForModal.isActive ?? false} onChange={handleModalInputChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm font-medium text-darkgray">Active</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Admin"
        footerContent={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} isLoading={isLoading}>Delete Admin</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the admin user "<strong>{userToDelete?.name} ({userToDelete?.username})</strong>"? This action cannot be undone.</p>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={`Reset Password for ${userToResetPassword?.name}`}
        footerContent={
          <>
            <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleResetPassword} isLoading={isLoading}>Reset Password</Button>
          </>
        }
      >
         {error && isResetPasswordModalOpen && <p className="text-red-500 bg-red-100 p-2 rounded-sm mb-3 text-sm">{error}</p>}
        <Input label="New Password" name="newPasswordForReset" type="password" value={newPasswordForReset} onChange={(e) => setNewPasswordForReset(e.target.value)} required />
      </Modal>
    </div>
  );
};

export default AdminUsersManagementPage;