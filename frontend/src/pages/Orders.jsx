
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    customer: "",
    items: [{ product: "", quantity: 1 }],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  const pageSize = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [orderData, customerData, productData] = await Promise.all([
        apiRequest("/orders"),
        apiRequest("/customers"),
        apiRequest("/products"),
      ]);

      setOrders(
        Array.isArray(orderData)
          ? orderData
          : orderData.orders || orderData.data || []
      );

      setCustomers(
        Array.isArray(customerData)
          ? customerData
          : customerData.customers || customerData.data || []
      );

      setProducts(
        Array.isArray(productData)
          ? productData
          : productData.products || productData.data || []
      );
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setForm({ ...form, items: updatedItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product: "", quantity: 1 }],
    });
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;

    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setForm({
      customer: "",
      items: [{ product: "", quantity: 1 }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        customer: form.customer,
        items: form.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
        })),
      };

      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      resetForm();
      setShowForm(false);
      setCurrentPage(1);
      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to create order.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      setError("");

      await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to update order status.");
    }
  };

  const getCustomerName = (order) => {
    if (order.customer && typeof order.customer === "object") {
      return order.customer.name || "Unknown Customer";
    }

    return (
      customers.find((c) => c._id === order.customer)?.name ||
      "Unknown Customer"
    );
  };

  const filteredOrders = orders.filter((order) => {
    const customerName = getCustomerName(order);
    const orderId = order._id || "";

    const matchesSearch = `${customerName} ${orderId} ${order.status || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const orderDate = order.createdAt
      ? new Date(order.createdAt)
      : null;

    const orderDateString = orderDate
      ? [
          orderDate.getFullYear(),
          String(orderDate.getMonth() + 1).padStart(2, "0"),
          String(orderDate.getDate()).padStart(2, "0"),
        ].join("-")
      : "";

    const matchesDate =
      !dateFilter || orderDateString === dateFilter;

    const matchesStatus =
      !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize)
  );

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const statusClass = (status) => {
    const classes = {
      draft: "bg-slate-100 text-slate-700",
      confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-indigo-100 text-indigo-700",
      dispatched: "bg-amber-100 text-amber-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };

    return classes[status] || "bg-slate-100 text-slate-700";
  };

  const getNextStatus = (status) => {
    const next = {
      draft: "confirmed",
      confirmed: "packed",
      packed: "dispatched",
      dispatched: "delivered",
    };

    return next[status];
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer orders and order status.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setError("");
            setShowForm(true);
          }}
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Create Order
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer, order ID..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        {(search || dateFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setStatusFilter("");
              setCurrentPage(1);
            }}
            className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Clear All Filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const nextStatus = getNextStatus(order.status);

                  return (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getCustomerName(order)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {Number(
                          order.totalAmount || order.total || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}
                        >
                          {order.status || "draft"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {nextStatus && (
                            <button
                              onClick={() =>
                                updateStatus(order._id, nextStatus)
                              }
                              className="font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {nextStatus.charAt(0).toUpperCase() +
                                nextStatus.slice(1)}
                            </button>
                          )}

                          {["draft", "confirmed", "packed"].includes(
                            order.status
                          ) && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to cancel this order?"
                                  )
                                ) {
                                  updateStatus(order._id, "cancelled");
                                }
                              }}
                              className="font-medium text-red-600 hover:text-red-800"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing {startIndex + 1}–
              {Math.min(startIndex + pageSize, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Order
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer
                </label>

                <select
                  value={form.customer}
                  onChange={(e) =>
                    setForm({ ...form, customer: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Order Products
                  </label>

                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row"
                    >
                      <select
                        value={item.product}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "product",
                            e.target.value
                          )
                        }
                        required
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.stockQuantity} in stock)
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm sm:w-28"
                        placeholder="Quantity"
                      />

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                        className="text-sm font-medium text-red-600 disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  customers.length === 0 ||
                  products.length === 0
                }
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Creating Order..." : "Create Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
