import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { AppSettingsProvider } from './hooks/useAppSettings';
// Import the PayPalScriptProvider
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Get your client ID from environment variables
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

// Ensure client ID is defined (for robustness)
if (!PAYPAL_CLIENT_ID) {
  console.error("VITE_PAYPAL_CLIENT_ID is not defined in the environment. PayPal will not function.");
  // In a real application, you might want to display a user-friendly message
  // or disable PayPal functionality if the ID is missing.
}

const initialOptions = {
  clientId: PAYPAL_CLIENT_ID || "sb", // Use "sb" as a fallback for sandbox if ID is missing
  currency: "USD", // Your default currency for PayPal transactions
  // For sandbox testing, it automatically uses sandbox with the sandbox client ID
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Wrap your entire application with PayPalScriptProvider */}
    {PAYPAL_CLIENT_ID ? ( // Only render if client ID is available
      <PayPalScriptProvider options={initialOptions}>
        <AuthProvider>
          <AppSettingsProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </PayPalScriptProvider>
    ) : (
      // Fallback if PAYPAL_CLIENT_ID is missing, app will run but PayPal won't work
      <AuthProvider>
        <AppSettingsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AppSettingsProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);