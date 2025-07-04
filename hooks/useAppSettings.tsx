import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { APP_NAME as DEFAULT_APP_NAME } from '../constants';
import { fetchData, saveData } from '../services/apiService';

interface AppSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
}

interface AppSettingsContextType extends AppSettings {
  updateStoreName: (newName: string) => Promise<void>;
  updateContactEmail: (newEmail: string) => Promise<void>;
  updateContactPhone: (newPhone: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  isSettingsLoading: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);
const SETTINGS_API_FILENAME = 'appSettings';

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>({
    storeName: DEFAULT_APP_NAME,
    contactEmail: '',
    contactPhone: '',
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    const storedSettings = await fetchData<AppSettings>(SETTINGS_API_FILENAME);
    if (storedSettings && storedSettings.storeName) {
      setSettings(storedSettings);
    } else {
      const defaultSettings = {
        storeName: DEFAULT_APP_NAME,
        contactEmail: '',
        contactPhone: '',
      };
      setSettings(defaultSettings);
      await saveData(SETTINGS_API_FILENAME, defaultSettings);
    }
    setIsSettingsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateAndSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await saveData(SETTINGS_API_FILENAME, updatedSettings);
  };
  
  const updateStoreName = async (newName: string) => {
    const finalName = newName.trim() === '' ? DEFAULT_APP_NAME : newName.trim();
    await updateAndSaveSettings({ storeName: finalName });
  };

  const updateContactEmail = async (newEmail: string) => {
    await updateAndSaveSettings({ contactEmail: newEmail.trim() });
  };

  const updateContactPhone = async (newPhone: string) => {
    await updateAndSaveSettings({ contactPhone: newPhone.trim() });
  };

  const contextValue = {
    ...settings,
    updateStoreName,
    updateContactEmail,
    updateContactPhone,
    loadSettings,
    isSettingsLoading,
  };

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};