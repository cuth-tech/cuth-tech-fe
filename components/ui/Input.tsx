
import React, { useState } from 'react';

const EyeIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
    </svg>
);


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = props.type === 'password';

  const showPasswordTemporarily = () => {
    if (isPasswordVisible) return;
    setIsPasswordVisible(true);
    setTimeout(() => {
      setIsPasswordVisible(false);
    }, 2000); // Show for 2 seconds
  };
  
  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-darkgray mb-1">{label}</label>}
      <div className="relative">
        <input
          id={id}
          className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${isPasswordField ? 'pr-10' : ''} ${className}`}
          {...props}
          type={isPasswordField && !isPasswordVisible ? 'password' : 'text'}
        />
        {isPasswordField && (
            <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                onClick={showPasswordTemporarily}
                aria-label="Show password for a few seconds"
                disabled={isPasswordVisible}
            >
                {isPasswordVisible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-darkgray mb-1">{label}</label>}
      <textarea
        id={id}
        rows={3}
        className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
