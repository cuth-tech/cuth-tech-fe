import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { getProducts } from '../../services/apiService';
import { Button as UIButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useCart } from '../../hooks/useCart';

// --- UI Components (Icons, ProductCard) ---
const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
);

const ProductCard: React.FC<{ product: Product; }> = ({ product }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleIncrement = () => addToCart(product, 1);
  const handleDecrement = () => {
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105">
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-darkgray mb-1 min-h-[3rem] line-clamp-2">{product.name}</h3>
        <p className="text-xs text-mediumgray mb-0.5">{product.category}</p>
        {product.brand && <p className="text-sm text-indigo-600 font-medium mb-1">{product.brand}</p>}
        {/* This now safely expects product.tags to be an array */}
        {product.tags && product.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {product.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xl font-bold text-primary">R{product.price.toFixed(2)}</p>
          <div className="flex items-center space-x-1">
            <UIButton variant="outline" size="sm" className="p-0 w-8 h-8 flex items-center justify-center" onClick={handleDecrement} disabled={quantityInCart === 0} aria-label="Remove one item from cart">
              <MinusIcon className="h-7 w-7" />
            </UIButton>
            <span className="w-10 text-center font-semibold text-lg text-darkgray" aria-live="polite">{quantityInCart}</span>
            <UIButton variant="primary" size="sm" className="p-0 w-8 h-8 flex items-center justify-center" onClick={handleIncrement} aria-label="Add one item to cart">
              <PlusIcon className="h-7 w-7" />
            </UIButton>
          </div>
        </div>
      </div>
    </div>
  );
};

type ProductSortKey = 'default' | 'oldest' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'brand-asc' | 'brand-desc';

// --- Main Page Component ---
const ProductBrowsePage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sort State
  const searchTerm = searchParams.get('q') || '';
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [productSortKey, setProductSortKey] = useState<ProductSortKey>('default');

  // Data Fetching and Normalization
  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productsData = await getProducts();
        
        // FIXED: Normalize the tags property to always be an array
        const normalizedProducts = (productsData || []).map(p => {
            const tagsAsUnknown = p.tags as unknown; // Cast to unknown for type safety
            let tagsAsArray: string[] = [];
            if (tagsAsUnknown && typeof tagsAsUnknown === 'string') {
                tagsAsArray = tagsAsUnknown.split(',').map((t: string) => t.trim()).filter(t => t);
            } else if (Array.isArray(tagsAsUnknown)) {
                tagsAsArray = tagsAsUnknown;
            }
            return { ...p, tags: tagsAsArray };
        });

        setAllProducts(normalizedProducts);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageData();
  }, []); // Only run once on component mount

  // Derived State for Filters
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allProducts.forEach(p => {
        if(p.tags) {
            p.tags.forEach(tag => tagsSet.add(tag));
        }
    });
    return Array.from(tagsSet).sort();
  }, [allProducts]);

  // Memoized Filtering and Sorting
  const processedProducts = useMemo(() => {
    let productsToDisplay = [...allProducts];

    // Filter by category
    if (categoryName) {
      const decodedCategoryName = decodeURIComponent(categoryName).toLowerCase();
      productsToDisplay = productsToDisplay.filter(p => p.category.toLowerCase() === decodedCategoryName);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      productsToDisplay = productsToDisplay.filter(p =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        (p.brand && p.brand.toLowerCase().includes(lowerSearchTerm)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }

    // Filter by selected tag
    if (selectedTag && selectedTag !== 'all') {
      productsToDisplay = productsToDisplay.filter(p =>
        p.tags && p.tags.includes(selectedTag)
      );
    }

    // Sort the results
    switch (productSortKey) {
        case 'oldest':
            productsToDisplay.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            break;
        case 'name-asc':
            productsToDisplay.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            productsToDisplay.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            productsToDisplay.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            productsToDisplay.sort((a, b) => b.price - a.price);
            break;
        case 'brand-asc':
            productsToDisplay.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
            break;
        case 'brand-desc':
            productsToDisplay.sort((a, b) => (b.brand || '').localeCompare(a.brand || ''));
            break;
        case 'default':
        default:
            productsToDisplay.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
            break;
    }

    return productsToDisplay;
  }, [allProducts, categoryName, searchTerm, selectedTag, productSortKey]);

  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm.trim()) {
      newSearchParams.set('q', newSearchTerm);
    } else {
      newSearchParams.delete('q');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Render Logic
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }
  
  const pageTitle = categoryName ? decodeURIComponent(categoryName) : "All Products";

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate("/")} className="p-2 mr-3 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Go back">
            <BackArrowIconSvg className="text-darkgray h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-darkgray capitalize">{pageTitle}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="Search Products" id="search" type="search" placeholder="e.g., iPhone, Samsung, Battery..."
            value={searchTerm} onChange={handleSearchChange} wrapperClassName="md:col-span-1"
          />
          <div>
            <label htmlFor="tagFilter" className="block text-sm font-medium text-darkgray mb-1">Filter by Tags</label>
            <select id="tagFilter" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm p-2" aria-label="Filter products by tag" disabled={availableTags.length === 0}>
              <option value="all">Filter: All Tags</option>
              {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="productSort" className="block text-sm font-medium text-darkgray mb-1">Sort by</label>
            <select id="productSort" value={productSortKey} onChange={(e) => setProductSortKey(e.target.value as ProductSortKey)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm p-2" aria-label="Sort products by">
              <option value="default">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="price-asc">Sort: Price (Low-High)</option>
              <option value="price-desc">Sort: Price (High-Low)</option>
              <option value="brand-asc">Sort: Brand (A-Z)</option>
              <option value="brand-desc">Sort: Brand (Z-A)</option>
            </select>
          </div>
        </div>
      </section>

      {error ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
      ) : processedProducts.length === 0 ? (
        <p className="text-center text-xl text-mediumgray py-10">No products found for your criteria.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {processedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductBrowsePage;
