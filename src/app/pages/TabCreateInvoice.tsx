import { useState, useEffect, useMemo } from "react";
import { type ApiShop, type ApiProduct, productApi, invoiceApi } from "../auth.utils";
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

export function TabCreateInvoice({ shop }: { shop: ApiShop | null }) {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [cart, setCart] = useState<{ product: ApiProduct; quantity: number }[]>([]);
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (shop) {
      setLoadingProducts(true);
      productApi.getAll(false, shop._id).then(res => {
        setProducts(res.products || []);
        setLoadingProducts(false);
      }).catch(() => {
        setLoadingProducts(false);
      });
    }
  }, [shop]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const addToCart = (product: ApiProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery("");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product._id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product._id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleCreate = async (triggerPrint = false) => {
    if (!shop) return;
    if (cart.length === 0) {
      showToast("Add at least one product to the invoice.", "error");
      return;
    }
    setSaving(true);
    let success = false;
    try {
      const items = cart.map(c => {
        let name = c.product.name;
        if (typeof c.product.varientId === 'object' && c.product.varientId) {
          name += ` • ${c.product.varientId.name}: ${c.product.varientId.value}`;
        }
        return {
          name,
          quantity: c.quantity,
          unitPrice: c.product.price,
        };
      });
      
      await invoiceApi.createInvoice(shop._id, {
        customerName, customerPhone, customerEmail, customerAddress, 
        items, discountType, discount: discountValue, notes,
        status: triggerPrint ? "printed" : "issued"
      });

      showToast("Invoice created successfully!", "success");
      success = true;
    } catch (err: any) {
      showToast(err.message || "Failed to create invoice", "error");
    } finally {
      setSaving(false);
      if (success) {
        if (triggerPrint) {
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); setDiscountValue(0); setNotes("");
            }, 1000);
          }, 300);
        } else {
          setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); setDiscountValue(0); setNotes("");
        }
      }
    }
  };

  if (!shop) return <div className="p-5 text-center text-ds-outline">No shop selected</div>;

  return (
    <>
    <div className="px-4 pt-5 pb-4 space-y-6 print:hidden">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium w-[90%] max-w-sm animate-in"
          style={{
            background: toast.type === "success" ? "var(--ds-secondary-container)" : "var(--ds-error-container)",
            color: toast.type === "success" ? "var(--ds-on-secondary-container)" : "var(--ds-on-error-container)",
          }}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Create Invoice
        </h2>
        <p className="text-xs text-ds-outline">Draft a new invoice for your customer</p>
      </div>

      {/* Customer Area */}
      <div className="space-y-4 rounded-xl border p-4 bg-ds-surface-container-lowest" style={{ borderColor: 'var(--ds-outline-variant)' }}>
        <h3 className="text-sm font-bold text-ds-primary tracking-wide mb-2 uppercase">Customer Info</h3>
        <div className="grid grid-cols-2 gap-3">
           <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Name</label>
             <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
           </div>
           <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Phone</label>
             <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
           </div>
           <div className="col-span-2">
             <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Email (Optional)</label>
             <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
           </div>
           <div className="col-span-2">
             <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Address (Optional)</label>
             <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 Main St, Dhaka" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
           </div>
        </div>
      </div>

      {/* Cart & Products */}
      <div className="space-y-4 rounded-xl border p-4 bg-ds-surface-container-lowest" style={{ borderColor: 'var(--ds-outline-variant)' }}>
        <h3 className="text-sm font-bold text-ds-primary tracking-wide mb-2 uppercase">Products</h3>
        
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-ds-outline text-lg pointer-events-none">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-ds-surface-container-low border border-ds-outline-variant rounded-xl focus:outline-none text-sm focus:border-ds-primary-container"
          />
          {searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-ds-outline-variant rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-xs text-center text-ds-outline">No products found</div>
              ) : (
                filteredProducts.map(p => {
                  const variantInfo = typeof p.varientId === 'object' && p.varientId ? ` • ${p.varientId.name}: ${p.varientId.value}` : "";
                  return (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-ds-surface-container-high transition-colors flex justify-between items-center"
                    >
                      <div className="truncate max-w-[75%]">
                        <span className="font-medium text-ds-on-surface">{p.name}</span>
                        {variantInfo && <span className="text-ds-outline text-xs">{variantInfo}</span>}
                      </div>
                      <span className="text-ds-primary font-bold text-xs shrink-0">৳{p.price}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Products */}
        {cart.length > 0 && (
          <div className="space-y-2 mt-4 max-h-64 overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.product._id} className="flex justify-between items-center p-3 border border-ds-outline-variant rounded-xl bg-ds-surface-container-low">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold truncate text-ds-on-surface">
                    {item.product.name}
                    {typeof item.product.varientId === 'object' && item.product.varientId && (
                      <span className="text-red-600 font-bold"> • {item.product.varientId.name}: {item.product.varientId.value}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-ds-outline">৳{item.product.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-1 rounded bg-ds-outline/10"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="p-1 rounded bg-ds-outline/10"><span className="material-symbols-outlined text-[14px]">add</span></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calculations & Notes */}
      <div className="space-y-4 rounded-xl border p-4 bg-ds-surface-container-lowest" style={{ borderColor: 'var(--ds-outline-variant)' }}>
        
        <div className="flex items-center justify-between">
           <span className="text-sm font-semibold text-ds-on-surface-variant">Subtotal</span>
           <span className="text-sm font-bold text-ds-on-surface">৳{subtotal.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
           <div className="flex items-center justify-between">
             <span className="text-sm font-semibold text-ds-on-surface-variant">Discount</span>
             <div className="flex gap-2">
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "flat" | "percentage")} className="text-xs border border-ds-outline-variant rounded-lg bg-ds-surface-container-low px-2 py-1 outline-none">
                  <option value="flat">Flat (৳)</option>
                  <option value="percentage">%</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-16 text-right border border-ds-outline-variant rounded-lg text-sm px-2 py-1 outline-none bg-ds-surface-container-low"
                />
             </div>
           </div>
           {discountValue > 0 && (
             <div className="flex justify-end">
               <span className="text-xs text-ds-error font-medium">- ৳{discountAmount.toFixed(2)}</span>
             </div>
           )}
        </div>

        <div className="border-t border-ds-outline-variant pt-3 flex items-center justify-between">
           <span className="text-sm font-bold uppercase text-ds-primary tracking-widest">Grand Total</span>
           <span className="text-lg font-extrabold text-ds-primary">৳{grandTotal.toFixed(2)}</span>
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thank you for your business!"
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button 
           onClick={() => setPreviewOpen(true)}
           className="flex-[1] py-3.5 rounded-xl border border-ds-outline-variant text-ds-on-surface font-semibold text-sm active:scale-95 transition-transform"
        >
           Preview 
        </button>
        <button 
           onClick={() => handleCreate(false)}
           disabled={saving}
           className="flex-[1.5] py-3.5 rounded-xl border border-ds-primary text-ds-primary font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center"
        >
           {saving ? "Saving..." : "Save"}
        </button>
        <button 
           onClick={() => handleCreate(true)}
           disabled={saving}
           className="flex-[1.5] py-3.5 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center gap-2"
           style={{ background: "var(--ds-primary)" }}
        >
          {saving ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">print</span>}
          {saving ? "Saving..." : "Print"}
        </button>
      </div>
      
      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-ds-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-ds-outline-variant bg-ds-surface-container-lowest">
              <h2 className="text-lg font-bold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>Invoice Preview</h2>
              <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-full hover:bg-ds-surface-container-high transition-colors text-ds-on-surface">
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
                  invNumber={"INV-[AUTO]"}
                  invDate={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  customerName={customerName || "Walk-in Customer"}
                  customerPhone={customerPhone}
                  items={cart.map(c => ({ name: c.product.name, qty: c.quantity, price: c.product.price }))}
                  subtotal={subtotal}
                  discount={discountAmount}
                  grandTotal={grandTotal}
                  notes={notes}
               />
            </div>

            <div className="p-4 border-t border-ds-outline-variant bg-ds-surface-container-lowest flex gap-3">
               <button 
                 onClick={() => { handleCreate(false); setPreviewOpen(false); }}
                 disabled={saving || cart.length === 0}
                 className="flex-[1] py-3 rounded-xl border border-ds-primary text-ds-primary font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center"
               >
                 Save
               </button>
               <button 
                 onClick={() => { handleCreate(true); setPreviewOpen(false); }}
                 disabled={saving || cart.length === 0}
                 className="flex-[1.5] py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center gap-2"
                 style={{ background: "var(--ds-primary)" }}
               >
                 <span className="material-symbols-outlined text-[18px]">print</span>
                 Print
               </button>
             </div>
          </div>
        </div>
      )}
    </div>

    {/* ── Hidden Printable Invoice Template ── */}
    <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-0 m-0 w-full min-h-screen">
      <div className="max-w-xl mx-auto align-top">
         <InvoiceTemplate
            shopName={shop.name}
            shopAddress={formatAddress(shop.address)}
            shopPhone={shop.contactNumber || ""}
            fbLink={shop.socialLinks?.facebook || ""}
            igLink={shop.socialLinks?.instagram || ""}
            footerText={shop.receiptConfig?.footerText || "Thank you for your purchase!"}
            invNumber={"INV-[AUTO]"}
            invDate={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            customerName={customerName || "Walk-in Customer"}
            customerPhone={customerPhone}
            items={cart.map(c => ({ name: c.product.name, qty: c.quantity, price: c.product.price }))}
            subtotal={subtotal}
            discount={discountAmount}
            grandTotal={grandTotal}
            notes={notes}
         />
      </div>
    </div>
    </>
  );
}
