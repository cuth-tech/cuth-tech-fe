import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { addInvoice } from '../../services/apiService';
import { Invoice, InvoiceItem } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const BackArrowIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { storeName, contactEmail, contactPhone } = useAppSettings();
  const navigate = useNavigate();

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });
  const [invoiceGenError, setInvoiceGenError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  const handleQuantityChange = (productId: string, newQuantity: string) => {
    const quantityNum = parseInt(newQuantity, 10);
    if (!isNaN(quantityNum)) {
      updateQuantity(productId, quantityNum);
    }
  };

  const total = getCartTotal();

  const handleOpenInvoiceModal = () => {
    setCustomerDetails({ name: '', email: '', phone: '' });
    setInvoiceGenError(null);
    setGenerationSuccess(null);
    setIsInvoiceModalOpen(true);
  };

  const generateAndDownloadPdf = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 15;
    const rightMargin = 15;
    let yPos = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(storeName, leftMargin, yPos);

    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth - rightMargin, yPos, { align: 'right' });
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`INVOICE #: ${invoice.invoiceNumber}`, leftMargin, yPos);
    doc.text(`DATE: ${new Date(invoice.createdAt).toLocaleString()}`, pageWidth - rightMargin, yPos, { align: 'right' });
    yPos += 5;
    doc.setDrawColor(180, 180, 180);
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("BILL TO:", leftMargin, yPos);
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
      styles: { fontSize: 9, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.1 },
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], fontSize: 9, lineWidth: { top: 0.1, right: 0, bottom: 0.1, left: 0 } },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } },
    });

    let tableFinalY = (doc as any).lastAutoTable.finalY || yPos + 20;
    yPos = tableFinalY + 10;

    const totalsX = pageWidth - rightMargin - 70;
    const amountsX = pageWidth - rightMargin;
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("TOTAL:", totalsX, yPos);
    doc.text(`R ${invoice.total.toFixed(2)}`, amountsX, yPos, { align: 'right' });
    yPos += 15;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text("Thank You For Your Interest!", leftMargin, doc.internal.pageSize.getHeight() - 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let contactYPos = doc.internal.pageSize.getHeight() - 18;
    if (contactEmail) { doc.text(`Email: ${contactEmail}`, leftMargin, contactYPos); contactYPos += 4; }
    if (contactPhone) { doc.text(`Phone: ${contactPhone}`, leftMargin, contactYPos); }

    const filename = `${storeName}_Invoice_${invoice.invoiceNumber}.pdf`;
    doc.save(filename);
  };
  
  const handleGenerateAndSaveInvoice = async () => {
    setInvoiceGenError(null);
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
        setInvoiceGenError("All customer details are required.");
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
        setInvoiceGenError("Please enter a valid email address.");
        return;
    }
    
    setIsGenerating(true);
    
    const invoiceItems: InvoiceItem[] = cart.map(item => ({
        id: item.id, name: item.name, price: item.price, quantity: item.quantity
    }));
    
    const newInvoiceData = {
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        items: invoiceItems,
        subtotal: total,
        total: total, // No discount from cart page
        status: 'proforma' as const,
    };
    
    try {
        const savedInvoice = await addInvoice(newInvoiceData);
        generateAndDownloadPdf(savedInvoice);
        setGenerationSuccess(`Invoice ${savedInvoice.invoiceNumber} has been generated and downloaded. You can provide this number for reference.`);
        setTimeout(() => setIsInvoiceModalOpen(false), 4000); 
    } catch (error) {
        console.error("Failed to save or generate invoice:", error);
        setInvoiceGenError("An error occurred while creating the invoice. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };


  if (cart.length === 0) {
    return (
      <div className="text-center py-10 bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-darkgray mb-4">Your Shopping Cart is Empty</h1>
        <p className="text-mediumgray mb-6">Looks like you haven't added any products yet.</p>
        <Button variant="primary" onClick={() => navigate('/')}>Start Shopping</Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
            <button 
                onClick={() => navigate('/')} 
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Go back to homepage"
            >
                <BackArrowIconSvg className="text-darkgray" />
            </button>
            <h1 className="text-3xl font-bold text-darkgray">Your Shopping Cart</h1>
        </div>
        
        <div className="space-y-6 mb-8">
          {cart.map(item => (
            <div key={item.id} className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-md gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-grow">
                  <h2 className="text-lg font-semibold text-darkgray">{item.name}</h2>
                  <p className="text-sm text-mediumgray">{item.category}</p>
                  <p className="text-sm text-mediumgray">R{item.price.toFixed(2)} each</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity.toString()}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  className="w-20 text-center"
                  aria-label={`Quantity for ${item.name}`}
                  wrapperClassName="mb-0"
                />
                <p className="text-md font-semibold text-darkgray w-24 text-right">
                  R{(item.price * item.quantity).toFixed(2)}
                </p>
                <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700" title="Remove item">
                  <TrashIcon />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-darkgray">Total:</h2>
            <p className="text-2xl font-bold text-primary">R{total.toFixed(2)}</p>
          </div>
          <p className="text-sm text-mediumgray mb-6">Shipping and taxes calculated at checkout.</p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button variant="outline" onClick={() => clearCart()} className="w-full sm:w-auto">
              Clear Cart
            </Button>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button variant="secondary" onClick={handleOpenInvoiceModal} className="w-full sm:w-auto">
                  <DownloadIcon /> Generate Invoice
              </Button>
              <Button variant="primary" onClick={() => navigate('/checkout')} className="w-full sm:w-auto">
                  Proceed to Checkout
              </Button>
            </div>
          </div>
           <div className="mt-6 text-center">
             <Link to="/" className="text-primary hover:underline font-medium">
                 &larr; Continue Shopping
             </Link>
           </div>
        </div>
      </div>
      
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => !isGenerating && setIsInvoiceModalOpen(false)}
        title="Generate Invoice"
        footerContent={
          <>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)} disabled={isGenerating}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerateAndSaveInvoice} isLoading={isGenerating}>
              {generationSuccess ? 'Done' : 'Generate & Download'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!generationSuccess && (
            <>
              <p className="text-sm text-mediumgray">Please provide your details to include on the invoice. This will create a persistent record for our reference.</p>
              {invoiceGenError && <p className="text-red-500 bg-red-100 p-2 rounded-sm text-sm">{invoiceGenError}</p>}
              <Input
                label="Full Name"
                id="customerName"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                required
              />
              <Input
                label="Email Address"
                id="customerEmail"
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                required
              />
              <Input
                label="Phone Number"
                id="customerPhone"
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                required
              />
            </>
          )}
          {generationSuccess && (
            <div className="text-green-600 bg-green-100 p-4 rounded-md text-center">
              <p className="font-semibold">Success!</p>
              <p>{generationSuccess}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CartPage;