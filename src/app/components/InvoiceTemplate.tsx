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
    <>
      <style>
        {`
          @media print {
            @page { margin: 0; }
            html, body, #root {
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-header { background: transparent !important; border-bottom: 1px dashed #000 !important; padding-bottom: 8px !important; }
            .print-header h3, .print-header p { color: #000000 !important; }
            .print-scaler { zoom: 0.88; }
          }
        `}
      </style>
      <div
        className={`overflow-hidden bg-white mx-auto w-full max-w-[320px] print:max-w-full print-scaler ${noShadow ? "" : "shadow-sm rounded-2xl border border-[#c0c8cc] print:border-none print:shadow-none print:rounded-none"}`}
      >
        {/* Receipt header with shop info */}
        <div
          className="py-3 px-2 text-center text-white bg-force print-header"
          style={{ background: "#005C72", borderBottom: "1px solid transparent" }}
        >
          <h3
            className="text-[17px] font-extrabold"
            style={{ fontFamily: "'Manrope', sans-serif", color: "#ffffff", lineHeight: "1.2" }}
          >
            {shopName}
          </h3>
          <p style={{ fontSize: "11px", color: "#ffffff", fontWeight: 600, marginTop: "4px", lineHeight: "1.3" }}>{shopAddress}</p>
          <p style={{ fontSize: "11px", color: "#ffffff", fontWeight: 800, marginTop: "2px" }}>Phone: {shopPhone}</p>
        </div>

        {/* POS Invoice label */}
        <div style={{ textAlign: "center", padding: "6px 0", borderBottom: "1px dashed #000000" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#000000" }}>
            POS Invoice
          </p>
        </div>

        {/* Invoice no + Date */}
        <div
          style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px dashed #000000" }}
        >
          <div>
            <p style={{ fontSize: "11px", color: "#000000", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>Invoice No.</p>
            <p style={{ fontSize: "11px", color: "#000000", fontWeight: 500, marginTop: "1px" }}>{invNumber}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#000000", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>Date</p>
            <p style={{ fontSize: "11px", color: "#000000", fontWeight: 500, marginTop: "1px" }}>{invDate}</p>
          </div>
        </div>

        {/* Customer */}
        {(customerName || customerPhone || customerAddress) && (
          <div style={{ padding: "8px 4px", borderBottom: "1px dashed #000000", display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#000000" }}>
              Billed To
            </p>
            
            {(customerName || customerPhone) && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                {customerName && (
                  <p style={{ fontSize: "11px", color: "#000000", fontWeight: 500, flex: 1, wordBreak: "break-word" }}>
                    Name: {customerName}
                  </p>
                )}
                {customerPhone && (
                  <p style={{ fontSize: "11px", color: "#000000", fontWeight: 500, textAlign: "right", whiteSpace: "nowrap" }}>
                    Phone: {customerPhone}
                  </p>
                )}
              </div>
            )}
            
            {customerAddress && (
              <p style={{ fontSize: "11px", color: "#000000", fontWeight: 500, lineHeight: "1.3", wordBreak: "break-word" }}>
                Address: {customerAddress}
              </p>
            )}
          </div>
        )}

        {/* Items table header */}
        <div style={{ padding: "8px 4px 4px 4px" }}>
          <div style={{ display: "flex", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", color: "#000000", borderBottom: "1px dashed #000000", paddingBottom: "4px" }}>
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: "24px", textAlign: "center" }}>Qty</span>
            <span style={{ width: "50px", textAlign: "right" }}>Rate</span>
            <span style={{ width: "56px", textAlign: "right" }}>Total</span>
          </div>
        </div>

        {/* Items */}
        <div style={{ padding: "6px 4px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: "11px", fontWeight: 500, color: "#000000" }}>
              <span style={{ flex: 1, paddingRight: "4px", lineHeight: "1.2" }}>
                {item.name}
              </span>
              <span style={{ width: "24px", textAlign: "center" }}>{item.qty}</span>
              <span style={{ width: "50px", textAlign: "right" }}>{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span style={{ width: "56px", textAlign: "right" }}>
                {(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: "center", fontSize: "11px", color: "#000000", fontWeight: 500, padding: "8px 0" }}>No items</div>
          )}
        </div>

        {/* Dashed divider */}
        <div style={{ padding: "2px 4px" }}>
          <div style={{ borderTop: "1px dashed #000000" }} />
        </div>

        {/* Totals */}
        <div style={{ padding: "6px 4px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#000000", fontWeight: 700 }}>
            <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>Subtotal</span>
            <span style={{ whiteSpace: "nowrap" }}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#000000", fontWeight: 700 }}>
              <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>Discount</span>
              <span style={{ whiteSpace: "nowrap" }}>−{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {(deliveryCharge > 0 || isDeliveryPaid || deliveryCharge === 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#000000", fontWeight: 700 }}>
              <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>
                Delivery Charge
              </span>
              {isDeliveryPaid ? (
                <span style={{ whiteSpace: "nowrap", fontWeight: 800, textTransform: "uppercase" }}>
                  Paid
                </span>
              ) : (
                <span style={{ whiteSpace: "nowrap" }}>
                  +{deliveryCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}
          {advanceAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#000000", fontWeight: 700 }}>
              <span style={{ whiteSpace: "nowrap", marginRight: "4px" }}>Advance Payment</span>
              <span style={{ whiteSpace: "nowrap" }}>−{advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Grand total */}
        <div
          style={{
            margin: "4px 4px 10px 4px",
            border: "1px dashed #000000",
            padding: "8px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#000000", fontSize: "13px", whiteSpace: "nowrap" }}>
            Grand Total
          </span>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#000000", fontSize: "15px", whiteSpace: "nowrap" }}>
            ৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Note */}
        {notes && (
          <div style={{ padding: "0 4px 6px 4px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "#000000", fontWeight: 800 }}>
              Note: {notes}
            </p>
          </div>
        )}

        {/* Dashed divider */}
        <div style={{ padding: "0 4px" }}>
          <div style={{ borderTop: "1px dashed #000000" }} />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "10px 4px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "10px", color: "#000000", fontWeight: 700 }}>
            {footerText || "Thank you for your purchase!"}
          </p>

          {/* Social links */}
          {(fbLink || igLink) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "4px" }}>
              <div style={{ borderTop: "1px dashed #000000", margin: "0 8px 6px 8px" }} />
              {fbLink && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "10px", color: "#000000", fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#000000" }}>public</span>
                  <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fbLink}</span>
                </div>
              )}
              {igLink && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "10px", color: "#000000", fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#000000" }}>photo_camera</span>
                  <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{igLink}</span>
                </div>
              )}
            </div>
          )}

          {isDemo && (
            <p style={{ fontSize: "9px", color: "#000000", fontWeight: 700, marginTop: "2px" }}>
              ✦ Demo receipt — upgrade for real invoicing
            </p>
          )}
        </div>
      </div>
    </>
  );
}