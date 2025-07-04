import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useAppSettings } from '../hooks/useAppSettings';
import { Button } from './ui/Button';
import { getCategories as fetchHeaderCategoriesApiService } from '../services/apiService'; 
import { Category, AdminRole } from '../types';
import { ADMIN_ROLES } from '../constants';

const ShoppingCartIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const MenuIconSvg: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const UserGroupIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-7.81-5.971m5.971 0a5.992 5.992 0 00-3.181 2.13m5.971 0A12.034 12.034 0 0012 7.5a4.5 4.5 0 00-4.5 4.5m4.5 0v.75m3.75 0A11.953 11.953 0 0112 21m0-2.25v.75m2.59.031a6.002 6.002 0 003.741-.479m0 0L21 18m-2.25-2.25a9.094 9.094 0 00-3.741-.479m5.963 1.584A6.062 6.062 0 0115 18.719m0-5.971a5.992 5.992 0 00-3.181 2.13M15 12.75A4.5 4.5 0 0010.5 7.5m4.5 4.5v.75m3.75 0a11.953 11.953 0 01-3.75 2.25M12 7.5a4.5 4.5 0 00-4.5 4.5m4.5 0v.75" />
    </svg>
);
const DocumentTextIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const DocumentDuplicateIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
);

const DocumentCheckIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m12 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const SECRET_ADMIN_SEQUENCE = ['c', 'u', 't', 'h'];
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const Header: React.FC = () => {
  const { loggedInUser, logout, isLoggedIn } = useAuth();
  const { cart } = useCart();
  const { storeName } = useAppSettings();
  const navigate = useNavigate();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [headerCategories, setHeaderCategories] = useState<Category[]>([]);
  const [isLoadingHeaderCategories, setIsLoadingHeaderCategories] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [keySequenceBuffer, setKeySequenceBuffer] = useState<string[]>([]);
  const inactivityTimerRef = useRef<number | null>(null);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const loadHeaderCategories = useCallback(async () => {
    setIsLoadingHeaderCategories(true);
    try {
      const cats = await fetchHeaderCategoriesApiService();
      // FIX: Handle the case where 'cats' can be null
      setHeaderCategories(cats || []);
    } catch (error) {
      console.error("Failed to load categories for header:", error);
      setHeaderCategories([]); 
    } finally {
      setIsLoadingHeaderCategories(false);
    }
  }, []); 

  const toggleCategoryMenu = () => {
    const openingMenu = !isCategoryMenuOpen;
    setIsCategoryMenuOpen(openingMenu);
    if (openingMenu) {
      loadHeaderCategories();
    }
  };

  const handleCategoryLinkClick = () => {
    setIsCategoryMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoggedIn) return; 

      const targetElement = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetElement.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();
      
      if (key.length === 1 && key >= 'a' && key <= 'z') {
        const newBuffer = [...keySequenceBuffer, key].slice(-SECRET_ADMIN_SEQUENCE.length);
        setKeySequenceBuffer(newBuffer);

        if (newBuffer.join('') === SECRET_ADMIN_SEQUENCE.join('')) {
          navigate('/admin/login');
          setKeySequenceBuffer([]); 
        }
      } else if (keySequenceBuffer.length > 0) {
        setKeySequenceBuffer([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keySequenceBuffer, navigate, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) { 
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return; 
    }

    const activityEvents: (keyof DocumentEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const handleInactivityLogout = () => {
      console.log("Admin inactive, logging out."); 
      logout();
      navigate('/');
    };

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { capture: true, passive: true });
    });

    resetInactivityTimer(); 

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, { capture: true });
      });
    };
  }, [isLoggedIn, logout, navigate]);


  return (
    <header className="bg-white text-darkgray shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center flex-shrink-0">
            <Link to="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">{storeName}</Link>
        </div>
        
        <nav className="hidden sm:flex items-center justify-start flex-grow space-x-2 sm:space-x-3 md:space-x-4 ml-4">
            {/* Centered navigation items can go here */}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
            <Link to="/products" className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium">Products</Link>
            
            <div className="relative" ref={categoryMenuRef}>
                <button
                onClick={toggleCategoryMenu}
                className="p-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Toggle category menu"
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
                >
                <MenuIconSvg className="h-6 w-6" />
                </button>
                {isCategoryMenuOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="category-menu-button"
                >
                    {isLoadingHeaderCategories ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading categories...</div>
                    ) : headerCategories.length > 0 ? (
                    headerCategories.map(cat => (
                        <Link
                        key={cat.id}
                        to={`/category/${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                        role="menuitem"
                        onClick={handleCategoryLinkClick}
                        >
                        {cat.name}
                        </Link>
                    ))
                    ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No categories found.</div>
                    )}
                </div>
                )}
            </div>

            <Link to="/cart" className="relative text-gray-700 hover:text-blue-600 p-2" aria-label={`View cart, ${totalCartItems} items`}>
                <ShoppingCartIcon className="h-6 w-6" />
                {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalCartItems}
                </span>
                )}
            </Link>

            {isLoggedIn && loggedInUser && (
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2">Dashboard</Link>
                    
                    {(loggedInUser.role === ADMIN_ROLES.SUPERADMIN || loggedInUser.role === ADMIN_ROLES.MANAGER) && (
                        <>
                            <Link to="/admin/tags" className="text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2">Tags</Link>
                            <Link to="/admin/invoices" className="flex items-center text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2" title="Manage Invoices">
                                <DocumentDuplicateIcon className="mr-1"/> Invoices
                            </Link>
                            <Link to="/admin/receipts" className="flex items-center text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2" title="Manage Receipts">
                                <DocumentCheckIcon className="mr-1"/> Receipts
                            </Link>
                        </>
                    )}

                    {loggedInUser.role === ADMIN_ROLES.SUPERADMIN && (
                         <>
                             <Link to="/admin/users" className="flex items-center text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2" title="Manage Admin Users">
                                 <UserGroupIcon className="mr-1"/> Users
                             </Link>
                             <Link to="/admin/audit-logs" className="flex items-center text-gray-700 hover:text-blue-600 text-sm font-medium whitespace-nowrap px-1 sm:px-2" title="View Audit Logs">
                                 <DocumentTextIcon className="mr-1"/> Logs
                             </Link>
                         </>
                    )}
                    
                    {loggedInUser.role === ADMIN_ROLES.SUPERADMIN && (
                        <Link to="/admin/settings" className="text-gray-700 hover:text-blue-600 text-sm font-medium px-1 sm:px-2">Settings</Link>
                    )}
                    <Button 
                        onClick={() => { logout(); navigate('/'); }} 
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                    >
                        Logout ({loggedInUser.username})
                    </Button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  const { storeName, contactEmail, contactPhone } = useAppSettings();
  return (
    <footer className="bg-darkgray text-white py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="mb-2 text-lg font-semibold">&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        <div className="space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-300">
            {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                    {contactEmail}
                </a>
            )}
            {contactEmail && contactPhone && <span className="hidden sm:inline">|</span>}
            {contactPhone && (
                 <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">
                    {contactPhone}
                 </a>
            )}
        </div>
      </div>
    </footer>
  );
};

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
};