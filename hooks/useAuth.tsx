import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { AdminUser, AdminRole } from '../types';
import { INITIAL_ADMIN_USERS, ADMIN_ROLES } from '../constants';
import { addAuditLog } from '../services/auditLogService';
import { fetchData, saveData } from '../services/apiService';
import { Spinner } from '../components/ui/Spinner';

interface AuthContextType {
  loggedInUser: AdminUser | null;
  isLoggedIn: boolean;
  login: (username: string, passwordInput: string) => Promise<boolean>;
  logout: () => void;
  // Admin management
  adminUsers: AdminUser[];
  addAdminUser: (userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string; user?: AdminUser }>;
  updateAdminUser: (userId: string, updates: Partial<Pick<AdminUser, 'name' | 'email' | 'role' | 'isActive'>>) => Promise<{ success: boolean; message: string }>;
  resetAdminPassword: (userId: string, newPasswordInput: string) => Promise<{ success: boolean; message: string }>;
  deleteAdminUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  // Own account management
  changeOwnPassword: (currentPasswordInput: string, newPasswordInput: string) => Promise<{ success: boolean; message: string }>;
  changeOwnUsernameAndEmail: (newUsername: string, newEmail: string, currentPasswordInput: string) => Promise<{success: boolean; message: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGGED_IN_USER_SESSION_KEY = 'techAppLoggedInAdmin';
const ADMIN_USERS_API_FILENAME = 'adminUsers';

const loadAdminUsers = async (): Promise<AdminUser[]> => {
  const storedUsers = await fetchData<AdminUser[]>(ADMIN_USERS_API_FILENAME);
  if (storedUsers && storedUsers.length > 0) {
    return storedUsers;
  }
  const initialUsersWithIds = INITIAL_ADMIN_USERS.map((user, index) => ({
    ...user,
    id: `admin_${Date.now()}_${index}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  await saveData(ADMIN_USERS_API_FILENAME, initialUsersWithIds);
  return initialUsersWithIds;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<AdminUser | null>(() => {
    const storedUser = sessionStorage.getItem(LOGGED_IN_USER_SESSION_KEY);
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const initializeAuth = async () => {
        const users = await loadAdminUsers();
        setAdminUsers(users);
        setIsAuthLoading(false);
    };
    initializeAuth();
  }, []);

  const isLoggedIn = !!loggedInUser;

  const saveAdminUsersToApi = useCallback(async (users: AdminUser[]) => {
    await saveData(ADMIN_USERS_API_FILENAME, users);
    setAdminUsers(users);
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      sessionStorage.setItem(LOGGED_IN_USER_SESSION_KEY, JSON.stringify(loggedInUser));
    } else {
      sessionStorage.removeItem(LOGGED_IN_USER_SESSION_KEY);
    }
  }, [loggedInUser]);

  const login = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    if (isAuthLoading) {
      console.warn("Login blocked: Auth provider is not ready.");
      return false;
    }
    const userFound = adminUsers.find(
      (user) => user.username.toLowerCase() === usernameInput.toLowerCase()
    );

    if (userFound && userFound.password === passwordInput) {
      if (!userFound.isActive) {
        return false;
      }
      setLoggedInUser(userFound);
      return true;
    } else {
      return false;
    }
  };

  const logout = () => {
    const actor = loggedInUser;
    setLoggedInUser(null);
    if (actor) {
        addAuditLog({
        adminUserId: actor.id,
        adminUsername: actor.username,
        adminRole: actor.role,
        action: 'ADMIN_LOGOUT',
      });
    }
  };

  const addAdminUser = async (userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; user?: AdminUser }> => {
    if (loggedInUser?.role !== ADMIN_ROLES.SUPERADMIN) {
      return { success: false, message: "Unauthorized." };
    }
    if (adminUsers.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        return { success: false, message: `Username "${userData.username}" already exists.` };
    }
    if (adminUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return { success: false, message: `Email "${userData.email}" is already in use.` };
    }

    const newUser: AdminUser = {
      ...userData,
      id: `admin_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedUsers = [...adminUsers, newUser];
    await saveAdminUsersToApi(updatedUsers);
    addAuditLog({
      adminUserId: loggedInUser.id, adminUsername: loggedInUser.username, adminRole: loggedInUser.role,
      action: 'ADMIN_CREATED', entityType: 'AdminUser', entityIdOrName: newUser.username,
      details: { name: newUser.name, email: newUser.email, role: newUser.role }
    });
    return { success: true, message: "Admin user created successfully.", user: newUser };
  };

  const updateAdminUser = async (userId: string, updates: Partial<Pick<AdminUser, 'name' | 'email' | 'role' | 'isActive'>>): Promise<{ success: boolean; message: string }> => {
    if (loggedInUser?.role !== ADMIN_ROLES.SUPERADMIN) {
      return { success: false, message: "Unauthorized." };
    }
    
    const userIndex = adminUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: "User not found." };
    }

    const targetUser = adminUsers[userIndex];
    if (targetUser.id === loggedInUser.id) {
        if (updates.isActive === false) {
            return { success: false, message: "Superadmin cannot deactivate their own account."};
        }
        if (updates.role && updates.role !== ADMIN_ROLES.SUPERADMIN) {
            return { success: false, message: "Superadmin cannot change their own role to a non-superadmin role."};
        }
    }
   if (updates.email && adminUsers.some(u => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== userId)) {
        return { success: false, message: `Email "${updates.email}" is already in use by another admin.` };
   }

    const updatedUsers = adminUsers.map(u => 
      u.id === userId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
    );
    await saveAdminUsersToApi(updatedUsers);
    addAuditLog({
      adminUserId: loggedInUser.id, adminUsername: loggedInUser.username, adminRole: loggedInUser.role,
      action: 'ADMIN_UPDATED', entityType: 'AdminUser', entityIdOrName: targetUser.username,
      details: { updates }
    });
    return { success: true, message: "Admin user updated successfully." };
  };

  const resetAdminPassword = async (userId: string, newPasswordInput: string): Promise<{ success: boolean; message: string }> => {
    if (loggedInUser?.role !== ADMIN_ROLES.SUPERADMIN) {
      return { success: false, message: "Unauthorized." };
    }
    if (newPasswordInput.length < 6) {
        return { success: false, message: "New password must be at least 6 characters long." };
    }
    const updatedUsers = adminUsers.map(u =>
      u.id === userId ? { ...u, password: newPasswordInput, updatedAt: new Date().toISOString() } : u
    );
    await saveAdminUsersToApi(updatedUsers);
    const targetUser = adminUsers.find(u => u.id === userId);
    if(targetUser) {
        addAuditLog({
            adminUserId: loggedInUser.id, adminUsername: loggedInUser.username, adminRole: loggedInUser.role,
            action: 'ADMIN_PASSWORD_RESET', entityType: 'AdminUser', entityIdOrName: targetUser.username
        });
    }
    return { success: true, message: "Admin password reset successfully." };
  };

  const deleteAdminUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (loggedInUser?.role !== ADMIN_ROLES.SUPERADMIN) {
      return { success: false, message: "Unauthorized." };
    }
    if (userId === loggedInUser.id) {
      return { success: false, message: "Cannot delete your own superadmin account." };
    }
    const targetUser = adminUsers.find(u => u.id === userId);
    const updatedUsers = adminUsers.filter(u => u.id !== userId);
    await saveAdminUsersToApi(updatedUsers);
    if(targetUser) {
        addAuditLog({
            adminUserId: loggedInUser.id, adminUsername: loggedInUser.username, adminRole: loggedInUser.role,
            action: 'ADMIN_DELETED', entityType: 'AdminUser', entityIdOrName: targetUser.username
        });
    }
    return { success: true, message: "Admin user deleted successfully." };
  };

  const changeOwnPassword = async (currentPasswordInput: string, newPasswordInput: string): Promise<{ success: boolean; message: string }> => {
    if (!loggedInUser) return { success: false, message: "Not logged in." };

    if (loggedInUser.password !== currentPasswordInput) {
      return { success: false, message: "Incorrect current password." };
    }
    if (newPasswordInput.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const updatedUser = { ...loggedInUser, password: newPasswordInput, updatedAt: new Date().toISOString() };
    const updatedUsers = adminUsers.map(u =>
      u.id === loggedInUser.id ? updatedUser : u
    );
    await saveAdminUsersToApi(updatedUsers);
    setLoggedInUser(updatedUser);
    addAuditLog({
        adminUserId: loggedInUser.id, adminUsername: loggedInUser.username, adminRole: loggedInUser.role,
        action: 'ADMIN_OWN_PASSWORD_CHANGED', entityType: 'AdminUser', entityIdOrName: loggedInUser.username
    });
    return { success: true, message: "Password changed successfully." };
  };
  
  const changeOwnUsernameAndEmail = async (newUsername: string, newEmail: string, currentPasswordInput: string): Promise<{success: boolean, message: string}> => {
    if (!loggedInUser) return { success: false, message: "Not logged in." };
    if (loggedInUser.password !== currentPasswordInput) {
        return { success: false, message: "Incorrect password." };
    }
    if (!newUsername.trim() || newUsername.trim().length < 3) {
        return { success: false, message: "New username must be at least 3 characters long."};
    }
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
        return { success: false, message: "Invalid email format."};
    }

    const trimmedNewUsername = newUsername.trim();
    const trimmedNewEmail = newEmail.trim();

    if (adminUsers.some(u => u.username.toLowerCase() === trimmedNewUsername.toLowerCase() && u.id !== loggedInUser.id)) {
        return { success: false, message: `Username "${trimmedNewUsername}" is already taken.` };
    }
    if (adminUsers.some(u => u.email.toLowerCase() === trimmedNewEmail.toLowerCase() && u.id !== loggedInUser.id)) {
        return { success: false, message: `Email "${trimmedNewEmail}" is already in use.` };
    }
    
    const oldUsername = loggedInUser.username;
    const oldEmail = loggedInUser.email;

    const updatedUser = { ...loggedInUser, username: trimmedNewUsername, email: trimmedNewEmail, updatedAt: new Date().toISOString() };
    const updatedUsers = adminUsers.map(u =>
      u.id === loggedInUser.id ? updatedUser : u
    );
    await saveAdminUsersToApi(updatedUsers);
    setLoggedInUser(updatedUser);

    addAuditLog({
        adminUserId: loggedInUser.id, adminUsername: oldUsername, adminRole: loggedInUser.role,
        action: 'ADMIN_OWN_PROFILE_UPDATED', entityType: 'AdminUser', entityIdOrName: trimmedNewUsername,
        details: { oldUsername, newUsername: trimmedNewUsername, oldEmail, newEmail: trimmedNewEmail }
    });
    return { success: true, message: "Username and email updated successfully." };
  };

  return (
    <AuthContext.Provider value={{ 
        loggedInUser, 
        isLoggedIn, 
        login, 
        logout, 
        adminUsers, 
        addAdminUser, 
        updateAdminUser, 
        resetAdminPassword, 
        deleteAdminUser,
        changeOwnPassword,
        changeOwnUsernameAndEmail
    }}>
      {isAuthLoading ? (
         <div className="flex flex-col justify-center items-center h-screen bg-lightgray">
            <Spinner size="lg" />
            <p className="mt-4 text-xl text-darkgray">Loading Security...</p>
         </div>
       ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};