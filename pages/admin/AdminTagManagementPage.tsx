import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getManagedTags, addNewManagedTag, deleteManagedTag, renameManagedTag, deleteManagedTagsBulk } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

const EditIconSvg: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  );

const TrashIconSvg: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const PlusCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const AdminTagManagementPage: React.FC = () => {
  const [managedTags, setManagedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const { loggedInUser } = useAuth();

  const [newTagNameInput, setNewTagNameInput] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tagToEditOldName, setTagToEditOldName] = useState<string | null>(null);
  const [tagToEditNewName, setTagToEditNewName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [isBulkDeleteConfirmModalOpen, setIsBulkDeleteConfirmModalOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const navigate = useNavigate();

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const tags = await getManagedTags();
      setManagedTags(tags);
      setSelectedTagNames([]);
      setSelectAll(false);
    } catch (err) {
      setError('Failed to fetch tags.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAddNewTag = async () => {
    if (!newTagNameInput.trim()) {
        setError("Tag name cannot be empty.");
        return;
    }
    if (!loggedInUser) {
        setError("You must be logged in to perform this action.");
        return;
    }
    setIsOperating(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const result = await addNewManagedTag(newTagNameInput.trim(), loggedInUser);
        if (result.success) {
            setSuccessMessage(result.message || `Tag "${result.tag}" added successfully.`);
            setNewTagNameInput('');
            fetchTags();
        } else {
            setError(result.message || "Failed to add new tag.");
        }
    } catch (err) {
        setError("An unexpected error occurred while adding the tag.");
        console.error(err);
    } finally {
        setIsOperating(false);
    }
  };

  const openDeleteModal = (tag: string) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeDeleteModal = () => {
    setTagToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete || !loggedInUser) return;
    setIsOperating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await deleteManagedTag(tagToDelete, loggedInUser);
      setSuccessMessage(result.message || `Tag "${tagToDelete}" deleted.`);
      fetchTags();
      closeDeleteModal();
    } catch (err) {
      setError(`Failed to delete tag "${tagToDelete}".`);
      console.error(err);
    } finally {
      setIsOperating(false);
    }
  };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedTagNames(managedTags.map(tag => tag));
        } else {
            setSelectedTagNames([]);
        }
    };

    const handleSelectTag = (tagName: string) => {
        setSelectedTagNames(prev => {
            if (prev.includes(tagName)) {
                return prev.filter(name => name !== tagName);
            } else {
                return [...prev, tagName];
            }
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedTagNames.length > 0) {
            setIsBulkDeleteConfirmModalOpen(true);
        }
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedTagNames.length === 0 || !loggedInUser) return;
        setIsOperating(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await deleteManagedTagsBulk(selectedTagNames, loggedInUser);
            if (result.success) {
                setSuccessMessage(`${result.deletedCount} tag(s) deleted successfully.`);
                fetchTags();
            } else {
                setError(result.message || "Failed to bulk delete tags.");
            }
        } catch (err) {
            setError("An error occurred during bulk deletion.");
            console.error(err);
        } finally {
            setIsOperating(false);
            setIsBulkDeleteConfirmModalOpen(false);
        }
    };


  const openEditModal = (tag: string) => {
    setTagToEditOldName(tag);
    setTagToEditNewName(tag);
    setIsEditModalOpen(true);
    setEditError(null);
    setError(null);
    setSuccessMessage(null);
  };

  const closeEditModal = () => {
    setTagToEditOldName(null);
    setTagToEditNewName('');
    setIsEditModalOpen(false);
    setEditError(null);
  };

  const handleSaveEditedTag = async () => {
    if (!tagToEditOldName || !tagToEditNewName.trim()) {
      setEditError('New tag name cannot be empty.');
      return;
    }
    if (!loggedInUser) {
        setEditError("You must be logged in to perform this action.");
        return;
    }
    setEditError(null);
    setIsOperating(true);
    try {
      const result = await renameManagedTag(tagToEditOldName, tagToEditNewName.trim(), loggedInUser);
      if (result.success) {
        setSuccessMessage(result.message || `Tag successfully renamed.`);
        fetchTags();
        closeEditModal();
      } else {
        setEditError(result.message || 'Failed to rename tag.');
      }
    } catch (err) {
      setEditError('An unexpected error occurred while renaming the tag.');
      console.error(err);
    } finally {
      setIsOperating(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Go back"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Manage Product Tags</h1>
        </div>
        <Button onClick={fetchTags} isLoading={isOperating && !isLoading} variant="outline" size="sm">Refresh Tags</Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{successMessage}</p>}
      
      <div className="mb-6 p-4 border border-blue-200 rounded-md bg-blue-50">
        <h2 className="text-xl font-semibold text-darkgray mb-2">Add New Tag</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-start">
            <Input
                id="newTagNameInput"
                name="newTagNameInput"
                type="text"
                value={newTagNameInput}
                onChange={(e) => setNewTagNameInput(e.target.value)}
                placeholder="Enter new tag name"
                wrapperClassName="mb-0 flex-grow"
                className="h-10"
                aria-label="New tag name"
            />
            <Button onClick={handleAddNewTag} isLoading={isOperating} variant="primary" className="w-full sm:w-auto">
                <PlusCircleIcon /> Add Tag
            </Button>
        </div>
      </div>

      <p className="text-sm text-mediumgray mb-4">
        Below is a list of all managed tags. You can add new tags, edit tag names (updates globally), or delete tags (removes from all products).
      </p>

        {selectedTagNames.length > 0 && (
            <div className="mb-4 flex justify-end">
                <Button
                    variant="danger"
                    onClick={handleBulkDeleteClick}
                    disabled={isOperating}
                    isLoading={isOperating && isBulkDeleteConfirmModalOpen}
                >
                    Delete Selected ({selectedTagNames.length})
                </Button>
            </div>
        )}

      {managedTags.length === 0 && !isLoading ? (
        <p className="text-mediumgray text-center py-4">No tags found. Add some tags to manage them here.</p>
      ) : (
        <ul className="space-y-2">
            <li className="p-3 border border-gray-200 rounded-md flex items-center bg-gray-50 font-bold text-darkgray">
                <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary rounded mr-2"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={isOperating}
                />
                <span className="flex-grow">Tag Name</span>
                <span className="w-24 text-right">Actions</span>
            </li>
          {managedTags.map(tag => (
            <li
              key={tag}
              className="p-3 border border-gray-200 rounded-md flex justify-between items-center hover:bg-lightgray transition-colors"
            >
                <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary rounded mr-2"
                    checked={selectedTagNames.includes(tag)}
                    onChange={() => handleSelectTag(tag)}
                    disabled={isOperating}
                />
              <span className="text-darkgray font-medium break-all mr-2 flex-grow">{tag}</span>
              <div className="space-x-2 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(tag)}
                    title={`Edit tag "${tag}"`}
                    disabled={isOperating}
                    className="text-blue-600 hover:text-blue-800 p-1.5"
                >
                    <EditIconSvg/> <span className="ml-1 hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteModal(tag)}
                  className="text-red-500 hover:text-red-700 p-1.5"
                  title={`Delete tag "${tag}"`}
                  disabled={isOperating}
                >
                  <TrashIconSvg/> <span className="ml-1 hidden sm:inline">Delete</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title={`Confirm Delete Tag: "${tagToDelete}"`}
        footerContent={
          <>
            <Button variant="outline" onClick={closeDeleteModal} disabled={isOperating}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteTag} isLoading={isOperating}>Delete Tag Globally</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the tag "<strong>{tagToDelete}</strong>"?
        This will remove the tag from all products currently associated with it and from the managed tags list. This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={`Edit Tag: "${tagToEditOldName}"`}
        footerContent={
          <>
            <Button variant="outline" onClick={closeEditModal} disabled={isOperating}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEditedTag} isLoading={isOperating}>Save Changes</Button>
          </>
        }
      >
        {editError && <p className="text-red-500 bg-red-100 p-2 rounded-sm mb-3 text-sm">{editError}</p>}
        <Input
          label="New Tag Name"
          id="newTagNameModal"
          name="newTagNameModal"
          type="text"
          value={tagToEditNewName}
          onChange={(e) => setTagToEditNewName(e.target.value)}
          required
          placeholder="Enter new tag name"
          wrapperClassName="mb-1"
        />
      </Modal>

        <Modal isOpen={isBulkDeleteConfirmModalOpen} onClose={() => setIsBulkDeleteConfirmModalOpen(false)} title="Confirm Bulk Deletion"
            footerContent={
                <>
                    <Button variant="outline" onClick={() => setIsBulkDeleteConfirmModalOpen(false)} disabled={isOperating}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmBulkDelete} isLoading={isOperating}>Delete Selected ({selectedTagNames.length})</Button>
                </>
            }>
            <p>Are you sure you want to delete <strong>{selectedTagNames.length}</strong> selected tag(s)? This action cannot be undone.</p>
            <p className="text-sm text-mediumgray mt-2">This will remove the tags from all products currently associated with them and from the managed tags list.</p>
        </Modal>
    </div>
  );
};

export default AdminTagManagementPage;