
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "⌂" },
  { name: "Products", path: "/products", icon: "▦" },
  { name: "Stock Movements", path: "/stock-movements", icon: "↕" },
  { name: "Orders", path: "/orders", icon: "▤" },
  { name: "Customers", path: "/customers", icon: "♙" },
  { name: "Suppliers", path: "/suppliers", icon: "♧" },
];

function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Invento</h1>
        <p className="mt-1 text-xs text-slate-400">
          Smart Stock & Business Management
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-indigo-600 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-5">
        <p className="text-sm font-medium">Inventory Admin</p>
        <p className="mt-1 text-xs text-slate-400">
          Management Panel
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
