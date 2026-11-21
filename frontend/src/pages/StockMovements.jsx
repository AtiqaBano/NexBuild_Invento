
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    reason: "",
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const productData = await apiRequest("/products");

      const productList = Array.isArray(productData)
        ? productData
        : productData.products || productData.data || [];

      setProducts(productList);

      const historyResults = await Promise.all(
        productList.map((product) =>
          apiRequest(`/stock-movements/${product._id}`)
        )
      );

      const allMovements = historyResults.flatMap((result) =>
        result.history || []
      );

      setMovements(
        allMovements.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch (err) {
      setError(err.message || "Failed to load stock movements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await apiRequest("/stock-movements/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          quantity: Number(form.quantity),
          reason: form.reason.trim(),
        }),
      });

      setForm({
        productId: "",
        type: "IN",
        quantity: "",
        reason: "",
      });

      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to adjust stock.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMovements = movements.filter((movement) => {
    const productName =
      movement.product?.name || "Unknown Product";

    return `${productName} ${movement.type} ${movement.reason || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Stock Movements
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record and track inventory stock changes.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Adjust Stock
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Product
            </label>
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.stockQuantity} in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Movement Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="Enter quantity"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Enter reason"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || products.length === 0}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Adjust Stock"}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product or movement type..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    Loading movements...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {movement.product?.name || "Unknown Product"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          movement.type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {movement.type}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {movement.quantity}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {movement.reason || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {movement.createdAt
                        ? new Date(movement.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StockMovements;
