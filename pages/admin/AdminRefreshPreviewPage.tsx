import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { fetchProductsFromSheetForPreview, replaceAllProducts, getProducts } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const AdminRefreshPreviewPage: React.FC = () => {
    const navigate = useNavigate();
    const { loggedInUser } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isOperating, setIsOperating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
    const [currentProductCount, setCurrentProductCount] = useState<number>(0);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const fetchPreviewAndCount = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [previewResult, currentProducts] = await Promise.all([
                fetchProductsFromSheetForPreview(),
                getProducts(undefined, undefined, loggedInUser)
            ]);
            
            if (previewResult.success && previewResult.products) {
                setPreviewProducts(previewResult.products);
            } else {
                setError(previewResult.message || "Failed to retrieve products from sheet.");
            }

            // Safely set the count, handling the possibility of a null result
            setCurrentProductCount(currentProducts?.length ?? 0);

        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching data.");
        } finally {
            setIsLoading(false);
        }
    }, [loggedInUser]);

    useEffect(() => {
        fetchPreviewAndCount();
    }, [fetchPreviewAndCount]);

    const handleConfirmAndReplace = async () => {
        if (!loggedInUser || previewProducts.length === 0) {
            setError("Cannot replace products. No user is logged in or no products in preview.");
            setIsConfirmModalOpen(false);
            return;
        }
        setIsOperating(true);
        setError(null);
        try {
            const result = await replaceAllProducts(previewProducts, loggedInUser);
            if (result.success) {
                // Navigate to dashboard, passing state to show a success message upon arrival
                navigate('/admin/dashboard', { state: { successMessage: 'Products successfully replaced!' } });
            } else {
                setError(result.message || "Failed to replace products.");
            }
        } catch(err: any) {
            setError(err.message || "An unknown error occurred during replacement.");
        } finally {
            setIsOperating(false);
            setIsConfirmModalOpen(false);
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Go back" disabled={isOperating}>
                    <BackArrowIconSvg className="text-darkgray" />
                </button>
                <h1 className="text-3xl font-bold text-darkgray">Preview & Confirm Product Refresh</h1>
            </div>

            <p className="text-mediumgray mb-4">
                This page shows a preview of the products found in the Google Sheet. Review the list below. If it looks correct, you can replace all current products in the store with this list.
            </p>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
            ) : previewProducts.length === 0 && !error ? (
                <p className="text-center text-mediumgray py-5">No products found in the Google Sheet, or the sheet is empty.</p>
            ) : (
                <>
                    <div className="overflow-x-auto border rounded-md max-h-[50vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewProducts.map((product, index) => (
                                    <tr key={product.id || index} className="hover:bg-lightgray">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-darkgray">{product.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumgray">R{product.price.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumgray">{product.category}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumgray">{product.brand || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumgray truncate max-w-xs">{product.tags?.join(', ') || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="mt-6 border-t pt-6 flex justify-end items-center gap-4">
                        <p className="text-sm text-mediumgray mr-auto">Found <strong>{previewProducts.length}</strong> products in the sheet.</p>
                        <Button variant="outline" onClick={() => navigate('/admin/dashboard')} disabled={isOperating}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={() => setIsConfirmModalOpen(true)} disabled={isOperating || previewProducts.length === 0}>
                            Confirm & Replace All Products
                        </Button>
                    </div>
                </>
            )}

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Product Replacement"
                footerContent={
                    <>
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} disabled={isOperating}>Cancel</Button>
                        <Button variant="danger" onClick={handleConfirmAndReplace} isLoading={isOperating}>Yes, Replace Everything</Button>
                    </>
                }>
                <p>Are you sure you want to proceed? This action will:</p>
                <ul className="list-disc list-inside my-2 space-y-1 text-sm">
                    <li><strong>DELETE</strong> all {currentProductCount} products currently in the store.</li>
                    <li><strong>IMPORT</strong> {previewProducts.length} new products from the sheet.</li>
                </ul>
                <p className="mt-4 text-sm text-red-700 bg-red-100 p-2 rounded-md">
                    <strong>Warning:</strong> This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default AdminRefreshPreviewPage;