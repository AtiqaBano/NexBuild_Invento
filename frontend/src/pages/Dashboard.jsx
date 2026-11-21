
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    suppliers: 0,
    lowStock: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const [productData, customerData, supplierData, orderData] =
          await Promise.all([
            apiRequest("/products"),
            apiRequest("/customers"),
            apiRequest("/suppliers"),
            apiRequest("/orders"),
          ]);

        const products = getList(productData, "products");
        const customers = getList(customerData, "customers");
        const suppliers = getList(supplierData, "suppliers");
        const orders = getList(orderData, "orders");

        const lowStockProducts = products.filter(
          (product) =>
            Number(product.stockQuantity) <=
            Number(product.lowStockThreshold)
        );

        setStats({
          products: products.length,
          customers: customers.length,
          suppliers: suppliers.length,
          lowStock: lowStockProducts.length,
        });

        const sortedOrders = [...orders].sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setRecentOrders(sortedOrders.slice(0, 5));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards = [
    { title: "Total Products", value: stats.products, icon: "▦" },
    { title: "Total Customers", value: stats.customers, icon: "♙" },
    { title: "Total Suppliers", value: stats.suppliers, icon: "♧" },
    { title: "Low Stock Items", value: stats.lowStock, icon: "!" },
  ];

  const getCustomerName = (customer) => {
    if (typeof customer === "object" && customer !== null) {
      return customer.name || "Unknown Customer";
    }
    return "Customer";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xl font-bold text-indigo-600">
                {card.icon}
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your latest order activity
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading orders...</p>
        ) : recentOrders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No orders available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="text-slate-700">
                    <td className="px-6 py-4 font-medium">
                      {getCustomerName(order.customer)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {Number(order.totalAmount ?? order.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
                        {order.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
