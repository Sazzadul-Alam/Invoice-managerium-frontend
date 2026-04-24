import { useState, useEffect } from "react";
import {
  productApi,
  varientAttributeApi,
  ApiProduct,
  ApiUserSubscription,
  ApiShop,
} from "../auth.utils";

const API_IMAGE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.memobook.shop/api")
  .replace(/\/api\/?$/, "") + "/image/";

export function ProductManagement({
  mySub,
  shop,
}: {
  mySub: ApiUserSubscription | null;
  shop: ApiShop | null;
}) {
  const maxProducts = mySub?.planId?.maxProductsPerShop ?? 10;
  const planName = mySub?.planId?.name ?? "Free";

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [varients, setVarients] = useState<{ _id: string; name: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10;

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "A great product",
    price: "",
    stock: "",
    status: "active",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrimaryData = async (page = currentPage) => {
    try {
      const isFreePlan = planName.toLowerCase() === "free";

      const [prodRes, demoRes, varRes] = await Promise.all([
        shop?._id ? productApi.getAll(false, shop._id, page, limit) : Promise.resolve({ success: true, products: [], total: 0 }),
        (!isFreePlan && page === 1) ? productApi.getAll(true) : Promise.resolve({ success: true, products: [], total: 0 }),
        varientAttributeApi.getAll(),
      ]);

      let finalProducts: ApiProduct[] = [];
      if (prodRes.success) {
        finalProducts = [...prodRes.products];
        setTotalPages(Math.ceil((prodRes.total || 0) / limit));
        setTotalProducts(prodRes.total || 0);
      }
      
      if (demoRes.success && demoRes.products.length > 0) {
        finalProducts = [...finalProducts, ...demoRes.products];
      }

      setProducts(finalProducts);
      if (varRes.success) setVarients(varRes.attributes);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shop?._id) {
      setCurrentPage(1);
      fetchPrimaryData(1);
    }
  }, [shop?._id]);

  useEffect(() => {
    if (shop?._id) {
      fetchPrimaryData(currentPage);
    }
  }, [currentPage]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "A premium product for your collection.",
      price: "",
      stock: "",
      status: "active",
    });
    setSelectedFiles([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status,
    });
    setSelectedFiles([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      showToast("Please fill all required fields", "error");
      return;
    }
    // the required at least one image check has been removed

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("name", formData.name);
    if (shop?._id) fd.append("shopId", shop._id);
    fd.append("description", formData.description);
    fd.append("price", formData.price);
    fd.append("stock", formData.stock);
    fd.append("status", formData.status);
    selectedFiles.forEach((file) => {
      fd.append("images", file);
    });

    try {
      setModalError(null);
      if (editingProduct) {
        await productApi.update(editingProduct._id, fd);
        showToast("Product updated successfully", "success");
      } else {
        await productApi.create(fd);
        showToast("Product created successfully", "success");
      }
      setIsModalOpen(false);
      fetchPrimaryData();
    } catch (err: any) {
      setModalError(err.message || "Failed to save product");
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productApi.delete(id);
      showToast("Product deleted successfully", "success");
      fetchPrimaryData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="px-4 pt-5 pb-4 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium transition-all"
          style={{
            background: toast.type === "success" ? "var(--ds-secondary-container)" : "var(--ds-error-container)",
            color: toast.type === "success" ? "var(--ds-on-secondary-container)" : "var(--ds-on-error-container)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header - Locked/Sticky */}
      <div className="sticky top-[-20px] z-20 bg-ds-background/95 backdrop-blur-sm -mx-4 px-4 py-3 flex items-center justify-between border-b border-ds-outline-variant/30 mb-2">
        <div>
          <h2 className="text-lg font-extrabold text-ds-primary" style={{ fontFamily: "'Manrope', sans-serif" }}>
            My Products
          </h2>
          <p className="text-xs text-ds-outline">
            {totalProducts} of {maxProducts === -1 ? "∞" : maxProducts} used · {planName} plan
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-10 flex items-center gap-1.5 px-4 rounded-xl text-white font-bold text-xs active:scale-95 transition-all shadow-sm"
          style={{ background: "var(--ds-primary-container)" }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-ds-outline animate-pulse">Loading products...</div>
      ) : (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-10 text-sm text-ds-outline bg-ds-surface-container-lowest border rounded-2xl">
              No products found. Create your first one!
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product._id}
                className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-sm"
                style={{
                  background: "var(--ds-surface-container-lowest)",
                  borderColor: "var(--ds-outline-variant)",
                }}
              >
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-ds-surface-container"
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${product.images[0].image}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = API_IMAGE_URL + product.images![0].image;
                      }}
                    />
                  ) : (
                    <span className="material-symbols-outlined text-ds-outline">image</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ds-on-surface truncate">{product.name}</p>
                  {/* <p className="text-xs text-ds-outline mt-0.5">
                    {product.varient && product.varient.length > 0
                      ? `${product.varient[0].name}: ${product.varient[0].value}`
                      : typeof product.varientId === "object" && product.varientId
                        ? `${product.varientId.name}: ${product.varientId.value}`
                        : "No Variant"}
                  </p> */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold" style={{ color: "var(--ds-primary-container)" }}>
                      ৳{product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-ds-outline">
                      Stock:{" "}
                      {product.stock <= 0 ? (
                        <span className="text-red-500 font-semibold">Out</span>
                      ) : (
                        product.stock
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {product.isDemo ? (
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: "#e0f2f1", color: "#00796b" }}
                    >
                      DEMO
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: product.status === "active" ? "rgba(0,92,114,0.1)" : "var(--ds-surface-container-high)",
                        color: product.status === "active" ? "var(--ds-primary-container)" : "var(--ds-outline)",
                      }}
                    >
                      {product.status}
                    </span>
                  )}
                  {!product.isDemo && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 rounded-lg text-ds-outline hover:bg-ds-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 rounded-lg text-ds-outline hover:bg-ds-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination bar */}
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

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
            style={{ background: "var(--ds-surface-container-lowest)" }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-extrabold text-ds-on-surface text-lg">
                {editingProduct ? "Edit Product" : "New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-ds-surface-container-high text-ds-outline transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {modalError && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-ds-error-container text-ds-on-error-container text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 border border-ds-error/20">
                <span className="material-symbols-outlined text-base">error</span>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-ds-primary text-sm"
                  style={{ background: "var(--ds-surface-container-highest)", borderColor: "var(--ds-outline-variant)" }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Price</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-ds-primary text-sm"
                    style={{ background: "var(--ds-surface-container-highest)", borderColor: "var(--ds-outline-variant)" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Stock</label>
                  <input
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-ds-primary text-sm"
                    style={{ background: "var(--ds-surface-container-highest)", borderColor: "var(--ds-outline-variant)" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-ds-primary text-sm"
                  style={{ background: "var(--ds-surface-container-highest)", borderColor: "var(--ds-outline-variant)" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Images (Max 2MB per file)</label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ds-primary-container/10 file:text-ds-primary hover:file:bg-ds-primary-container/20 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border text-sm font-bold transition-all"
                  style={{ borderColor: "var(--ds-outline-variant)", color: "var(--ds-outline)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center disabled:opacity-70"
                  style={{ background: "var(--ds-primary-container)" }}
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
