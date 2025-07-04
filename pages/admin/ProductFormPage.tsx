import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Category } from '../../types';
import { getProductById, addProduct, updateProduct, getCategories } from '../../services/apiService';
import { Input } from '../../components/ui/Input'; 
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(productId);
  const { loggedInUser } = useAuth();

  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    brand: '', 
    tags: [], 
  });
  const [tagsInput, setTagsInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This function no longer depends on 'product', breaking the infinite loop.
  const fetchCategories = useCallback(async () => {
    setIsFetchingCategories(true);
    try {
      const cats = await getCategories();
      const validCats = cats || [];
      setCategories(validCats);
      // We set the default category here based on the result, not on component state
      if (validCats.length > 0 && !isEditing) { 
        setProduct(prev => ({ ...prev, category: prev.category || validCats[0].name }));
      }
    } catch (err) {
      setError('Failed to fetch categories.');
      console.error(err);
    } finally {
      setIsFetchingCategories(false);
    }
  }, [isEditing]); // Dependency removed

  useEffect(() => {
    const fetchProductDetails = async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        if (data) {
          setProduct(data);
          setTagsInput(data.tags ? data.tags.join(', ') : ''); 
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories(); 
    if (isEditing && productId) {
      fetchProductDetails(productId);
    } else {
      setIsLoading(false); 
    }
  }, [productId, isEditing, fetchCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
    const { name, value } = e.target;
    if (name === 'tags') {
      setTagsInput(value);
    } else {
      setProduct(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || product.price == null || product.price < 0 || !product.category) {
        setError("Name, price and category are required.");
        return;
    }
    if (!loggedInUser) {
        setError("You must be logged in to perform this action.");
        return;
    }
    setIsLoading(true); 
    setError(null);

    const processedTags = tagsInput.split(',')
                                  .map(tag => tag.trim())
                                  .filter(tag => tag !== '');
    
    const productDataToSave = {
        ...product,
        brand: product.brand?.trim() || undefined,
        tags: processedTags,
    };

    try {
      if (isEditing && productId) {
        await updateProduct(productId, productDataToSave as Product, loggedInUser); 
      } else {
        const productToAdd = productDataToSave as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
        await addProduct(productToAdd, loggedInUser);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'add'} product.`);
      console.error(err);
    } finally {
      setIsLoading(false); 
    }
  };
  
  if (isLoading || isFetchingCategories) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Product Name" id="name" name="name" type="text" value={product.name || ''} onChange={handleChange} required />
            <Input label="Price (R)" id="price" name="price" type="number" step="0.01" min="0" value={product.price || 0} onChange={handleChange} required />
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-darkgray mb-1">Category</label>
                <select
                    id="category"
                    name="category"
                    value={product.category || ''}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    disabled={isFetchingCategories}
                >
                    {categories.length === 0 ? (
                        <option value="">No categories available</option>
                    ) : (
                        <>
                            <option value="">Select a category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </>
                    )}
                </select>
            </div>
            <Input label="Brand (Optional)" id="brand" name="brand" type="text" value={product.brand || ''} onChange={handleChange} placeholder="e.g. Samsung, Itel, Apple" />
            <Input label="Tags (comma-separated)" id="tags" name="tags" type="text" value={tagsInput} onChange={handleChange} placeholder="e.g. new, featured, tech" />
            <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')} disabled={isLoading}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {isEditing ? 'Save Changes' : 'Add Product'}
                </Button>
            </div>
        </form>
    </div>
  );
};

export default ProductFormPage;