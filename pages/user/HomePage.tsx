import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { getProducts } from '../../services/apiService';
import { Spinner } from '../../components/ui/Spinner';
import { useAppSettings } from '../../hooks/useAppSettings';

const HeroSection: React.FC = () => {
  const { storeName } = useAppSettings();
  return (
    <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-12 px-6 rounded-xl shadow-2xl mb-8 text-center">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to {storeName}
        </h1>
        <p className="text-base md:text-lg mb-6 max-w-3xl mx-auto">
          Your one-stop shop for premium electronics, Phone Accessories, and appliances. 
          Browse our catalog and add items to your cart to generate instant invoices.
        </p>
      </div>
    </section>
  );
};

const CategoryCard: React.FC<{ categoryName: string }> = ({ categoryName }) => (
  <Link 
    to={`/category/${encodeURIComponent(categoryName)}`} 
    className="block bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
  >
    <h3 className="text-xl font-semibold text-primary mb-2">{categoryName}</h3>
  </Link>
);

const HomePage: React.FC = () => {
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDynamicCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getProducts();
      if (products) {
        // Create a unique set of category names from all products
        const categorySet = new Set(products.map(p => p.category));
        setUniqueCategories(Array.from(categorySet).sort());
      } else {
        setUniqueCategories([]);
      }
    } catch (err) {
      setError('Failed to load product data for categories.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDynamicCategories();
  }, [fetchDynamicCategories]);

  return (
    <div className="space-y-12">
      <HeroSection />

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-darkgray text-center sm:text-left">Shop by Category</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
        ) : uniqueCategories.length === 0 ? (
          <p className="text-center text-xl text-mediumgray py-10">No categories available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {uniqueCategories.map(categoryName => (
              <CategoryCard key={categoryName} categoryName={categoryName} />
            ))}
          </div>
        )}
      </section>
      
      <section className="text-center mt-12">
          <Link to="/products" className="bg-primary text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-primary-hover transition-colors">
              Browse All Products
          </Link>
      </section>
    </div>
  );
};

export default HomePage;
