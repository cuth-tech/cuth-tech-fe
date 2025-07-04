import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../../types';
// NOTE: 'deleteInvoicesBulk' must be created and exported from apiService
import { getInvoices, deleteInvoice } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const DownloadIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

const AdminInvoiceManagementPage: React.FC = () => {
    const { loggedInUser } = useAuth();
    const { storeName, contactEmail, contactPhone } = useAppSettings();
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOperating, setIsOperating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const [isBulkDeleteConfirmModalOpen, setIsBulkDeleteConfirmModalOpen] = useState(false);
    const [selectAll, setSelectAll] = useState(false);


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const { invoices: fetchedInvoices } = await getInvoices({ searchTerm: debouncedSearchTerm });
            setInvoices(fetchedInvoices);
            setSelectedInvoiceIds([]);
            setSelectAll(false);
        } catch (err) {
            setError('Failed to fetch invoices. Please ensure the API is running and the function is exported.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedInvoiceIds(invoices.map(inv => inv.id));
        } else {
            setSelectedInvoiceIds([]);
        }
    };

    const handleSelectInvoice = (invoiceId: string) => {
        setSelectedInvoiceIds(prev => {
            if (prev.includes(invoiceId)) {
                return prev.filter(id => id !== invoiceId);
            } else {
                return [...prev, invoiceId];
            }
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedInvoiceIds.length > 0) {
            setIsBulkDeleteConfirmModalOpen(true);
        }
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedInvoiceIds.length === 0 || !loggedInUser) return;
        setIsOperating(true);
        setError(null);
        setSuccessMessage(null);

        // Placeholder for unimplemented feature
        console.warn("Bulk delete functionality is not yet implemented in apiService.ts");
        alert("Bulk delete is not yet implemented in the API service.");
        setError("This feature is not yet available.");
        setIsOperating(false);
        setIsBulkDeleteConfirmModalOpen(false);
    };


    const handleDownloadInvoicePdf = (invoice: Invoice) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const leftMargin = 15;
        const rightMargin = 15;
        let yPos = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(storeName, leftMargin, yPos);

        const isReceipt = invoice.status === 'completed';
        const docTitle = isReceipt ? 'RECEIPT' : 'INVOICE';
        const docNumberPrefix = isReceipt ? 'RCPT-' : 'INV-';
        const docNumber = invoice.invoiceNumber.startsWith('INV-') ? invoice.invoiceNumber.replace('INV-', docNumberPrefix) : invoice.invoiceNumber;
        
        doc.setFontSize(18);
        doc.text(docTitle, pageWidth - rightMargin, yPos, { align: 'right' });
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`${docTitle} #: ${docNumber}`, leftMargin, yPos);
        doc.text(`DATE: ${new Date(invoice.createdAt).toLocaleString()}`, pageWidth - rightMargin, yPos, { align: 'right' });
        yPos += 5;
        doc.setDrawColor(180, 180, 180);
        doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("BILL TO:", leftMargin, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.customerName, leftMargin, yPos); yPos += 5;
        doc.text(invoice.customerEmail, leftMargin, yPos); yPos += 5;
        doc.text(invoice.customerPhone, leftMargin, yPos); yPos += 15;

        const tableBody = invoice.items.map(item => [
            item.name,
            item.quantity.toString(),
            item.price.toFixed(2),
            (item.price * item.quantity).toFixed(2)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
            body: tableBody,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.1 },
            headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], fontSize: 9, lineWidth: { top: 0.1, right: 0, bottom: 0.1, left: 0 } },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } },
        });

        let tableFinalY = (doc as any).lastAutoTable.finalY || yPos + 20;
        yPos = tableFinalY + 10;

        const totalsX = pageWidth - rightMargin - 70;
        const amountsX = pageWidth - rightMargin;
        
        const discountValue = invoice.subtotal - invoice.total;
        if (discountValue > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`DISCOUNT:`, totalsX, yPos);
            doc.text(`-R ${discountValue.toFixed(2)}`, amountsX, yPos, { align: 'right' });
            yPos += 7;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("TOTAL:", totalsX, yPos);
        doc.text(`R ${invoice.total.toFixed(2)}`, amountsX, yPos, { align: 'right' });
        yPos += 15;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        const thankYouMessage = isReceipt ? "Thank You For Your Business!" : "Thank You For Your Interest!";
        doc.text(thankYouMessage, leftMargin, doc.internal.pageSize.getHeight() - 25);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let contactYPos = doc.internal.pageSize.getHeight() - 18;
        if (contactEmail) { doc.text(`Email: ${contactEmail}`, leftMargin, contactYPos); contactYPos += 4; }
        if (contactPhone) { doc.text(`Phone: ${contactPhone}`, leftMargin, contactYPos); }

        const filename = `${storeName}_${docTitle}_${invoice.invoiceNumber}.pdf`;
        doc.save(filename);
    };

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (invoice: Invoice) => {
        setInvoiceToDelete(invoice);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!invoiceToDelete || !loggedInUser) return;
        setIsOperating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const success = await deleteInvoice(invoiceToDelete.id, loggedInUser);
            if (success) {
                setSuccessMessage(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully.`);
                fetchInvoices();
            } else {
                setError("Failed to delete the invoice.");
            }
        } catch (err) {
            setError("An error occurred while deleting the invoice.");
            console.error(err);
        } finally {
            setIsOperating(false);
            setIsDeleteModalOpen(false);
            setInvoiceToDelete(null);
        }
    };


    return (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Go back">
                        <BackArrowIconSvg className="text-darkgray" />
                    </button>
                    <h1 className="text-3xl font-bold text-darkgray">Invoice Management</h1>
                </div>
            </div>

            <div className="mb-6">
                <Input
                    label="Search Invoices"
                    id="search"
                    type="search"
                    placeholder="Search by Invoice #, Name, or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{successMessage}</p>}

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
            ) : invoices.length === 0 ? (
                <p className="text-center text-mediumgray py-5">
                    {debouncedSearchTerm ? `No invoices found for "${debouncedSearchTerm}".` : "No invoices have been generated yet."}
                </p>
            ) : (
                <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-primary rounded"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-lightgray">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-primary rounded"
                                            checked={selectedInvoiceIds.includes(invoice.id)}
                                            onChange={() => handleSelectInvoice(invoice.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-primary">{invoice.invoiceNumber}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-darkgray">{invoice.customerName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${invoice.status === 'proforma' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumgray">{new Date(invoice.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-darkgray">R{invoice.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>View</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoicePdf(invoice)} title="Download" className="text-blue-500 hover:text-blue-700">
                                            <DownloadIcon />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(invoice)} title="Delete" className="text-red-500 hover:text-red-700">
                                            <TrashIcon />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedInvoiceIds.length > 0 && (
                <div className="mt-4 flex justify-end">
                    <Button
                        variant="danger"
                        onClick={handleBulkDeleteClick}
                        disabled={isOperating}
                        isLoading={isOperating && isBulkDeleteConfirmModalOpen}
                    >
                        Delete Selected ({selectedInvoiceIds.length})
                    </Button>
                </div>
            )}
            
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Invoice Details: ${selectedInvoice?.invoiceNumber}`}>
                {selectedInvoice && (
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold text-darkgray">Customer Details</h3>
                            <p><strong>Name:</strong> {selectedInvoice.customerName}</p>
                            <p><strong>Email:</strong> {selectedInvoice.customerEmail}</p>
                            <p><strong>Phone:</strong> {selectedInvoice.customerPhone}</p>
                            <p><strong>Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="border-t pt-3">
                            <h3 className="font-semibold text-darkgray mb-2">Items</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {selectedInvoice.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-lightgray p-2 rounded-md">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-mediumgray">{item.quantity} x R{item.price.toFixed(2)}</p>
                                        </div>
                                        <p className="font-semibold">R{(item.quantity * item.price).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t pt-3 text-right">
                                <p><strong>Subtotal:</strong> R{selectedInvoice.subtotal.toFixed(2)}</p>
                            <p className="text-lg font-bold text-primary"><strong>Total:</strong> R{selectedInvoice.total.toFixed(2)}</p>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Invoice Deletion"
                footerContent={
                    <>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isOperating}>Cancel</Button>
                        <Button variant="danger" onClick={handleConfirmDelete} isLoading={isOperating}>Delete Invoice</Button>
                    </>
                }>
                <p>Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>?</p>
                <p className="text-sm text-mediumgray mt-2">This action cannot be undone.</p>
            </Modal>

            <Modal isOpen={isBulkDeleteConfirmModalOpen} onClose={() => setIsBulkDeleteConfirmModalOpen(false)} title="Confirm Bulk Deletion"
                footerContent={
                    <>
                        <Button variant="outline" onClick={() => setIsBulkDeleteConfirmModalOpen(false)} disabled={isOperating}>Cancel</Button>
                        <Button variant="danger" onClick={handleConfirmBulkDelete} isLoading={isOperating}>Delete Selected ({selectedInvoiceIds.length})</Button>
                    </>
                }>
                <p>Are you sure you want to delete <strong>{selectedInvoiceIds.length}</strong> selected invoice(s)? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default AdminInvoiceManagementPage;