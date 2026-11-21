
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

const initialForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stockQuantity: "",
  lowStockThreshold: "",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/products");
      const list = Array.isArray(data)
        ? data
        : data.products || data.data || [];

      setProducts(list);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const isLowStock = (product) =>
    Number(product.stockQuantity) <=
    Number(product.lowStockThreshold);

  const lowStockProducts = products.filter(isLowStock);

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (product) => {
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      price: product.price ?? "",
      stockQuantity: product.stockQuantity ?? "",
      lowStockThreshold: product.lowStockThreshold ?? "",
    });

    setEditingId(product._id);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        const { stockQuantity, ...productData } = form;

        const payload = {
          ...productData,
          price: Number(form.price),
          lowStockThreshold: Number(form.lowStockThreshold),
        };

        await apiRequest(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          ...form,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          lowStockThreshold: Number(form.lowStockThreshold),
        };

        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
      await fetchProducts();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(`/products/${id}`, {
        method: "DELETE",
      });

      await fetchProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  };

  const exportLowStockCSV = () => {
    if (lowStockProducts.length === 0) return;

    const headers = [
      "Product Name",
      "SKU",
      "Price",
      "Stock Quantity",
      "Low Stock Threshold",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = lowStockProducts.map((product) => [
      product.name,
      product.sku,
      product.price,
      product.stockQuantity,
      product.lowStockThreshold,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "low-stock-products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your inventory products.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Low Stock Section */}
      <div className="mb-6 overflow-hidden rounded-xl border border-red-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Low Stock Products
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Products that have reached their low-stock threshold.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {lowStockProducts.length} Products
            </span>

            <button
              onClick={exportLowStockCSV}
              disabled={lowStockProducts.length === 0 || loading}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Available Stock</th>
                <th className="px-5 py-3 font-semibold">Threshold</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-6 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-6 text-center text-slate-500">
                    No low-stock products. All stock levels are healthy.
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.sku}
                    </td>
                    <td className="px-5 py-4 font-semibold text-red-600">
                      {product.stockQuantity}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.lowStockThreshold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Search */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or SKU..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">SKU</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Stock</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.sku}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.stockQuantity}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isLowStock(product)
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLowStock(product) ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditForm(product)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "name", label: "Product Name", type: "text" },
                { name: "sku", label: "SKU", type: "text" },
                { name: "description", label: "Description", type: "text" },
                { name: "price", label: "Price", type: "number" },
                { name: "stockQuantity", label: "Stock Quantity", type: "number" },
                {
                  name: "lowStockThreshold",
                  label: "Low Stock Threshold",
                  type: "number",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>

                  <input
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    min={field.type === "number" ? "0" : undefined}
                    required={field.name !== "description"}
                    disabled={editingId && field.name === "stockQuantity"}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  />

                  {editingId && field.name === "stockQuantity" && (
                    <p className="mt-1 text-xs text-slate-500">
                      Update stock from the Stock Movements page.
                    </p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
