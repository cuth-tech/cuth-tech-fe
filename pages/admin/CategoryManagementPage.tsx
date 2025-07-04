import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../types';
import { getCategories, addCategory, updateCategory, deleteCategory, updateCategoryOrder } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

const EditIconSvg: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const TrashIconSvg: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 cursor-grab ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75V20.25M15 3.75V20.25" opacity="0.3" />
    </svg>
);


const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loggedInUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  const navigate = useNavigate(); 
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);


  const fetchCategoriesList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCategories(); 
      setCategories(data || []);
    } catch (err) {
      setError('Failed to fetch categories.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  const openModalForAdd = () => {
    setCurrentCategory({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (category: Category) => {
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setError(null); 
  };

  const handleSaveCategory = async () => {
    if (!currentCategory || !currentCategory.name) {
      setError("Category name is required.");
      return;
    }
    if (!loggedInUser) {
        setError("You must be logged in to perform this action.");
        return;
    }
    setIsLoading(true); 
    try {
      if (currentCategory.id) { 
        await updateCategory(currentCategory.id, {name: currentCategory.name, description: currentCategory.description}, loggedInUser);
      } else { 
        // FIX: Add the 'order' property when creating a new category
        await addCategory({ name: currentCategory.name, description: currentCategory.description, order: categories.length }, loggedInUser);
      }
      fetchCategoriesList(); 
      closeModal();
    } catch (err) {
      setError(`Failed to save category.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openDeleteConfirmModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleting(true); 
  };

  const closeDeleteConfirmModal = () => {
    setCategoryToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !loggedInUser) return;
    setIsLoading(true);
    try {
      await deleteCategory(categoryToDelete.id, loggedInUser);
      fetchCategoriesList();
      closeDeleteConfirmModal();
    } catch (err) {
      setError(`Failed to delete category ${categoryToDelete.name}.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentCategory) {
      setCurrentCategory({ ...currentCategory, [e.target.name]: e.target.value });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    dragItem.current = id;
    e.currentTarget.classList.add('opacity-50', 'bg-blue-100');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    dragOverItem.current = id;
    e.currentTarget.classList.add('border-blue-500', 'border-dashed');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('border-blue-500', 'border-dashed');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'bg-blue-100');
    e.currentTarget.classList.remove('border-blue-500', 'border-dashed');
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDrop = async (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); 
    e.currentTarget.classList.remove('border-blue-500', 'border-dashed');

    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current || !loggedInUser) {
        return;
    }

    const draggedItemId = dragItem.current;
    const targetItemId = dragOverItem.current;
    const draggedItemIndex = categories.findIndex(cat => cat.id === draggedItemId);
    const targetItemIndex = categories.findIndex(cat => cat.id === targetItemId);
    if (draggedItemIndex === -1 || targetItemIndex === -1) return;

    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedItemIndex, 1);
    newCategories.splice(targetItemIndex, 0, draggedCategory);
    setCategories(newCategories); 
    const orderedCategoryIds = newCategories.map(cat => cat.id);

    try {
      setIsLoading(true); 
      const success = await updateCategoryOrder(orderedCategoryIds, loggedInUser);
      if (!success) {
        fetchCategoriesList(); 
        setError("Failed to update category order. Please try again.");
      }
    } catch (err) {
      console.error("Failed to update category order:", err);
      setError("An error occurred while reordering categories.");
      fetchCategoriesList(); 
    } finally {
        setIsLoading(false);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => e.preventDefault();


  if (isLoading && (!categories || categories.length === 0)) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Go back"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Manage Categories</h1>
        </div>
        <Button variant="primary" onClick={openModalForAdd}>Add New Category</Button>
      </div>

      {error && !isModalOpen && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error} <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button></p>}
      <p className="text-sm text-mediumgray mb-4">Drag and drop categories to reorder them.</p>

      {(!categories || categories.length === 0) && !isLoading ? (
        <p className="text-mediumgray text-center py-4">No categories found. Click "Add New Category" to start.</p>
      ) : (
        categories && categories.length > 0 && (
            <ul className="space-y-3">
            {categories.map(category => (
                <li 
                key={category.id} 
                className="p-4 border border-gray-200 rounded-md flex justify-between items-center hover:bg-lightgray transition-colors group"
                draggable={!isLoading}
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragEnter={(e) => handleDragEnter(e, category.id)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                style={{cursor: isLoading ? 'wait' : 'grab'}}
                >
                <div className="flex items-center">
                    <span className="mr-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                        <DragHandleIcon />
                    </span>
                    <div>
                    <h3 className="text-lg font-semibold text-darkgray">{category.name}</h3>
                    {category.description && <p className="text-sm text-mediumgray">{category.description}</p>}
                    </div>
                </div>
                <div className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(category)} title="Edit" disabled={isLoading}><EditIconSvg/></Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteConfirmModal(category)} className="text-red-500 hover:text-red-700" title="Delete" disabled={isLoading}><TrashIconSvg/></Button>
                </div>
                </li>
            ))}
            </ul>
        )
      )}

      <Modal
        isOpen={isModalOpen && !isDeleting}
        onClose={closeModal}
        title={currentCategory?.id ? 'Edit Category' : 'Add New Category'}
        footerContent={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCategory} isLoading={isLoading}>Save Category</Button>
          </>
        }
      >
        {error && isModalOpen && <p className="text-red-500 bg-red-100 p-2 rounded-sm mb-3 text-sm">{error}</p>}
        <Input
          label="Category Name"
          id="name"
          name="name"
          type="text"
          value={currentCategory?.name || ''}
          onChange={handleInputChange}
          required
          wrapperClassName="mb-3"
        />
        <label htmlFor="description" className="block text-sm font-medium text-darkgray mb-1">Description (Optional)</label>
        <textarea
            id="description"
            name="description"
            rows={3}
            value={currentCategory?.description || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </Modal>

      <Modal
        isOpen={isDeleting}
        onClose={closeDeleteConfirmModal}
        title="Confirm Deletion"
        footerContent={
          <>
            <Button variant="outline" onClick={closeDeleteConfirmModal} disabled={isLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteCategory} isLoading={isLoading}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"? This may affect products associated with this category.</p>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;