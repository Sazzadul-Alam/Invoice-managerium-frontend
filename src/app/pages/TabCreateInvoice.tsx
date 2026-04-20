import { useState, useEffect, useMemo } from "react";
import { type ApiShop, type ApiInvoice, invoiceApi, type ApiProduct, productApi } from "../auth.utils";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { InvoiceWrapper } from "../components/InvoiceWrapper";

function formatAddress(addr: ApiShop["address"]): string {
  return addr?.address_line1 || "";
}

export function TabCreateInvoice({
  shop,
  editInvoice,
  onCancelEdit
}: {
  shop: ApiShop | null;
  editInvoice?: any;
  onCancelEdit?: () => void;
}) {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const getLocalYYYYMMDD = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };
  const [invoiceDate, setInvoiceDate] = useState(getLocalYYYYMMDD());

  const [cart, setCart] = useState<{ cartItemId: string; product: ApiProduct; quantity: number; variety?: string }[]>([]);
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [isDeliveryPaid, setIsDeliveryPaid] = useState(false);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<ApiInvoice | null>(null);
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

  useEffect(() => {
    if (editInvoice) {
      setCustomerName(editInvoice.customerName || "");
      setCustomerPhone(editInvoice.customerPhone || "");
      setCustomerEmail(editInvoice.customerEmail || "");
      setCustomerAddress(editInvoice.customerAddress || "");
      setInvoiceDate(new Date(editInvoice.invoiceDate || editInvoice.createdAt).toISOString().split('T')[0]);
      setDiscountType(editInvoice.discountType || "flat");
      setDiscountValue(editInvoice.discount || 0);
      setAdvanceAmount(editInvoice.advanceAmount || 0);
      setDeliveryCharge(editInvoice.deliveryCharge || 0);
      setIsDeliveryPaid(editInvoice.isDeliveryPaid || false);
      setNotes(editInvoice.notes || "");

      const newCart = editInvoice.items.map((it: any) => {
        // Try to find matching product or create dummy
        const found = products.find(p => p.name === it.name.split(' (')[0]);
        return {
          cartItemId: Math.random().toString(36).substring(2, 9),
          product: found || { _id: 'manual', name: it.name, price: it.unitPrice } as ApiProduct,
          quantity: it.quantity,
          variety: it.name.includes('(') ? it.name.match(/\(([^)]+)\)/)?.[1] : undefined
        };
      });
      setCart(newCart);
    }
  }, [editInvoice, products]);

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
    setCart((prev) => [
      ...prev,
      { cartItemId: Math.random().toString(36).substring(2, 9), product, quantity: 1, variety: "M" }
    ]);
    setSearchQuery("");
  };

  const updateVariety = (cartItemId: string, variety: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, variety } : item))
    );
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
      );
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  // Only add delivery charge to grand total if it's NOT paid yet
  const effectiveDeliveryCharge = isDeliveryPaid ? 0 : deliveryCharge;
  const grandTotal = Math.max(0, subtotal - discountAmount + effectiveDeliveryCharge - advanceAmount);

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
        if (c.variety) {
          name += ` (${c.variety})`;
        }
        return {
          name,
          quantity: c.quantity,
          unitPrice: c.product.price,
        };
      });

      let finalDateStr;
      if (invoiceDate) {
        const [y, m, d] = invoiceDate.split('-').map(Number);
        if (editInvoice && editInvoice.createdAt) {
          const original = new Date(editInvoice.createdAt);
          original.setFullYear(y, m - 1, d);
          finalDateStr = original.toISOString();
        } else {
          const now = new Date();
          now.setFullYear(y, m - 1, d);
          finalDateStr = now.toISOString();
        }
      }

      const payload = {
        customerName, customerPhone, customerEmail, customerAddress,
        items, discountType, discount: discountValue, advanceAmount, deliveryCharge, isDeliveryPaid, notes,
        status: triggerPrint ? "printed" : "issued",
        date: finalDateStr,
      };

      if (editInvoice) {
        const res = await invoiceApi.updateInvoice(shop._id, editInvoice._id, payload);
        setLastSavedInvoice(res.invoice);
        showToast("Invoice updated successfully!", "success");
      } else {
        const res = await invoiceApi.createInvoice(shop._id, payload);
        setLastSavedInvoice(res.invoice);
        showToast("Invoice created successfully!", "success");
      }
      success = true;
    } catch (err: any) {
      showToast(err.message || "Failed to create invoice", "error");
    } finally {
      if (success) {
        setSaving(false);
        if (triggerPrint) {
          // Wait a bit longer for React to render the new ID into the hidden print template
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); setDiscountValue(0); setAdvanceAmount(0); setNotes("");
              setLastSavedInvoice(null);
              if (onCancelEdit) onCancelEdit();
            }, 1000);
          }, 500); 
        } else {
          setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); setDiscountValue(0); setAdvanceAmount(0); setNotes("");
          if (onCancelEdit) onCancelEdit();
        }
      } else {
        setSaving(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {editInvoice ? "Edit Invoice" : "Create Invoice"}
            </h2>
            <p className="text-xs text-ds-outline">
              {editInvoice ? `Modifying #${editInvoice.invoiceNumber}` : "Draft a new invoice for your customer"}
            </p>
          </div>
          {editInvoice && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 rounded-lg border border-ds-outline text-ds-outline text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Customer & Invoice Area */}
        <div className="space-y-4 rounded-xl border p-4 bg-ds-surface-container-lowest" style={{ borderColor: 'var(--ds-outline-variant)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-ds-primary tracking-wide uppercase">Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2 border-b border-ds-outline-variant/50">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Invoice Date</label>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ds-surface-container-low border border-ds-outline-variant focus-within:border-ds-primary-container transition-all">
                <span className="material-symbols-outlined text-[18px] text-ds-primary">calendar_today</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full text-sm font-bold bg-transparent outline-none text-ds-on-surface"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Customer Phone</label>
              <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Customer Email (Optional)</label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="example@mail.com" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Customer Address</label>
              <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="e.g. 123 Street, Dhaka" className="w-full rounded-lg border px-3 py-2 text-sm bg-ds-surface-container-low border-ds-outline-variant focus:outline-none focus:border-ds-primary-container" />
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
            <div className="space-y-2 mt-4">
              {cart.map(item => (
              <div key={item.cartItemId} className="flex items-center p-2.5 border border-ds-outline-variant/60 rounded-xl bg-ds-surface-container-lowest hover:border-ds-primary/20 transition-colors">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[12px] font-bold truncate text-ds-on-surface flex items-center gap-1.5">
                    {item.product.name}
                    {typeof item.product.varientId === 'object' && item.product.varientId && (
                      <span className="text-[10px] font-black text-red-600 bg-red-50 px-1 rounded">
                        {item.product.varientId.value}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-ds-outline font-medium">৳{item.product.price} each</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select 
                      value={item.variety || "M"} 
                      onChange={(e) => updateVariety(item.cartItemId, e.target.value)}
                      className="appearance-none text-[10px] font-bold bg-ds-surface-container-low text-ds-on-surface border border-ds-outline-variant/50 rounded-lg pl-2 pr-6 py-1.5 outline-none focus:border-ds-primary/30 transition-all cursor-pointer"
                    >
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-ds-outline">unfold_more</span>
                  </div>
                  
                  <div className="flex items-center bg-ds-surface-container-low border border-ds-outline-variant/50 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} 
                      className="p-1 rounded-md hover:bg-ds-surface-container-high text-ds-outline active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[14px]">remove</span>
                    </button>
                    <span className="text-[11px] font-extrabold w-5 text-center text-ds-on-surface">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                      className="p-1 rounded-md hover:bg-ds-surface-container-high text-ds-primary active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
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
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "flat" | "percentage")} className="text-xs border border-ds-outline-variant rounded-lg bg-ds-surface-container-low px-2 py-1.5 outline-none focus:border-ds-primary-container">
                  <option value="flat">Flat (৳)</option>
                  <option value="percentage">%</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 text-right border border-ds-outline-variant rounded-lg text-sm px-2 py-1.5 outline-none bg-ds-surface-container-low focus:border-ds-primary-container"
                />
              </div>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-end">
                <span className="text-xs text-ds-error font-medium">- ৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ds-on-surface-variant">
               Delivery Charge
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeliveryPaid}
                  onChange={(e) => setIsDeliveryPaid(e.target.checked)}
                  className="w-4 h-4 rounded-full border-ds-outline-variant text-ds-primary focus:ring-ds-primary cursor-pointer"
                  style={{ borderRadius: "50%" }}
                />
                <span className="text-[11px] font-bold text-ds-outline uppercase tracking-wider select-none">Paid</span>
              </label>
              
              {isDeliveryPaid ? (
                <input
                  type="text"
                  value="PAID"
                  disabled
                  className="w-20 text-center border border-ds-outline-variant rounded-lg text-sm px-2 py-1.5 bg-ds-surface-container-low text-green-600 font-bold uppercase tracking-wider select-none"
                />
              ) : (
                <input
                  type="number"
                  min="0"
                  value={deliveryCharge || ""}
                  onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 text-right border border-ds-outline-variant rounded-lg text-sm px-2 py-1.5 outline-none bg-ds-surface-container-low focus:border-ds-primary-container"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ds-on-surface-variant">Advance Payment</span>
            <input
              type="number"
              min="0"
              value={advanceAmount || ""}
              onChange={(e) => setAdvanceAmount(Number(e.target.value))}
              placeholder="0"
              className="w-20 text-right border border-ds-outline-variant rounded-lg text-sm px-2 py-1.5 outline-none bg-ds-surface-container-low focus:border-ds-primary-container"
            />
          </div>

          <div className="border-t border-ds-outline-variant pt-4 flex items-center justify-between">
            <span className="text-sm font-black text-ds-primary uppercase tracking-wider">Grand Total</span>
            <span className="text-xl font-black text-ds-primary">৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>


          <div className="pt-2">
            <label className="block text-[10px] font-bold uppercase text-ds-outline mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thank you for your purchase!"
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
            {saving ? "Saving..." : (editInvoice ? "Update" : "Save")}
          </button>
          <button
            onClick={() => handleCreate(true)}
            disabled={saving}
            className="flex-[1.5] py-3.5 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center gap-2"
            style={{ background: "var(--ds-primary)" }}
          >
            {saving ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">print</span>}
            {saving ? "Saving..." : (editInvoice ? "Update & Print" : "Print")}
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
                {/* Use Wrapper for Preview to maintain logic consistency */}
                <InvoiceWrapper 
                  shop={shop}
                  invoice={{
                    _id: "preview",
                    invoiceNumber: editInvoice ? editInvoice.invoiceNumber : "INV-[AUTO]",
                    invoiceDate: invoiceDate,
                    createdAt: new Date().toISOString(),
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress,
                    items: cart.map(c => ({ name: c.variety ? `${c.product.name} (${c.variety})` : c.product.name, quantity: c.quantity, unitPrice: c.product.price })),
                    subtotal,
                    discountAmount,
                    advanceAmount,
                    deliveryCharge,
                    isDeliveryPaid,
                    grandTotal,
                    notes,
                    status: "draft"
                  } as any}
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
      <div className="hidden print:block absolute top-0 left-0 z-[99999] bg-white text-black p-0 m-0 w-full h-auto">
        <div className="max-w-xl mx-auto align-top">
          {/* Priority: Use lastSavedInvoice (real ID) if available, otherwise fallback to current state */}
          <InvoiceWrapper 
            shop={shop}
            invoice={lastSavedInvoice || ({
              invoiceNumber: editInvoice ? editInvoice.invoiceNumber : "INV-[AUTO]",
              invoiceDate: invoiceDate,
              createdAt: new Date().toISOString(),
              customerName,
              customerPhone,
              customerEmail,
              customerAddress,
              items: cart.map(c => ({ name: c.variety ? `${c.product.name} (${c.variety})` : c.product.name, quantity: c.quantity, unitPrice: c.product.price })),
              subtotal,
              discountAmount,
              advanceAmount,
              deliveryCharge,
              isDeliveryPaid,
              grandTotal,
              notes,
            } as any)}
            noShadow
          />
        </div>
      </div>
    </>
  );
}
