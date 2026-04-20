import { InvoiceTemplate } from "./InvoiceTemplate";
import { type ApiInvoice, type ApiShop } from "../auth.utils";

interface InvoiceWrapperProps {
  shop: ApiShop;
  invoice: ApiInvoice;
  noShadow?: boolean;
}

/**
 * A reusable wrapper that maps raw API Invoice data 
 * to the visual InvoiceTemplate props.
 */
export function InvoiceWrapper({ shop, invoice, noShadow }: InvoiceWrapperProps) {
  // Shared address formatter
  const formatAddress = (addr: any) => addr?.address_line1 || "";

  return (
    <InvoiceTemplate
      // Shop Branding
      shopName={shop.name}
      shopAddress={formatAddress(shop.address)}
      shopPhone={shop.contactNumber || ""}
      fbLink={shop.socialLinks?.facebook || ""}
      igLink={shop.socialLinks?.instagram || ""}
      footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
      
      // Invoice Meta
      invNumber={invoice.invoiceNumber}
      invDate={new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString("en-GB", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric" 
      })}
      
      // Customer Info
      customerName={invoice.customerName || "Walk-in Customer"}
      customerPhone={invoice.customerPhone}
      customerEmail={invoice.customerEmail}
      customerAddress={invoice.customerAddress}
      
      // Calculation Logic (Mapping API fields to Template labels)
      items={invoice.items.map(c => ({ 
        name: c.name, 
        qty: c.quantity, 
        price: c.unitPrice 
      }))}
      subtotal={invoice.subtotal}
      discount={invoice.discountAmount}
      advanceAmount={invoice.advanceAmount}
      deliveryCharge={invoice.deliveryCharge}
      isDeliveryPaid={invoice.isDeliveryPaid}
      grandTotal={invoice.grandTotal}
      notes={invoice.notes}
      
      // UI Settings
      noShadow={noShadow}
    />
  );
}
