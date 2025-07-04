import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { storeName } = useAppSettings(); // Get storeName
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-lightgray py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-darkgray">
            Admin Login to {storeName}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}
          <Input
            id="username"
            label="Username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <div>
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;