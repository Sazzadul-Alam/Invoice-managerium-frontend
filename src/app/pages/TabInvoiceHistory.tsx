import { useState, useEffect } from "react";
import { type ApiShop, type ApiInvoice, invoiceApi } from "../auth.utils";
import { InvoiceTemplate } from "../components/InvoiceTemplate";

function formatAddress(addr: ApiShop["address"]): string {
  if (!addr) return "";
  const parts = [
    addr.address_line1,
    addr.address_line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

export function TabInvoiceHistory({ shop }: { shop: ApiShop | null }) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<ApiInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (shop) {
      fetchInvoices();
    }
  }, [shop]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.listInvoices(shop!._id);
      setInvoices(res.invoices);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to load invoices", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ApiInvoice["status"]) => {
    switch (status) {
      case "paid": return { bg: "rgba(0,128,0,0.1)", text: "#2e7d32" };
      case "printed": return { bg: "rgba(103,58,183,0.1)", text: "#673ab7" };
      case "issued": return { bg: "rgba(0,92,114,0.1)", text: "var(--ds-primary-container)" };
      case "draft": return { bg: "var(--ds-surface-container-high)", text: "var(--ds-outline)" };
      case "void": return { bg: "rgba(186,26,26,0.1)", text: "var(--ds-error)" };
      default: return { bg: "var(--ds-surface-container-high)", text: "var(--ds-outline)" };
    }
  };

  if (!shop) return <div className="p-5 text-center text-ds-outline">No shop selected</div>;

  const handleDelete = async (inv: ApiInvoice) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setDeleting(true);
    try {
      await invoiceApi.deleteInvoice(shop!._id, inv._id);
      setToast({ msg: "Invoice deleted successfully", type: "success" });
      setPreviewInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to delete invoice", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <div className="px-4 pt-5 pb-4 space-y-4 print:hidden">
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-sm w-[90%] max-w-sm"
          style={{
            background: toast.type === "error" ? "var(--ds-error-container)" : "var(--ds-surface-container-lowest)",
            color: toast.type === "error" ? "var(--ds-on-error-container)" : "var(--ds-on-surface)"
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Invoice History
          </h2>
          <p className="text-xs text-ds-outline">All generated invoices</p>
        </div>
        <button onClick={fetchInvoices} className="p-2 rounded-lg bg-ds-surface-container-low text-ds-on-surface hover:bg-ds-surface-container-high">
          <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>refresh</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <span className="h-6 w-6 border-2 border-ds-outline-variant border-t-ds-primary-container rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-10 text-center border rounded-2xl border-ds-outline-variant bg-ds-surface-container-lowest">
          <span className="material-symbols-outlined text-4xl text-ds-outline mb-2">receipt_long</span>
          <p className="text-sm font-semibold text-ds-on-surface-variant">No invoices found</p>
          <p className="text-[11px] text-ds-outline mt-1 max-w-[200px] mx-auto">Create an invoice to see it listed here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const colors = getStatusColor(inv.status);
            return (
              <div 
                key={inv._id} 
                onClick={() => setPreviewInvoice(inv)}
                className="p-4 rounded-xl border border-ds-outline-variant bg-ds-surface-container-lowest active:scale-[0.99] transition-transform cursor-pointer hover:bg-ds-surface-container-high"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-ds-on-surface">{inv.invoiceNumber}</h4>
                    <p className="text-xs text-ds-on-surface-variant mt-0.5">{inv.customerName || "Walk-in Customer"}</p>
                  </div>
                  <span 
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {inv.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-ds-outline-variant/50">
                  <span className="text-[10px] text-ds-outline">{new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="text-sm font-extrabold text-ds-primary">৳{inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* ── Preview Modal ── */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-ds-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-ds-outline-variant bg-ds-surface-container-lowest">
              <h2 className="text-lg font-bold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>Invoice #{previewInvoice.invoiceNumber}</h2>
              <button onClick={() => setPreviewInvoice(null)} className="p-2 rounded-full hover:bg-ds-surface-container-high transition-colors text-ds-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 w-full">
               <InvoiceTemplate
                  shopName={shop.name}
                  shopAddress={formatAddress(shop.address)}
                  shopPhone={shop.contactNumber || ""}
                  fbLink={shop.socialLinks?.facebook || ""}
                  igLink={shop.socialLinks?.instagram || ""}
                  footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
                  invNumber={previewInvoice.invoiceNumber}
                  invDate={new Date(previewInvoice.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  customerName={previewInvoice.customerName || "Walk-in Customer"}
                  customerPhone={previewInvoice.customerPhone}
                  items={previewInvoice.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
                  subtotal={previewInvoice.subtotal}
                  discount={previewInvoice.discountAmount}
                  advanceAmount={previewInvoice.advanceAmount}
                  grandTotal={previewInvoice.grandTotal}
                  notes={previewInvoice.notes}
               />
            </div>

            <div className="p-4 border-t border-ds-outline-variant bg-ds-surface-container-lowest flex gap-3">
               <button 
                 onClick={() => handleDelete(previewInvoice)}
                 disabled={deleting}
                 className="flex-[1] py-3 rounded-xl border border-red-500 text-red-500 font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined text-[18px]">delete</span>
                 Delete
               </button>
               <button 
                 onClick={() => setTimeout(() => window.print(), 300)}
                 className="flex-[1.5] py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform flex justify-center items-center gap-2"
                 style={{ background: "var(--ds-primary)" }}
               >
                 <span className="material-symbols-outlined text-[18px]">print</span>
                 Print
               </button>
             </div>
          </div>
        </div>
      )}

      {/* ── Hidden Printable Template ── */}
      {previewInvoice && (
        <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-0 m-0 w-full min-h-screen">
          <div className="max-w-xl mx-auto align-top">
             <InvoiceTemplate
                shopName={shop.name}
                shopAddress={formatAddress(shop.address)}
                shopPhone={shop.contactNumber || ""}
                fbLink={shop.socialLinks?.facebook || ""}
                igLink={shop.socialLinks?.instagram || ""}
                footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
                invNumber={previewInvoice.invoiceNumber}
                invDate={new Date(previewInvoice.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                customerName={previewInvoice.customerName || "Walk-in Customer"}
                customerPhone={previewInvoice.customerPhone}
                items={previewInvoice.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
                subtotal={previewInvoice.subtotal}
                discount={previewInvoice.discountAmount}
                advanceAmount={previewInvoice.advanceAmount}
                grandTotal={previewInvoice.grandTotal}
                notes={previewInvoice.notes}
             />
          </div>
        </div>
      )}
    </>
  );
}
