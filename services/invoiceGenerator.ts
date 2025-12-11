
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, AppSettings } from '../types';

export const generateInvoicePDF = (inv: Invoice, settings: AppSettings, viewMode: boolean = false): string | void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(settings.pharmacyName, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(settings.address, 14, 26);
  doc.text(`Phone: ${settings.phone} | GSTIN: ${settings.gstin}`, 14, 32);

  doc.setDrawColor(200);
  doc.line(14, 36, 196, 36);

  // Invoice Info
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text("TAX INVOICE", 14, 45);
  doc.setFontSize(10);
  doc.text(`Invoice No: ${inv.invoiceNumber}`, 14, 52);
  doc.text(`Date: ${inv.date}`, 14, 58);
  
  // Customer Info
  doc.text(`Customer: ${inv.customerName}`, 120, 52);
  if (inv.customerGst) {
    doc.text(`GSTIN: ${inv.customerGst}`, 120, 58);
  }
  
  // Table
  const tableData = inv.items.map((item, index) => [
    index + 1,
    `${item.name}\nBatch: ${item.batchNumber}`,
    item.hsnCode,
    item.expiryDate,
    item.quantity,
    item.rate.toFixed(2),
    item.gstRate + '%',
    item.totalAmount.toFixed(2)
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Sr', 'Item', 'HSN', 'Exp', 'Qty', 'Rate', 'GST', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { halign: 'center' }, 4: { halign: 'center' }, 7: { halign: 'right' } },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Calculate Total Quantity
  const totalQty = inv.items.reduce((sum, item) => sum + item.quantity, 0);

  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(130, finalY - 5, 70, 35, 'F'); // Adjusted height
  
  doc.setFontSize(10);
  
  // Added Total Quantity Line
  doc.text(`Total Qty:`, 135, finalY);
  doc.text(`${totalQty}`, 195, finalY, { align: 'right' });

  doc.text(`Sub Total:`, 135, finalY + 6);
  doc.text(`Rs. ${inv.subTotal.toFixed(2)}`, 195, finalY + 6, { align: 'right' });
  
  doc.text(`Tax (GST):`, 135, finalY + 12);
  doc.text(`Rs. ${inv.totalTax.toFixed(2)}`, 195, finalY + 12, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 135, finalY + 22);
  doc.text(`Rs. ${inv.grandTotal.toFixed(2)}`, 195, finalY + 22, { align: 'right' });

  // Footer - Terms & Bank Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  
  // Terms
  doc.text("Terms & Conditions:", 14, finalY + 15);
  const termsLines = doc.splitTextToSize(settings.terms, 90);
  doc.text(termsLines, 14, finalY + 20);

  // Bank Details (Positioned below Terms)
  // Calculate Y position based on how many lines the terms took
  const bankStartY = finalY + 20 + (termsLines.length * 4) + 8;
  
  if (settings.bankName || settings.accountNumber) {
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, bankStartY);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank: ${settings.bankName}`, 14, bankStartY + 5);
    doc.text(`A/c No: ${settings.accountNumber}`, 14, bankStartY + 10);
    doc.text(`IFSC: ${settings.ifsc}`, 14, bankStartY + 15);
  }

  // Signature (Right side)
  const signatureY = finalY + 35;
  if (settings.signatureImage) {
    try {
      doc.addImage(settings.signatureImage, 'PNG', 150, signatureY, 30, 15);
    } catch (e) {
      console.warn("Failed to add signature image", e);
    }
  }
  
  doc.text("Authorized Signatory", 155, signatureY + 20);

  if (viewMode) {
    // Generate Blob and create Object URL
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  } else {
    doc.save(`${inv.invoiceNumber}.pdf`);
  }
};
