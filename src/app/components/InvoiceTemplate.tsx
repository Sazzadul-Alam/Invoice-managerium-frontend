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
  customerEmail?: string;
  customerAddress?: string;

  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  advanceAmount?: number;
  deliveryCharge?: number;
  isDeliveryPaid?: boolean;
  grandTotal: number;

  notes?: string;
  isDemo?: boolean;
  noShadow?: boolean;
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
  customerEmail,
  customerAddress,
  items,
  subtotal,
  discount,
  advanceAmount = 0,
  deliveryCharge = 0,
  isDeliveryPaid = false,
  grandTotal,
  notes,
  isDemo,
  noShadow,
}: InvoiceTemplateProps) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${noShadow ? "" : "shadow-sm"}`}
      style={{
        background: "#ffffff",
        borderColor: "#c0c8cc",
      }}
    >
      {/* Receipt header with shop info */}
      <div
        className="py-5 px-5 text-center text-white bg-force"
        style={{ background: "#005C72" }}
      >
        <h3
          className="text-xl font-extrabold"
          style={{ fontFamily: "'Manrope', sans-serif", color: "#ffffff" }}
        >
          {shopName}
        </h3>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px", lineHeight: "1.5" }}>{shopAddress}</p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: "2px" }}>{shopPhone}</p>
      </div>

      {/* POS Invoice label */}
      <div style={{ textAlign: "center", padding: "8px 0", borderBottom: "1px solid #c0c8cc" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#70787d" }}>
          ─ ─ ─ &nbsp; POS Invoice &nbsp; ─ ─ ─
        </p>
      </div>

      {/* Invoice no + Date */}
      <div
        style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #c0c8cc" }}
      >
        <div>
          <p style={{ fontSize: "11px", color: "#70787d", fontWeight: 500 }}>Invoice No.</p>
          <p style={{ fontSize: "12px", color: "#191c1d", fontWeight: 700, marginTop: "2px" }}>{invNumber}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "11px", color: "#70787d", fontWeight: 500 }}>Date</p>
          <p style={{ fontSize: "12px", color: "#191c1d", fontWeight: 700, marginTop: "2px" }}>{invDate}</p>
        </div>
      </div>

      {/* Customer */}
      {(customerName || customerPhone || customerEmail || customerAddress) && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #c0c8cc" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#70787d", marginBottom: "4px" }}>
            Billed To
          </p>
          {customerName && <p style={{ fontSize: "13px", color: "#191c1d", fontWeight: 600 }}>{customerName}</p>}
          <div style={{ marginTop: "2px" }}>
            {customerPhone && <p style={{ fontSize: "11px", color: "#70787d" }}>{customerPhone}</p>}
            {customerEmail && <p style={{ fontSize: "11px", color: "#70787d" }}>{customerEmail}</p>}
          </div>
          {customerAddress && (
            <p style={{ fontSize: "11px", color: "#70787d", marginTop: "4px", lineHeight: "1.4" }}>
              {customerAddress}
            </p>
          )}
        </div>
      )}

      {/* Items table header */}
      <div style={{ padding: "12px 20px 4px 20px" }}>
        <div style={{ display: "flex", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#70787d", borderBottom: "1px solid #c0c8cc", paddingBottom: "6px" }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: "36px", textAlign: "center" }}>Qty</span>
          <span style={{ width: "64px", textAlign: "right" }}>Rate</span>
          <span style={{ width: "64px", textAlign: "right" }}>Amount</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: "12px" }}>
            <span style={{ flex: 1, color: "#191c1d", fontWeight: 500, paddingRight: "8px", lineHeight: "1.4" }}>
              {item.name.includes(" • ") ? (
                <>
                  {item.name.split(" • ")[0]}
                  <span style={{ color: "#70787d", fontWeight: 400, fontSize: "10px" }}> • {item.name.split(" • ")[1]}</span>
                </>
              ) : (
                item.name
              )}
            </span>
            <span style={{ width: "36px", textAlign: "center", color: "#70787d" }}>{item.qty}</span>
            <span style={{ width: "64px", textAlign: "right", color: "#70787d" }}>৳{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span style={{ width: "64px", textAlign: "right", color: "#191c1d", fontWeight: 700 }}>
              ৳{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: "center", fontSize: "12px", color: "#70787d", padding: "8px 0" }}>No items</div>
        )}
      </div>

      {/* Dashed divider */}
      <div style={{ padding: "4px 20px" }}>
        <div style={{ borderTop: "1px dashed #c0c8cc" }} />
      </div>

      {/* Totals */}
      <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#3f484c" }}>
          <span style={{ whiteSpace: "nowrap", marginRight: "8px" }}>Subtotal</span>
          <span style={{ whiteSpace: "nowrap" }}>৳{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#2e7d32" }}>
            <span style={{ whiteSpace: "nowrap", marginRight: "8px" }}>Discount</span>
            <span style={{ whiteSpace: "nowrap" }}>−৳{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {advanceAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#ba1a1a" }}>
            <span style={{ whiteSpace: "nowrap", marginRight: "8px" }}>Advance Paid</span>
            <span style={{ whiteSpace: "nowrap" }}>−৳{advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {deliveryCharge > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#3f484c" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", marginRight: "8px" }}>
              Delivery Charge
              {isDeliveryPaid && (
                <span style={{ fontSize: "7px", fontWeight: 900, background: "#22c55e", color: "#ffffff", padding: "1px 4px", borderRadius: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Paid
                </span>
              )}
            </span>
            <span style={isDeliveryPaid ? { textDecoration: "line-through", opacity: 0.4, fontStyle: "italic", whiteSpace: "nowrap" } : { whiteSpace: "nowrap" }}>
              +৳{deliveryCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Grand total */}
      <div
        className="bg-force"
        style={{
          margin: "4px 20px 16px 20px",
          borderRadius: "12px",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#e8f4f8",
          gap: "8px",
        }}
      >
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#005C72", fontSize: "15px", whiteSpace: "nowrap" }}>
          Grand Total
        </span>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#005C72", fontSize: "20px", whiteSpace: "nowrap" }}>
          ৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Dashed divider */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ borderTop: "1px dashed #c0c8cc" }} />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {notes && (
          <p style={{ fontSize: "12px", color: "#70787d", fontWeight: 700 }}>
            Note: {notes}
          </p>
        )}
        <p style={{ fontSize: "12px", color: "#191c1d", fontWeight: 400 }}>
          {footerText || "Thank you for your purchase!"}
        </p>

        {/* Social links */}
        {(fbLink || igLink) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
            <div style={{ borderTop: "1px dashed #c0c8cc", margin: "0 32px 8px 32px" }} />
            {fbLink && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", color: "#3f484c" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#1877F2" }}>public</span>
                <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fbLink}</span>
              </div>
            )}
            {igLink && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", color: "#3f484c" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#E4405F" }}>photo_camera</span>
                <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{igLink}</span>
              </div>
            )}
          </div>
        )}

        {isDemo && (
          <p style={{ fontSize: "10px", color: "rgba(112,120,125,0.6)", marginTop: "4px" }}>
            ✦ Demo receipt — upgrade for real invoicing
          </p>
        )}
      </div>
    </div>
  );
}