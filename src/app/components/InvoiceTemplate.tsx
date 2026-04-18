import React from "react";

export interface InvoiceTemplateProps {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  fbLink?: string;
  igLink?: string;
  footerText?: string;

  invNumber: string;
  invDate: string;

  customerName: string;
  customerPhone: string;

  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  advanceAmount?: number;
  grandTotal: number;

  notes?: string;
  isDemo?: boolean;
}

export function InvoiceTemplate({
  shopName,
  shopAddress,
  shopPhone,
  fbLink,
  igLink,
  footerText,
  invNumber,
  invDate,
  customerName,
  customerPhone,
  items,
  subtotal,
  discount,
  advanceAmount = 0,
  grandTotal,
  notes,
  isDemo,
}: InvoiceTemplateProps) {
  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{
        background: "var(--ds-surface-container-lowest)",
        borderColor: "var(--ds-outline-variant)",
      }}
    >
      {/* Receipt header with shop info */}
      <div
        className="py-5 px-5 text-center text-white"
        style={{ background: "var(--ds-primary-container)" }}
      >
        <h3
          className="text-xl font-extrabold"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {shopName}
        </h3>
        <p className="text-xs text-white/70 mt-1 leading-relaxed">{shopAddress}</p>
        <p className="text-xs text-white/80 font-semibold mt-0.5">{shopPhone}</p>
      </div>

      {/* POS Invoice label */}
      <div className="text-center py-2 border-b" style={{ borderColor: "var(--ds-outline-variant)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-outline">
          ─ ─ ─ &nbsp; POS Invoice &nbsp; ─ ─ ─
        </p>
      </div>

      {/* Invoice no + Date */}
      <div
        className="flex justify-between px-5 py-3 text-xs border-b"
        style={{ borderColor: "var(--ds-outline-variant)" }}
      >
        <div>
          <p className="text-ds-outline font-medium">Invoice No.</p>
          <p className="text-ds-on-surface font-bold mt-0.5">{invNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-ds-outline font-medium">Date</p>
          <p className="text-ds-on-surface font-bold mt-0.5">{invDate}</p>
        </div>
      </div>

      {/* Customer */}
      {(customerName || customerPhone) && (
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: "var(--ds-outline-variant)" }}
        >
          <p className="text-ds-outline text-[10px] font-bold uppercase tracking-wider mb-1">
            Billed To
          </p>
          {customerName && <p className="text-ds-on-surface text-sm font-semibold">{customerName}</p>}
          {customerPhone && <p className="text-ds-outline text-xs mt-0.5">{customerPhone}</p>}
        </div>
      )}

      {/* Items table header */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex text-[10px] font-bold uppercase tracking-wider text-ds-outline border-b pb-1.5" style={{ borderColor: "var(--ds-outline-variant)" }}>
          <span className="flex-1">Item</span>
          <span className="w-10 text-center">Qty</span>
          <span className="w-16 text-right">Rate</span>
          <span className="w-16 text-right">Amount</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-2 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start text-xs">
            <span className="flex-1 text-ds-on-surface font-medium pr-2 leading-snug">
              {item.name.includes(" • ") ? (
                <>
                  {item.name.split(" • ")[0]} 
                  <span className="text-ds-outline font-normal text-[10px]"> • {item.name.split(" • ")[1]}</span>
                </>
              ) : (
                item.name
              )}
            </span>
            <span className="w-10 text-center text-ds-outline">{item.qty}</span>
            <span className="w-16 text-right text-ds-outline">৳{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="w-16 text-right text-ds-on-surface font-bold">
              ৳{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
        {items.length === 0 && (
           <div className="text-center text-xs text-ds-outline py-2">No items</div>
        )}
      </div>

      {/* Dashed divider */}
      <div className="px-5 py-1">
        <div className="border-t border-dashed" style={{ borderColor: "var(--ds-outline-variant)" }} />
      </div>

      {/* Totals */}
      <div className="px-5 py-2 space-y-1.5">
        <div className="flex justify-between text-xs text-ds-on-surface-variant">
          <span>Subtotal</span>
          <span>৳{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs text-green-600">
            <span>Discount</span>
            <span>−৳{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {advanceAmount > 0 && (
          <div className="flex justify-between text-xs text-ds-error">
            <span>Advance Paid</span>
            <span>−৳{advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Grand total */}
      <div
        className="mx-5 mb-4 rounded-xl px-4 py-3 flex justify-between items-center"
        style={{ background: "var(--ds-surface-container-low)" }}
      >
        <span
          className="font-extrabold text-ds-primary"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Grand Total
        </span>
        <span
          className="text-xl font-extrabold"
          style={{
            color: "var(--ds-primary-container)",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          ৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Dashed divider */}
      <div className="px-5">
        <div className="border-t border-dashed" style={{ borderColor: "var(--ds-outline-variant)" }} />
      </div>

      {/* Footer — Thank you + Social Links */}
      <div className="text-center px-5 py-4 space-y-2.5">
        {notes && (
          <p className="text-xs text-ds-outline mb-2 font-bold">
            Note: {notes}
          </p>
        )}
        <p className="text-ds-on-surface text-xs font-normal">
          {footerText || "Thank you for your purchase!"}
        </p>

        {/* Social links */}
        {(fbLink || igLink) && (
          <div className="space-y-1.5 pt-1">
            <div className="border-t border-dashed mx-8 mb-2" style={{ borderColor: "var(--ds-outline-variant)" }} />
            {fbLink && (
              <div className="flex items-center justify-center gap-2 text-xs text-ds-on-surface-variant">
                <span className="material-symbols-outlined text-sm" style={{ color: "#1877F2" }}>
                  public
                </span>
                <span className="truncate max-w-[220px]">{fbLink}</span>
              </div>
            )}
            {igLink && (
              <div className="flex items-center justify-center gap-2 text-xs text-ds-on-surface-variant">
                <span className="material-symbols-outlined text-sm" style={{ color: "#E4405F" }}>
                  photo_camera
                </span>
                <span className="truncate max-w-[220px]">{igLink}</span>
              </div>
            )}
          </div>
        )}

        {isDemo && (
          <p className="text-[10px] text-ds-outline/60 mt-1">
            ✦ Demo receipt — upgrade for real invoicing
          </p>
        )}
      </div>
    </div>
  );
}
