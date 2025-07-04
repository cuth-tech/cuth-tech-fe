import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { validateDiscountCode, addInvoice } from '../../services/apiService';
import { DiscountCode, Invoice, InvoiceItem } from '../../types';
import { PayPalButtons } from '@paypal/react-paypal-js';

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const CheckoutPage: React.FC = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { storeName, contactEmail, contactPhone } = useAppSettings();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState({ phone: '' });
  
  const [enteredDiscountCode, setEnteredDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);

  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentMessageIsError, setPaymentMessageIsError] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(true);
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  const originalTotal = getCartTotal();
  const totalAfterDiscount = Math.max(0, originalTotal - appliedDiscountAmount);
  
  const totalInUSD = conversionRate ? totalAfterDiscount / conversionRate : 0;

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchConversionRate = async () => {
        if (!BACKEND_BASE_URL) {
            console.error("VITE_BACKEND_URL is not set.");
            setPaymentMessage("Cannot connect to server for currency conversion.");
            setPaymentMessageIsError(true);
            setIsConverting(false);
            return;
        }
        setIsConverting(true);
        setPaymentMessage(null);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/currency/rate?from=USD&to=ZAR`);
            if (!response.ok) throw new Error('Could not connect to currency service.');
            
            const data = await response.json();
            if (data.success && data.rate) {
                setConversionRate(data.rate);
            } else {
                throw new Error(data.message || 'Failed to fetch conversion rate.');
            }
        } catch (error: any) {
            console.error("Failed to fetch conversion rate", error);
            setPaymentMessage(`Could not get currency conversion: ${error.message}`);
            setPaymentMessageIsError(true);
        } finally {
            setIsConverting(false);
        }
    };
    fetchConversionRate();
  }, [BACKEND_BASE_URL]);

  useEffect(() => {
    if (appliedDiscount) {
        let newDiscountValue = 0;
        if (appliedDiscount.type === 'percentage') {
            newDiscountValue = originalTotal * (appliedDiscount.value / 100);
        } else {
            newDiscountValue = appliedDiscount.value;
        }
        newDiscountValue = Math.min(newDiscountValue, originalTotal);
        setAppliedDiscountAmount(newDiscountValue);
    } else {
      setAppliedDiscountAmount(0);
    }
  }, [originalTotal, appliedDiscount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'phone' && value && !/^\+?[0-9\s-]{7,15}$/.test(value)) {
        setFormErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number.' }));
    } else {
        setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleApplyDiscount = async () => {
    if (!enteredDiscountCode.trim()) {
      setAppliedDiscount(null);
      setDiscountMessage("Enter a code to apply a discount.");
      return;
    }
    setIsProcessing(true);
    setDiscountMessage("Validating code...");
    const result = await validateDiscountCode(enteredDiscountCode);
    setIsProcessing(false);
    if (result.isValid && result.discount) {
      setAppliedDiscount(result.discount);
      setDiscountMessage(`${result.discount.code} applied!`);
    } else {
      setAppliedDiscount(null);
      setDiscountMessage(result.message || "Invalid or expired discount code.");
    }
  };

  const generateAndSaveInvoice = async (status: Invoice['status'] = 'completed'): Promise<Invoice | null> => {
    if (formErrors.phone || !formData.name || !formData.email || !formData.phone) {
        setPaymentMessage("Please fill in all customer details and correct any errors to generate invoice.");
        setPaymentMessageIsError(true);
        return null;
    }

    const invoiceItems: InvoiceItem[] = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
    }));

    const newInvoiceData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        items: invoiceItems,
        subtotal: originalTotal,
        total: totalAfterDiscount,
        status: status,
    };

    try {
        const savedInvoice = await addInvoice(newInvoiceData);
        return savedInvoice;
    } catch (err) {
        console.error("Failed to save invoice record:", err);
        setPaymentMessage("An error occurred while saving the invoice record. Please try again.");
        setPaymentMessageIsError(true);
        return null;
    }
  };

  const generateOrderInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 15;
    const rightMargin = 15;
    let yPos = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(storeName, leftMargin, yPos);

    doc.setFontSize(18);
    doc.text("RECEIPT", pageWidth - rightMargin, yPos, { align: 'right' });
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`RECEIPT #: ${invoice.invoiceNumber}`, leftMargin, yPos);
    doc.text(`DATE: ${new Date(invoice.createdAt).toLocaleString()}`, pageWidth - rightMargin, yPos, { align: 'right' });
    yPos += 5;
    doc.setDrawColor(180, 180, 180);
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("BILLED TO:", leftMargin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customerName, leftMargin, yPos); yPos += 5;
    doc.text(invoice.customerEmail, leftMargin, yPos); yPos += 5;
    doc.text(invoice.customerPhone, leftMargin, yPos); yPos += 15;

    const tableBody = invoice.items.map(item => [
      item.name,
      item.quantity.toString(),
      item.price.toFixed(2),
      (item.price * item.quantity).toFixed(2)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
      body: tableBody,
      theme: 'plain',
    });

    let tableFinalY = (doc as any).lastAutoTable.finalY || yPos + 20;
    yPos = tableFinalY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("TOTAL PAID:", pageWidth - rightMargin, yPos, { align: 'right' });
    doc.text(`R ${invoice.total.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });

    const filename = `${storeName}_Receipt_${invoice.invoiceNumber}.pdf`;
    doc.save(filename);
  };

  const finalizeOrder = async () => {
    try {
      const savedInvoice = await generateAndSaveInvoice('completed');
      if (savedInvoice) {
        generateOrderInvoicePDF(savedInvoice);
        clearCart();
        setEnteredDiscountCode('');
        setAppliedDiscount(null);
        setAppliedDiscountAmount(0);
        setDiscountMessage(null);
        setPaymentMessage("Payment successful! Your receipt has been downloaded.");
        setPaymentMessageIsError(false);
        setTimeout(() => navigate('/'), 4000);
      } else {
        throw new Error("Invoice could not be saved after payment confirmation.");
      }
    } catch (error: any) {
      console.error("Error finalizing order:", error);
      setPaymentMessage(`Order finalization failed: ${error.message}. Please contact support.`);
      setPaymentMessageIsError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !isProcessing) {
    return (
      <div className="text-center py-10 bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-darkgray mb-4">Your Cart is Empty</h1>
        <p className="text-mediumgray mb-6">There's nothing to checkout.</p>
        <Button variant="primary" onClick={() => navigate('/')}>Go Shopping</Button>
      </div>
    );
  }

  const areCustomerDetailsValid = !formErrors.phone && formData.name && formData.email && formData.phone;
  const canProceedToPayment = areCustomerDetailsValid && !isConverting && conversionRate;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
            <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Go back"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Checkout</h1>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* Form Section */}
        <div className="space-y-6">
            <section>
                <h2 className="text-xl font-semibold text-darkgray">1. Customer Details</h2>
                <div className="space-y-4 mt-3">
                    <Input label="Full Name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                    <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <Input
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+27 12 345 6789"
                        error={formErrors.phone}
                    />
                </div>
            </section>
            
            <section className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-darkgray mb-3">2. Pay with PayPal</h2>

                {paymentMessage && (
                    <div className={`mb-4 p-3 rounded-md text-sm ${paymentMessageIsError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {paymentMessage}
                    </div>
                )}
                
                {isConverting && <div className="flex items-center justify-center p-4"><Spinner /> <span className="ml-2">Getting conversion rate...</span></div>}

                {!isConverting && conversionRate && (
                    <PayPalButtons
                        style={{ layout: "vertical" }}
                        disabled={!canProceedToPayment || isProcessing}
                        createOrder={async () => {
                            if (!canProceedToPayment) {
                                setPaymentMessage("Please fill in all details and wait for currency conversion.");
                                setPaymentMessageIsError(true);
                                return "";
                            }
                            setIsProcessing(true);
                            try {
                                const response = await fetch(`${BACKEND_BASE_URL}/api/paypal/create-order`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        totalAmount: totalInUSD.toFixed(2),
                                        currency: "USD",
                                    }),
                                });
                                const backendData = await response.json();
                                if (!response.ok || !backendData.success) {
                                    throw new Error(backendData.message || "Backend failed to create PayPal order.");
                                }
                                setIsProcessing(false);
                                return backendData.orderID;
                            } catch (error: any) {
                                console.error("Error creating PayPal order:", error);
                                setPaymentMessage(`Error: ${error.message}`);
                                setPaymentMessageIsError(true);
                                setIsProcessing(false);
                                return "";
                            }
                        }}
                        onApprove={async (data) => {
                            setIsProcessing(true);
                            setPaymentMessage("Payment approved. Finalizing order...");
                            // This is the corrected logic
                            try {
                                const response = await fetch(`${BACKEND_BASE_URL}/api/paypal/capture-order`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ orderID: data.orderID }),
                                });
                                const captureResult = await response.json();
                                if (!response.ok || !captureResult.success) {
                                    throw new Error(captureResult.message || "Backend failed to capture PayPal order.");
                                }
                                await finalizeOrder();
                            } catch (error: any) {
                                console.error("Error capturing PayPal order:", error);
                                setPaymentMessage(`Payment failed or invoice could not be finalized. Error: ${error.message}. Please try again or contact support.`);
                                setPaymentMessageIsError(true);
                                setIsProcessing(false);
                            }
                        }}
                        onCancel={() => {
                            setPaymentMessage("Payment was cancelled.");
                            setPaymentMessageIsError(true);
                            setIsProcessing(false);
                        }}
                        onError={(err) => {
                            setPaymentMessage("An error occurred with the PayPal transaction.");
                            setPaymentMessageIsError(true);
                            console.error("PayPal Error:", err);
                            setIsProcessing(false);
                        }}
                    />
                )}
            </section>
        </div>

        {/* Order Summary Section */}
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-darkgray">Order Summary</h2>
            <div className="bg-lightgray p-4 rounded-md space-y-3 max-h-80 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start pb-2 mb-2 border-b border-gray-300 last:border-b-0 last:pb-0 last:mb-0">
                        <div>
                            <p className="font-medium text-darkgray">{item.name} <span className="text-sm text-mediumgray">(x{item.quantity})</span></p>
                            <p className="text-xs text-mediumgray">R{item.price.toFixed(2)} each</p>
                        </div>
                        <p className="font-semibold text-darkgray">R{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-300 pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-md">
                    <span className="text-darkgray">Subtotal:</span>
                    <span className="text-darkgray">R{originalTotal.toFixed(2)}</span>
                </div>
                <div className="pt-4 mt-4">
                    <div className="flex items-start gap-2">
                        <Input
                        label="Discount code"
                        name="enteredDiscountCode"
                        type="text"
                        value={enteredDiscountCode}
                        onChange={(e) => setEnteredDiscountCode(e.target.value.toUpperCase())}
                        wrapperClassName="flex-grow mb-0"
                        className="uppercase"
                        placeholder="E.G. CODE123"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleApplyDiscount}
                            className="mt-7 h-10"
                            isLoading={isProcessing && discountMessage === "Validating code..."}
                            disabled={isProcessing && discountMessage === "Validating code..."}
                        >
                        Apply
                        </Button>
                    </div>
                    {discountMessage && (
                        <p className={`mt-1 text-sm ${appliedDiscount && appliedDiscountAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {discountMessage}
                        </p>
                    )}
                </div>
                {appliedDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-md text-green-600">
                        <span>Discount ({appliedDiscount?.code}):</span>
                        <span>-R{appliedDiscountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-xl font-semibold mt-2 pt-2 border-t border-gray-300">
                    <span className="text-darkgray">Total (ZAR):</span>
                    <span className="text-primary">R{totalAfterDiscount.toFixed(2)}</span>
                </div>
                {conversionRate && (
                     <div className="flex justify-between items-center text-md text-mediumgray">
                        <span>PayPal Total (Approx. USD):</span>
                        <span className="font-semibold">${totalInUSD.toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
