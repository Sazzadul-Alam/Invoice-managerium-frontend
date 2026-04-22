import { useState, useEffect, useRef } from "react";
import domtoimage from "dom-to-image-more";
import { type ApiShop, type ApiInvoice, invoiceApi } from "../auth.utils";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { InvoiceWrapper } from "../components/InvoiceWrapper";

function formatAddress(addr: ApiShop["address"]): string {
  return addr?.address_line1 || "";
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

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const limit = 10; 


  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportingInvoice, setExportingInvoice] = useState<ApiInvoice | null>(null);
  const [isPrintingMultiple, setIsPrintingMultiple] = useState(false);
  const longPressTimer = useRef<any>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setCurrentPage(1);
      fetchInvoices(1, filterDate);
    }
  }, [shop, filterDate]);

  useEffect(() => {
    if (shop) {
      fetchInvoices(currentPage, filterDate);
    }
  }, [currentPage]);


  const handlePressStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressedId(id);
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
      // Add a tiny vibration if supported
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // Delay clearing the longPressedId so the onClick can catch it
    setTimeout(() => setLongPressedId(null), 10);
  };

  const fetchInvoices = async (page = currentPage, date = filterDate) => {
    if (!shop) return;
    setLoading(true);
    try {
      const res = await invoiceApi.listInvoices(shop._id, page, limit, date);
      // Backend returns total items, calculate total pages
      setInvoices(res.invoices);
      setTotalPages(Math.ceil((res.total || 0) / limit));
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
        // Wait for fonts and components to fully render
        await new Promise(resolve => setTimeout(resolve, 400));

        if (exportRef.current) {
          // Use 'as any' to bypass the incomplete community type definitions
          const dataUrl = await (domtoimage as any).toPng(exportRef.current, {
            quality: 1.0,
            bgcolor: "#ffffff",
            width: 360, // Tightened to remove horizontal gaps
            scale: 4, // 4x Resolution (High Definition)
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
    // Give it a full second to render all selected templates in the background
    setTimeout(() => {
      window.print();
      setIsPrintingMultiple(false);
    }, 1000);
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

        {/* Header - Staked 2-Row Layout for Mobile */}
        <div className="sticky top-[-20px] z-20 bg-ds-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-ds-outline-variant/30 space-y-3 shadow-sm">
          {/* Row 1: Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ds-primary leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Invoices
              </h2>
              <p className="text-[10px] text-ds-outline font-bold uppercase tracking-tighter">Inventory History</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInvoices()}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-ds-surface-container-low text-ds-on-surface hover:bg-ds-surface-container-high border border-ds-outline-variant transition-colors"
                title="Refresh List"
              >
                <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
              </button>
            </div>
          </div>

          {/* Row 2: Date Filter & Multi-Select Buttons */}
          <div className="flex items-center gap-2">
            {/* Date Filter - Takes available space */}
            <div className="flex-1 relative flex items-center h-9 px-3 rounded-xl border border-ds-outline-variant bg-ds-surface-container-lowest focus-within:border-ds-primary/30 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-ds-outline mr-2">calendar_today</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-bold text-ds-on-surface w-full"
              />
              {filterDate && (
                <button onClick={() => setFilterDate("")} className="ml-1 text-ds-outline hover:text-ds-error">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Selection Buttons - Appear only when items selected */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-200">
                <button
                  onClick={handlePrintSelected}
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-ds-outline-variant text-ds-on-surface bg-ds-surface-container-low active:scale-95 transition-all shadow-sm"
                  title={`Print ${selectedIds.length} invoices`}
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                </button>
                <button
                  onClick={handleExportSelected}
                  disabled={isExporting}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-ds-primary-container text-white active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  title={`Export ${selectedIds.length} invoices`}
                >
                  {isExporting ? (
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  )}
                </button>
                <div className="h-9 px-2 flex items-center justify-center rounded-lg bg-ds-primary/10 text-ds-primary text-[10px] font-black">
                  {selectedIds.length}
                </div>
              </div>
            )}
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
                  onMouseDown={() => handlePressStart(inv._id)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handlePressStart(inv._id)}
                  onTouchEnd={handlePressEnd}
                  onClick={() => {
                    if (longPressedId === inv._id) return;

                    if (selectedIds.length > 0) {
                      // If we are in "selection mode", regular tap toggles selection
                      setSelectedIds(prev =>
                        prev.includes(inv._id) ? prev.filter(i => i !== inv._id) : [...prev, inv._id]
                      );
                    } else {
                      // Normal mode: regular tap opens preview
                      setPreviewInvoice(inv);
                    }
                  }}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98] hover:shadow-sm ${isSelected ? "border-ds-primary-container bg-ds-primary-container/5" : "border-ds-outline-variant bg-ds-surface-container-lowest"}`}
                >
                  <div onClick={(e) => toggleSelect(inv._id, e)}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }} // Handled by div onClick
                      className="h-4 w-4 rounded border-ds-outline-variant text-ds-primary focus:ring-ds-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Invoice # + Badge (Left), Amount (Right) */}
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-ds-on-surface" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          {inv.invoiceNumber}
                        </h4>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wide"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <span className="text-[15px] font-extrabold text-ds-primary text-right">
                        ৳{inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Middle Row: Customer + Date (Left), Edit Pencil (Right) */}
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-xs text-ds-on-surface-variant font-medium uppercase truncate">
                          {inv.customerName || "Walk-in Customer"}
                        </p>
                        <span className="text-[11px] font-medium text-ds-outline flex-shrink-0">
                          • {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-end flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(inv);
                          }}
                          className="p-1 rounded-lg text-ds-outline hover:bg-ds-surface-container-high transition-colors -mr-1 relative z-10"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination bar - Sticky Bottom mobile style */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between py-4 border-t border-ds-outline-variant/30 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-9 px-4 rounded-xl border border-ds-outline-variant text-ds-on-surface text-xs font-bold disabled:opacity-30 active:scale-95 transition-all bg-ds-surface-container-low flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Prev
            </button>
            <div className="text-[11px] font-black text-ds-outline uppercase tracking-widest">
              Page <span className="text-ds-primary">{currentPage}</span> of {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-9 px-4 rounded-xl border border-ds-outline-variant text-ds-on-surface text-xs font-bold disabled:opacity-30 active:scale-95 transition-all bg-ds-surface-container-low flex items-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>


      {/* Off-screen Capture Area */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none" style={{ width: "360px" }}>
        <div ref={exportRef} id="export-container" style={{ width: "360px", background: "#ffffff" }}>
          <style>{`
  /* Import fonts for the capture context */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

  /* Ultra-Tight Digital Export Styling */
  #export-container {
    padding: 12px 0px !important; /* Kept top spacing, removed side padding */
    background-color: #ffffff !important;
    width: 360px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    font-family: 'Inter', sans-serif !important;
    -webkit-font-smoothing: antialiased;
  }
  
  #export-container * {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    text-rendering: optimizeLegibility !important;
  }

  /* Target the main card container precisely */
  #export-container > div > div {
    margin: 0 !important;
    max-width: 100% !important;
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 16px !important; /* Restored rounded look */
  }

  /* Restore teal header branding */
  #export-container .bg-force {
    background-color: #005C72 !important;
    padding: 16px 8px !important; 
  }

  #export-container h3 {
    font-family: 'Manrope', sans-serif !important;
    font-weight: 800 !important;
    letter-spacing: -0.01em !important;
  }
  
  /* Precision Dashed Lines */
  #export-container div[style*="border-bottom"],
  #export-container div[style*="border-top"] {
     border-bottom: 1px dashed #cbd5e1 !important; 
     border-radius: 0 !important;
  }

  /* Restore Grand Total box */
  #export-container .border-black {
    border: 1px dashed #000000 !important;
    border-radius: 8px !important;
  }

  #export-container p, #export-container span {
    font-family: 'Inter', sans-serif !important;
  }
`}</style>
          {exportingInvoice && (
            <div style={{ backgroundColor: "#ffffff", padding: "0px" }}>
              <InvoiceWrapper
                shop={shop}
                invoice={exportingInvoice}
                noShadow={false}
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
              <InvoiceWrapper
                shop={shop}
                invoice={previewInvoice}
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
            <InvoiceWrapper
              shop={shop}
              invoice={previewInvoice}
              noShadow
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
                <div
                  key={inv._id}
                  style={{
                    breakAfter: "always",
                    pageBreakAfter: "always",
                    paddingBottom: "2rem"
                  }}
                >
                  <InvoiceWrapper
                    shop={shop}
                    invoice={inv}
                    noShadow
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
