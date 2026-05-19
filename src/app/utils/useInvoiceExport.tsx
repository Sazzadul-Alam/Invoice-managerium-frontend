import { useState, useRef } from "react";
import domtoimage from "dom-to-image-more";
import type { ApiInvoice, ApiShop } from "../types";
import { InvoiceWrapper } from "../components/InvoiceWrapper";

export function useInvoiceExport(shop: ApiShop | null) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingInvoice, setExportingInvoice] = useState<ApiInvoice | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const capture = async (invoice: ApiInvoice) => {
    setExportingInvoice(invoice);
    await new Promise(r => setTimeout(r, 400));
    if (!exportRef.current) return;
    const dataUrl = await (domtoimage as any).toPng(exportRef.current, {
      quality: 1.0,
      bgcolor: "#ffffff",
      width: 360,
      scale: 4,
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `Invoice-${invoice.invoiceNumber}-${invoice.customerName || "Customer"}.png`;
    link.click();
  };

  const exportOne = async (invoice: ApiInvoice) => {
    setIsExporting(true);
    try { await capture(invoice); }
    finally { setIsExporting(false); setExportingInvoice(null); }
  };

  const exportMany = async (invoices: ApiInvoice[]) => {
    if (!invoices.length) return;
    setIsExporting(true);
    try { for (const inv of invoices) await capture(inv); }
    finally { setIsExporting(false); setExportingInvoice(null); }
  };

  // Inline component — renders the off-screen capture div
  // Must be rendered in JSX by the consuming component
  function ExportCaptureContainer() {
    return (
      <div className="fixed top-0 left-[-9999px] pointer-events-none" style={{ width: "360px" }}>
        <div ref={exportRef} id="invoice-export-capture" style={{ width: "360px", background: "#ffffff" }}>
          <style>{`
            #invoice-export-capture {
              padding: 12px 0px !important;
              background-color: #ffffff !important;
              width: 360px !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              font-family: 'Inter', sans-serif !important;
              -webkit-font-smoothing: antialiased;
            }
            #invoice-export-capture * { border: none !important; outline: none !important; box-shadow: none !important; text-rendering: optimizeLegibility !important; }
            #invoice-export-capture > div > div { margin: 0 !important; max-width: 100% !important; border: 1.5px solid #e2e8f0 !important; border-radius: 16px !important; }
            #invoice-export-capture .bg-force { background-color: #005C72 !important; padding: 16px 8px !important; }
            #invoice-export-capture h3 { font-family: 'Manrope', sans-serif !important; font-weight: 800 !important; letter-spacing: -0.01em !important; }
            #invoice-export-capture div[style*="border-bottom"], #invoice-export-capture div[style*="border-top"] { border-bottom: 1px dashed #cbd5e1 !important; border-radius: 0 !important; }
            #invoice-export-capture .border-black { border: 1px dashed #000000 !important; border-radius: 8px !important; }
            #invoice-export-capture p, #invoice-export-capture span { font-family: 'Inter', sans-serif !important; }
          `}</style>
          {exportingInvoice && (
            <div style={{ backgroundColor: "#ffffff", padding: "0px" }}>
              <InvoiceWrapper shop={shop} invoice={exportingInvoice} noShadow={false} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return { isExporting, exportOne, exportMany, ExportCaptureContainer };
}
