import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Removed .ts and .tsx extensions from all imports
import { AuditLogEntry } from '../../types';
import { getAuditLogs } from '../../services/auditLogService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

// --- NEW: dedicated bulk delete function for audit logs ---
const deleteAuditLogsBulk = async (ids: string[], actor: any) => {
    const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const response = await fetch(`${BACKEND_BASE_URL}/api/audit-logs/delete-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to bulk delete logs");
    }
    return response.json();
};


const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const AdminAuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const logsPerPage = 20;

    const [filters, setFilters] = useState({
        adminUsername: '',
        action: '',
        entityType: '',
        dateFrom: '',
        dateTo: '',
    });

    const navigate = useNavigate();
    const { loggedInUser } = useAuth();

    const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
    const [isBulkDeleteConfirmModalOpen, setIsBulkDeleteConfirmModalOpen] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [isOperating, setIsOperating] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchLogs = useCallback(async (page: number, currentFilters: typeof filters) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await getAuditLogs(page, logsPerPage, currentFilters);
            setLogs(result.logs);
            setTotalLogs(result.totalCount);
            setTotalPages(result.totalPages);
            setSelectedLogIds([]);
            setSelectAll(false);
        } catch (err) {
            setError('Failed to fetch audit logs.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(currentPage, filters);
    }, [currentPage, filters, fetchLogs]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedLogIds(logs.map(log => log.id));
        } else {
            setSelectedLogIds([]);
        }
    };

    const handleSelectLog = (logId: string) => {
        setSelectedLogIds(prev => {
            if (prev.includes(logId)) {
                return prev.filter(id => id !== logId);
            } else {
                return [...prev, logId];
            }
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedLogIds.length > 0) {
            setIsBulkDeleteConfirmModalOpen(true);
        }
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedLogIds.length === 0 || !loggedInUser) return;
        setIsOperating(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await deleteAuditLogsBulk(selectedLogIds, loggedInUser);
            if (result.success) {
                setSuccessMessage(`${result.deletedCount} audit log(s) deleted successfully.`);
                fetchLogs(1, filters); // Refresh list from page 1
            } else {
                setError(result.message || "Failed to bulk delete audit logs.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during bulk deletion.");
            console.error(err);
        } finally {
            setIsOperating(false);
            setIsBulkDeleteConfirmModalOpen(false);
        }
    };


  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Go back"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Audit Logs</h1>
        </div>

        {/* ... Rest of your JSX code for the form, table, etc. ... */}
        {/* The JSX from your previous version is fine and does not need changes. */}
    </div>
  );
};

export default AdminAuditLogPage;