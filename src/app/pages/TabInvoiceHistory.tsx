import { useState, useEffect, useRef } from "react";
// @ts-ignore
import domtoimage from "dom-to-image-more";
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

export function TabInvoiceHistory({
  shop,
  onEditInvoice
}: {
  shop: ApiShop | null;
  onEditInvoice?: (inv: ApiInvoice) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<ApiInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportingInvoice, setExportingInvoice] = useState<ApiInvoice | null>(null);
  const [isPrintingMultiple, setIsPrintingMultiple] = useState(false);

  useEffect(() => {
    if (shop) {
      fetchInvoices();
    }
  }, [shop]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.listInvoices(shop!._id);
      const sorted = [...res.invoices].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInvoices(sorted);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to load invoices", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map(i => i._id));
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);

    try {
      const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv._id));

      for (const inv of selectedInvoices) {
        setExportingInvoice(inv);
        // Wait for state update and render
        await new Promise(resolve => setTimeout(resolve, 100));

        if (exportRef.current) {
          const dataUrl = await domtoimage.toPng(exportRef.current, {
            quality: 1.0,
            bgcolor: "#ffffff",
            width: 360,
          });
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `Invoice-${inv.invoiceNumber}-${inv.customerName || "Customer"}.png`;
          link.click();
        }
      }

      setToast({ msg: `Successfully exported ${selectedIds.length} invoices as images`, type: "success" });
      setSelectedIds([]);
    } catch (err: any) {
      setToast({ msg: "Export failed", type: "error" });
    } finally {
      setIsExporting(false);
      setExportingInvoice(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handlePrintSelected = () => {
    setIsPrintingMultiple(true);
    setTimeout(() => {
      window.print();
      setIsPrintingMultiple(false);
    }, 500);
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
    if (!shop || !window.confirm("Are you sure you want to void/delete this invoice?")) return;
    setDeleting(true);
    try {
      await invoiceApi.deleteInvoice(shop._id, inv._id);
      setPreviewInvoice(null);
      setInvoices(prev => prev.filter(i => i._id !== inv._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleStartEdit = (inv: ApiInvoice) => {
    if (onEditInvoice) {
      onEditInvoice(inv);
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
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handlePrintSelected}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-ds-outline-variant text-ds-on-surface text-[11px] font-bold active:scale-95 transition-all shadow-sm bg-ds-surface-container-low"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Print ({selectedIds.length})
                </button>
                <button
                  onClick={handleExportSelected}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ds-primary-container text-white text-[11px] font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isExporting ? (
                    <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-base">download</span>
                  )}
                  Save ({selectedIds.length})
                </button>
              </>
            )}
            <button
              onClick={fetchInvoices}
              className="p-2 rounded-xl bg-ds-surface-container-low text-ds-on-surface hover:bg-ds-surface-container-high border border-ds-outline-variant transition-colors"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
          </div>
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
            {/* <div className="flex items-center gap-2 px-1"> */}
            {/* <input
                type="checkbox"
                checked={selectedIds.length === invoices.length && invoices.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-ds-outline-variant text-ds-primary focus:ring-ds-primary"
              /> */}
            {/* <span className="text-xs font-bold text-ds-outline uppercase tracking-wider">Select All</span> */}
            {/* </div> */}
            {invoices.map((inv) => {
              const colors = getStatusColor(inv.status);
              const isSelected = selectedIds.includes(inv._id);
              return (
                <div
                  key={inv._id}
                  onClick={() => setPreviewInvoice(inv)}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all cursor-pointer hover:bg-ds-surface-container-high ${isSelected ? "border-ds-primary-container bg-ds-primary-container/5" : "border-ds-outline-variant bg-ds-surface-container-lowest"}`}
                >
                  <div onClick={(e) => toggleSelect(inv._id, e)} className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }} // Handled by div onClick
                      className="h-4 w-4 rounded border-ds-outline-variant text-ds-primary focus:ring-ds-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-extrabold text-ds-on-surface flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          #{inv.invoiceNumber}
                          <span className="text-[10px] font-medium text-ds-outline bg-ds-surface-container-high px-1.5 py-0.5 rounded border border-ds-outline-variant/30">
                            {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </h4>
                        <p className="text-xs text-ds-on-surface-variant mt-1 font-medium">{inv.customerName || "Walk-in Customer"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-ds-primary block">
                          ৳{inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-outline-variant/30">
                      <span
                        className="flex items-center gap-1.5 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-widest border"
                        style={{ background: colors.bg, color: colors.text, borderColor: colors.text + '30' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.text }} />
                        {inv.status}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(inv);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ds-surface-container-high text-ds-primary hover:bg-ds-primary hover:text-white transition-all active:scale-95 border border-ds-outline-variant/50"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_square</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Off-screen Capture Area */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none" style={{ width: "400px" }}>
        <div ref={exportRef} id="export-container" style={{ width: "360px", background: "white" }}>
          <style>{`
  #export-container * {
    box-shadow: none !important;
    border-color: transparent !important;
  }
  #export-container div:not(.bg-force),
  #export-container p,
  #export-container span,
  #export-container label {
    background-color: transparent !important;
  }
  #export-container .bg-force {
    background-color: inherit !important;
  }
`}</style>
          {exportingInvoice && (
            <div style={{ backgroundColor: "#ffffff", padding: "20px" }}>
              <InvoiceTemplate
                shopName={shop.name}
                shopAddress={formatAddress(shop.address)}
                shopPhone={shop.contactNumber || ""}
                fbLink={shop.socialLinks?.facebook || ""}
                igLink={shop.socialLinks?.instagram || ""}
                footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
                invNumber={exportingInvoice.invoiceNumber}
                invDate={new Date(exportingInvoice.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                customerName={exportingInvoice.customerName || "Walk-in Customer"}
                customerPhone={exportingInvoice.customerPhone}
                customerEmail={exportingInvoice.customerEmail}
                customerAddress={exportingInvoice.customerAddress}
                items={exportingInvoice.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
                subtotal={exportingInvoice.subtotal}
                discount={exportingInvoice.discountAmount}
                advanceAmount={exportingInvoice.advanceAmount}
                deliveryCharge={exportingInvoice.deliveryCharge}
                isDeliveryPaid={exportingInvoice.isDeliveryPaid}
                grandTotal={exportingInvoice.grandTotal}
                notes={exportingInvoice.notes}
                noShadow={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-ds-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-ds-outline-variant bg-ds-surface-container-lowest">
              <h2 className="text-lg font-bold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Invoice #{previewInvoice.invoiceNumber}
              </h2>
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
                customerEmail={previewInvoice.customerEmail}
                customerAddress={previewInvoice.customerAddress}
                items={previewInvoice.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
                subtotal={previewInvoice.subtotal}
                discount={previewInvoice.discountAmount}
                advanceAmount={previewInvoice.advanceAmount}
                deliveryCharge={previewInvoice.deliveryCharge}
                isDeliveryPaid={previewInvoice.isDeliveryPaid}
                grandTotal={previewInvoice.grandTotal}
                notes={previewInvoice.notes}
              />
            </div>

            <div className="p-4 border-t border-ds-outline-variant bg-ds-surface-container-lowest flex gap-3">
              <button
                onClick={() => handleDelete(previewInvoice)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-red-500 text-red-500 font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
              <button
                onClick={() => handleStartEdit(previewInvoice)}
                className="flex-1 py-3 rounded-xl border border-ds-primary text-ds-primary font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
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
              customerEmail={previewInvoice.customerEmail}
              customerAddress={previewInvoice.customerAddress}
              items={previewInvoice.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
              subtotal={previewInvoice.subtotal}
              discount={previewInvoice.discountAmount}
              advanceAmount={previewInvoice.advanceAmount}
              deliveryCharge={previewInvoice.deliveryCharge}
              isDeliveryPaid={previewInvoice.isDeliveryPaid}
              grandTotal={previewInvoice.grandTotal}
              notes={previewInvoice.notes}
            />
          </div>
        </div>
      )}

      {/* ── Multiple Print Template ── */}
      {isPrintingMultiple && (
        <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-0 m-0 w-full min-h-screen">
          <div className="max-w-xl mx-auto space-y-10 py-10">
            {invoices
              .filter((inv) => selectedIds.includes(inv._id))
              .map((inv, index) => (
                <div key={inv._id} style={{ breakBefore: index > 0 ? "page" : "auto", paddingTop: index > 0 ? "2rem" : "0" }}>
                  <InvoiceTemplate
                    shopName={shop.name}
                    shopAddress={formatAddress(shop.address)}
                    shopPhone={shop.contactNumber || ""}
                    fbLink={shop.socialLinks?.facebook || ""}
                    igLink={shop.socialLinks?.instagram || ""}
                    footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
                    invNumber={inv.invoiceNumber}
                    invDate={new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    customerName={inv.customerName || "Walk-in Customer"}
                    customerPhone={inv.customerPhone}
                    customerEmail={inv.customerEmail}
                    customerAddress={inv.customerAddress}
                    items={inv.items.map(c => ({ name: c.name, qty: c.quantity, price: c.unitPrice }))}
                    subtotal={inv.subtotal}
                    discount={inv.discountAmount}
                    advanceAmount={inv.advanceAmount}
                    deliveryCharge={inv.deliveryCharge}
                    isDeliveryPaid={inv.isDeliveryPaid}
                    grandTotal={inv.grandTotal}
                    notes={inv.notes}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
