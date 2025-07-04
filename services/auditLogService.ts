import { AdminRole } from '../types';

// Defines the structure of a single audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminUserId: string;
  adminUsername: string;
  adminRole: AdminRole;
  action: string;
  entityType?: string;
  entityIdOrName?: string;
  details?: Record<string, any>;
}

const LOGS_STORAGE_KEY = 'techAppAuditLogs';

/**
 * Adds a new entry to the audit log in localStorage.
 * @param logData The data for the new log entry.
 */
export const addAuditLog = (logData: Omit<AuditLogEntry, 'id' | 'timestamp'>): void => {
  try {
    const existingLogsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
    const existingLogs: AuditLogEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];

    const newLog: AuditLogEntry = {
      ...logData,
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    // Add new log to the beginning and keep the list from growing too large (e.g., 500 entries)
    const updatedLogs = [newLog, ...existingLogs].slice(0, 500); 

    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};

/**
 * Retrieves all audit logs from localStorage.
 * @returns An array of audit log entries.
 */
export const getAuditLogs = (): AuditLogEntry[] => {
    try {
        const logsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
        return logsRaw ? JSON.parse(logsRaw) : [];
    } catch (error) {
        console.error("Failed to read audit logs:", error);
        return [];
    }
}