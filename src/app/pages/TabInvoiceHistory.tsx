import { useState, useEffect } from "react";
import { type ApiShop, type ApiInvoice } from "../types";
import { invoiceApi } from "../api/invoice.api";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { InvoiceWrapper } from "../components/InvoiceWrapper";
import { useInvoiceExport } from "../utils/useInvoiceExport";

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
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [limit, setLimit] = useState(20);


  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrintingMultiple, setIsPrintingMultiple] = useState(false);
  const { isExporting, exportMany, ExportCaptureContainer } = useInvoiceExport(shop);


  useEffect(() => {
    if (shop) {
      setCurrentPage(1);
      fetchInvoices(1, filterDateFrom, filterDateTo, limit);
    }
  }, [shop, filterDateFrom, filterDateTo, limit]);

  useEffect(() => {
    if (shop) {
      fetchInvoices(currentPage, filterDateFrom, filterDateTo, limit);
    }
  }, [currentPage]);




  const fetchInvoices = async (page = currentPage, dateFrom = filterDateFrom, dateTo = filterDateTo, pageSize = limit) => {
    if (!shop) return;
    setLoading(true);
    try {
      const res = await invoiceApi.listInvoices(shop._id, page, pageSize, dateFrom, dateTo);
      setInvoices(res.invoices);
      setTotalPages(Math.ceil((res.total || 0) / pageSize));
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

  const handlePrintSelected = () => {
    if (!shop || selectedIds.length === 0) return;

    // Render templates then print — status update runs in background and never blocks printing
    setIsPrintingMultiple(true);
    setTimeout(() => {
      window.print();
      setIsPrintingMultiple(false);
      setSelectedIds([]);
    }, 800);

    // Update status in background; optimistic local update immediately
    const idsToMark = invoices
      .filter(inv => selectedIds.includes(inv._id) && inv.status !== "printed")
      .map(inv => inv._id);

    setInvoices(prev =>
      prev.map(i => idsToMark.includes(i._id) ? { ...i, status: "printed" } : i)
    );

    idsToMark.forEach(id => {
      invoiceApi.updateStatus(shop._id, id, "printed").catch(() => {
        // Status update failed silently — print still completed
      });
    });
  };

  const handlePrint = async (inv: ApiInvoice) => {
    if (!shop) return;
    try {
      // Only call backend if not already marked printed
      if (inv.status !== "printed") {
        await invoiceApi.updateStatus(shop._id, inv._id, "printed");
        // Update local state
        setInvoices(prev => prev.map(i => i._id === inv._id ? { ...i, status: "printed" } : i));
        if (previewInvoice?._id === inv._id) {
          setPreviewInvoice({ ...previewInvoice, status: "printed" });
        }
      }
      
      // Trigger browser print
      setTimeout(() => window.print(), 300);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to initiate print", type: "error" });
      setTimeout(() => setToast(null), 3000);
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
      <div className={`px-4 pt-5 space-y-4 print:hidden transition-all ${selectedIds.length > 0 ? "pb-28" : "pb-4"}`}>
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

        {/* Sticky Header */}
        <div className="sticky top-[-20px] z-20 bg-ds-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-ds-outline-variant/30 space-y-3 shadow-sm">
          {/* Row 1: Title + Refresh only */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ds-primary leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Invoices
              </h2>
              <p className="text-[10px] text-ds-outline font-bold uppercase tracking-tighter">Inventory History</p>
            </div>
            <button
              onClick={() => fetchInvoices()}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-ds-surface-container-low text-ds-on-surface hover:bg-ds-surface-container-high border border-ds-outline-variant transition-colors"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
          </div>

          {/* Row 2: Date range filter only */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex items-center h-9 px-2.5 rounded-xl border border-ds-outline-variant bg-ds-surface-container-lowest focus-within:border-ds-primary/30 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[14px] text-ds-outline mr-1.5 flex-shrink-0">calendar_today</span>
              <input
                type="date"
                value={filterDateFrom}
                max={filterDateTo || undefined}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-bold text-ds-on-surface w-full min-w-0"
              />
            </div>
            <span className="text-[10px] font-black text-ds-outline flex-shrink-0">TO</span>
            <div className="flex-1 flex items-center h-9 px-2.5 rounded-xl border border-ds-outline-variant bg-ds-surface-container-lowest focus-within:border-ds-primary/30 transition-all shadow-sm">
              <input
                type="date"
                value={filterDateTo}
                min={filterDateFrom || undefined}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-bold text-ds-on-surface w-full min-w-0"
              />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}
                className="flex-shrink-0 text-ds-outline hover:text-ds-error transition-colors"
                title="Clear date range"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
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
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selectedIds.length === invoices.length && invoices.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-ds-outline-variant accent-ds-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-ds-outline uppercase tracking-wider select-none">Select All</span>
            </div>
            {invoices.map((inv) => {
              const colors = getStatusColor(inv.status);
              const isSelected = selectedIds.includes(inv._id);
              return (
                <div
                  key={inv._id}
                  onClick={() => {
                    if (selectedIds.length > 0) {
                      // If we are in "selection mode" (any checkbox checked), regular tap toggles selection
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

        {/* Pagination bar */}
        {!loading && (invoices.length > 0 || totalPages > 1) && (
          <div className="py-4 border-t border-ds-outline-variant/30 mt-4 space-y-3">
            {/* Page size selector */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-ds-outline uppercase tracking-wider">Per page</span>
              <div className="flex gap-1">
                {[20, 30, 50].map(size => (
                  <button
                    key={size}
                    onClick={() => { setLimit(size); setCurrentPage(1); }}
                    className={`h-7 px-3 rounded-lg text-[11px] font-black transition-all border ${
                      limit === size
                        ? "bg-ds-primary text-white border-ds-primary"
                        : "bg-ds-surface-container-low text-ds-on-surface border-ds-outline-variant hover:border-ds-primary/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Prev / Page info / Next */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
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
        )}
      </div>


      {/* ── Bottom Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 print:hidden animate-in slide-in-from-bottom-3 duration-250">
          <div
            className="w-full max-w-lg flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-ds-outline-variant/40"
            style={{ background: "var(--ds-surface-container-low)" }}
          >
            {/* Dismiss */}
            <button
              onClick={() => setSelectedIds([])}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-ds-surface-container-high text-ds-on-surface active:scale-95 transition-all"
              title="Clear selection"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* Count */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-ds-on-surface leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {selectedIds.length} selected
              </p>
              <p className="text-[10px] text-ds-outline font-bold uppercase tracking-wider">invoice{selectedIds.length > 1 ? "s" : ""}</p>
            </div>

            {/* Print */}
            <button
              onClick={handlePrintSelected}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-ds-outline-variant bg-ds-surface-container-lowest text-ds-on-surface active:scale-95 transition-all shadow-sm"
              title="Print selected"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
            </button>

            {/* Export */}
            <button
              onClick={() => exportMany(invoices.filter(inv => selectedIds.includes(inv._id)))}
              disabled={isExporting}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-white active:scale-95 transition-all disabled:opacity-60 shadow-sm"
              style={{ background: "var(--ds-primary)" }}
              title="Export as images"
            >
              {isExporting ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">download</span>
              )}
            </button>
          </div>
        </div>
      )}

      <ExportCaptureContainer />

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
                onClick={() => handlePrint(previewInvoice)}
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
        <div className="hidden print:block absolute top-0 left-0 z-[99999] bg-white text-black p-0 m-0 w-full">
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
        <div className="hidden print:block absolute top-0 left-0 z-[99999] bg-white text-black p-0 m-0 w-full">
          <div className="max-w-xl mx-auto py-0">
            {invoices
              .filter((inv) => selectedIds.includes(inv._id))
              .map((inv) => (
                <div
                  key={inv._id}
                  style={{
                    pageBreakAfter: "always",
                    breakAfter: "page",
                    display: "block",
                    width: "100%",
                    marginBottom: "20px"
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
