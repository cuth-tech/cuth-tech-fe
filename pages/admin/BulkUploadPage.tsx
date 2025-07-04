import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bulkUploadProducts } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

// --- ICONS ---
const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);
const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-500 mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const AlertTriangleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-red-500 mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const BulkUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setUploadStatus({ success: false, message: 'Please select a CSV file to upload.' });
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setUploadStatus({ success: false, message: 'Invalid file type. Please upload a CSV file.' });
        return;
    }

    if (!loggedInUser) {
        setUploadStatus({ success: false, message: 'Authentication error. Please log in again.' });
        return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    try {
      const result = await bulkUploadProducts(selectedFile, loggedInUser);
      setUploadStatus(result);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({ success: false, message: 'An unexpected error occurred during upload.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, loggedInUser]);

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
          <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Go back"
          >
              <BackArrowIconSvg className="text-darkgray" />
          </button>
          <h1 className="text-3xl font-bold text-darkgray">Bulk Upload Products (CSV)</h1>
      </div>
      
      <p className="text-mediumgray mb-4">
        Upload a CSV file to add products to your inventory. Ensure your CSV has columns for: 
        <code className="bg-gray-200 px-1 rounded text-sm">name</code>, 
        <code className="bg-gray-200 px-1 rounded text-sm">price</code>, 
        <code className="bg-gray-200 px-1 rounded text-sm">category</code>,
        <code className="bg-gray-200 px-1 rounded text-sm">brand</code> (optional),
        and <code className="bg-gray-200 px-1 rounded text-sm">tags</code> (comma-separated if multiple).
      </p>

      <div className="mb-6">
        <label htmlFor="csvFile" className="block text-sm font-medium text-darkgray mb-1">
          Select CSV File
        </label>
        <div
          onClick={handleAreaClick}
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary"
        >
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <p className="pl-1">
                {selectedFile ? 'File selected:' : 'Click to upload a file'}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {selectedFile ? selectedFile.name : 'CSV up to 10MB'}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="csvFile"
          name="csvFile"
          accept=".csv, text/csv"
          onChange={handleFileChange}
          className="hidden" 
        />
      </div>

      <Button onClick={handleUpload} isLoading={isLoading} disabled={!selectedFile || isLoading} className="w-full">
        <UploadIcon/> Upload Products
      </Button>

      {uploadStatus && (
        <div className={`mt-6 p-4 rounded-md flex items-center ${uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {uploadStatus.success ? <CheckCircleIcon /> : <AlertTriangleIcon />}
          <div>
            <p className="font-semibold">{uploadStatus.success ? 'Upload Successful' : 'Upload Failed'}</p>
            <p>{uploadStatus.message}</p>
            {uploadStatus.success && uploadStatus.count !== undefined && (
              <p>{uploadStatus.count} products were added.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadPage;