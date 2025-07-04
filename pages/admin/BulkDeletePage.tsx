import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '../../types';
import { 
    getProducts,
    getAllUniqueTags, 
    getAllUniqueBrands, 
    getCategories,
    deleteProductsBulk
} from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

type DeletionCriterion = 'tag' | 'brand' | 'category';

const BulkDeletePage: React.FC = () => {
    const navigate = useNavigate();
    const { loggedInUser } = useAuth();

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isOperating, setIsOperating] = useState(false);
    
    // Message states
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Data states
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    
    // Selection states
    const [deleteCriterion, setDeleteCriterion] = useState<DeletionCriterion>('tag');
    const [selectedValue, setSelectedValue] = useState<string>('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [tags, brands, categories, products] = await Promise.all([
                getAllUniqueTags(),
                getAllUniqueBrands(),
                getCategories(),
                getProducts(undefined, undefined, loggedInUser)
            ]);
            
            setAvailableTags(tags || []);
            setAvailableBrands(brands || []);
            setAvailableCategories(categories ? categories.filter((c: Category) => c.name !== "Uncategorized") : []);
            setAllProducts(products || []);

        } catch (err) {
            setError("Failed to load data for deletion criteria.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [loggedInUser]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    useEffect(() => {
        if (!selectedValue) {
            setFilteredProducts([]);
            return;
        }

        let newFilteredProducts: Product[] = [];
        switch (deleteCriterion) {
            case 'tag':
                newFilteredProducts = allProducts.filter(p => p.tags?.includes(selectedValue));
                break;
            case 'brand':
                newFilteredProducts = allProducts.filter(p => p.brand === selectedValue);
                break;
            case 'category':
                newFilteredProducts = allProducts.filter(p => p.category === selectedValue);
                break;
        }
        setFilteredProducts(newFilteredProducts);
        setSelectedProductIds(new Set()); 
    }, [selectedValue, deleteCriterion, allProducts]);

    const handleCriterionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDeleteCriterion(e.target.value as DeletionCriterion);
        setSelectedValue('');
        setFilteredProducts([]);
        setSelectedProductIds(new Set());
        setError(null);
        setSuccessMessage(null);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedValue(e.target.value);
    };
    
    const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedProductIds(new Set());
        }
    };
    
    const handleToggleSelectProduct = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) newSet.delete(productId);
            else newSet.add(productId);
            return newSet;
        });
    };

    const openConfirmationModal = () => {
        if (selectedProductIds.size === 0) {
            setError("Please select at least one product to delete.");
            return;
        }
        setError(null);
        setSuccessMessage(null);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDeletion = async () => {
        if (!loggedInUser || selectedProductIds.size === 0) {
            setError("Authentication error or no products selected.");
            return;
        }
        setIsOperating(true);

        try {
            const result = await deleteProductsBulk(Array.from(selectedProductIds), loggedInUser);
            if (result.success) {
                setSuccessMessage(`${result.deletedCount} product(s) deleted successfully. The data has been refreshed.`);
                setSelectedProductIds(new Set());
                setFilteredProducts([]);
                setSelectedValue('');
                await fetchAllData();
            } else {
                setError("Deletion failed. No products were removed.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during deletion.");
        } finally {
            setIsOperating(false);
            setIsConfirmModalOpen(false);
        }
    };

    const valueOptions = useMemo(() => {
        switch (deleteCriterion) {
            case 'tag': return availableTags;
            case 'brand': return availableBrands;
            case 'category': return availableCategories.map((c: Category) => c.name);
            default: return [];
        }
    }, [deleteCriterion, availableTags, availableBrands, availableCategories]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Go back">
                    <BackArrowIconSvg className="text-darkgray" />
                </button>
                <h1 className="text-3xl font-bold text-darkgray">Bulk Delete Products</h1>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{successMessage}</p>}
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="delete-criterion" className="block text-sm font-medium text-darkgray mb-1">1. Select Deletion Criterion</label>
                        <select id="delete-criterion" value={deleteCriterion} onChange={handleCriterionChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">
                            <option value="tag">By Tag</option>
                            <option value="brand">By Brand</option>
                            <option value="category">By Category</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="delete-value" className="block text-sm font-medium text-darkgray mb-1">2. Select a {deleteCriterion} to filter by</label>
                        <select id="delete-value" value={selectedValue} onChange={handleValueChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md" disabled={valueOptions.length === 0}>
                            <option value="">-- Select a {deleteCriterion} --</option>
                            {valueOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                {selectedValue && (
                    <div className="pt-4 border-t">
                        <h2 className="text-xl font-semibold text-darkgray mb-2">3. Select Products to Delete</h2>
                        {filteredProducts.length > 0 ? (
                                <div className="border rounded-md overflow-hidden">
                                    <div className="overflow-x-auto max-h-96">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2">
                                                        <Input type="checkbox" onChange={handleToggleSelectAll} checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0} aria-label="Select all products" wrapperClassName="m-0 p-0 flex items-center justify-center" />
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Brand</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Category</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredProducts.map(product => (
                                                    <tr key={product.id} className={`${selectedProductIds.has(product.id) ? 'bg-blue-50' : ''}`}>
                                                        <td className="px-4 py-2">
                                                            <Input type="checkbox" checked={selectedProductIds.has(product.id)} onChange={() => handleToggleSelectProduct(product.id)} aria-label={`Select product ${product.name}`} wrapperClassName="m-0 p-0 flex items-center justify-center" />
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-darkgray">{product.name}</td>
                                                        <td className="px-4 py-2 text-sm text-mediumgray">{product.brand || '-'}</td>
                                                        <td className="px-4 py-2 text-sm text-mediumgray">{product.category}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        ) : (
                            <p className="text-center text-mediumgray py-4">No products found for the selected {deleteCriterion} "{selectedValue}".</p>
                        )}
                    </div>
                )}

                {filteredProducts.length > 0 && (
                    <div className="pt-4 border-t">
                            <h2 className="text-xl font-semibold text-darkgray mb-2">4. Confirm Deletion</h2>
                        <Button variant="danger" onClick={openConfirmationModal} disabled={selectedProductIds.size === 0 || isOperating} className="w-full">
                            Delete {selectedProductIds.size} Selected Product(s)
                        </Button>
                    </div>
                )}
            </div>

             <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Bulk Deletion"
                footerContent={
                    <>
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} disabled={isOperating}>Cancel</Button>
                        <Button variant="danger" onClick={handleConfirmDeletion} isLoading={isOperating}>Confirm & Delete</Button>
                    </>
                }>
                <p>Are you sure you want to delete the <strong>{selectedProductIds.size} selected product(s)</strong>?</p>
                <p className="mt-4 text-sm text-red-700 bg-red-100 p-2 rounded-md">
                    <strong>Warning:</strong> This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default BulkDeletePage;