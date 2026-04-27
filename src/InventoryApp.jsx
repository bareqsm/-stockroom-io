import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingDown,
  Boxes,
  Moon,
  Sun,
  X,
  Filter,
  FileSpreadsheet,
  LayoutDashboard,
  ShoppingBag,
  Check,
  Info,
} from "lucide-react";

// ---------- Helpers ----------
const daysUntil = (dateStr) => {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);

const fmtNum = (n) => new Intl.NumberFormat("en-US").format(Number(n) || 0);

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const STORAGE_KEY = "inventory:products:v1";
const THEME_KEY = "inventory:theme:v1";

// ---------- Seed Data ----------
const seedProducts = [
  {
    id: uid(),
    name: "Organic Whole Milk",
    sku: "DRY-001",
    category: "Dairy",
    quantity: 48,
    unitCost: 2.85,
    expirationDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    supplier: "Valley Farms Co.",
    notes: "Keep refrigerated below 4°C",
  },
  {
    id: uid(),
    name: "Artisan Sourdough Bread",
    sku: "BKY-014",
    category: "Bakery",
    quantity: 12,
    unitCost: 4.5,
    expirationDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    supplier: "Stone Oven Bakery",
    notes: "Daily delivery",
  },
  {
    id: uid(),
    name: "Premium Dark Roast Coffee 12oz",
    sku: "BEV-203",
    category: "Beverages",
    quantity: 6,
    unitCost: 12.75,
    expirationDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    supplier: "Highland Roasters",
    notes: "Low stock — reorder soon",
  },
  {
    id: uid(),
    name: "Extra Virgin Olive Oil 500ml",
    sku: "PNT-077",
    category: "Pantry",
    quantity: 34,
    unitCost: 8.9,
    expirationDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    supplier: "Mediterranean Imports",
    notes: "",
  },
  {
    id: uid(),
    name: "Greek Yogurt 500g",
    sku: "DRY-042",
    category: "Dairy",
    quantity: 4,
    unitCost: 3.4,
    expirationDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    supplier: "Valley Farms Co.",
    notes: "Expired — remove from shelf",
  },
  {
    id: uid(),
    name: "Aged Cheddar Wheel",
    sku: "DRY-091",
    category: "Dairy",
    quantity: 9,
    unitCost: 18.2,
    expirationDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    supplier: "Copper Creek Dairy",
    notes: "",
  },
];

// ---------- Main Component ----------
export default function InventoryApp() {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ---------- Load from localStorage ----------
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEY);

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(seedProducts);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts(seedProducts);
    }

    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark") {
        setDark(true);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }

    setLoaded(true);
  }, []);

  // ---------- Persist products ----------
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error("Failed to save products:", error);
    }
  }, [products, loaded]);

  // ---------- Persist theme ----------
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [dark, loaded]);

  // ---------- Toast ----------
  const flash = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  };

  // ---------- Derived ----------
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const getStatus = (p) => {
    const d = daysUntil(p.expirationDate);
    if (p.expirationDate && d < 0) return "expired";
    if (p.expirationDate && d <= 7) return "expiring";
    if (Number(p.quantity) <= 10) return "low";
    return "ok";
  };

  const stats = useMemo(() => {
    const totalValue = products.reduce(
      (s, p) => s + Number(p.quantity || 0) * Number(p.unitCost || 0),
      0
    );
    const totalUnits = products.reduce(
      (s, p) => s + Number(p.quantity || 0),
      0
    );
    const expired = products.filter((p) => getStatus(p) === "expired").length;
    const expiring = products.filter((p) => getStatus(p) === "expiring").length;
    const low = products.filter(
      (p) => getStatus(p) === "low" || getStatus(p) === "expiring"
    ).length;
    const lowOnly = products.filter((p) => Number(p.quantity || 0) <= 10).length;
    return {
      totalProducts: products.length,
      totalValue,
      totalUnits,
      expired,
      expiring,
      low,
      lowOnly,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const hay =
          `${p.name} ${p.sku} ${p.category} ${p.supplier} ${p.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      if (statusFilter !== "all") {
        const s = getStatus(p);
        if (statusFilter === "low" && s !== "low" && s !== "expiring")
          return false;
        if (statusFilter === "expired" && s !== "expired") return false;
        if (statusFilter === "expiring" && s !== "expiring") return false;
        if (statusFilter === "ok" && s !== "ok") return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // ---------- CRUD ----------
  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setModalOpen(true);
  };
  const handleSave = (data) => {
    if (editing) {
      setProducts((ps) => ps.map((p) => (p.id === editing.id ? { ...p, ...data } : p)));
      flash("Product updated");
    } else {
      setProducts((ps) => [{ id: uid(), ...data }, ...ps]);
      flash("Product added");
    }
    setModalOpen(false);
    setEditing(null);
  };
  const handleDelete = (id) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    setConfirmDelete(null);
    flash("Product deleted", "danger");
  };
  const adjustQty = (id, delta) => {
    setProducts((ps) =>
      ps.map((p) =>
        p.id === id
          ? { ...p, quantity: Math.max(0, Number(p.quantity || 0) + delta) }
          : p
      )
    );
  };

  // ---------- Excel Export ----------
  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = products.map((p) => ({
        Name: p.name,
        "SKU / Barcode": p.sku,
        Category: p.category,
        Quantity: Number(p.quantity || 0),
        "Unit Cost": Number(p.unitCost || 0),
        "Total Cost": Number(p.quantity || 0) * Number(p.unitCost || 0),
        "Expiration Date": p.expirationDate || "",
        "Days Until Expiry": p.expirationDate ? daysUntil(p.expirationDate) : "",
        Status: getStatus(p),
        Supplier: p.supplier || "",
        Notes: p.notes || "",
      }));
      rows.push({});
      rows.push({
        Name: "TOTALS",
        Quantity: stats.totalUnits,
        "Total Cost": stats.totalValue,
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
        { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
        { wch: 12 }, { wch: 22 }, { wch: 30 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");

      const meta = [
        ["Store Inventory Report"],
        ["Generated by", "Bareq Mohaisen — Inventory Manager"],
        ["Date", new Date().toLocaleString()],
        [],
        ["Total Products", stats.totalProducts],
        ["Total Units in Stock", stats.totalUnits],
        ["Total Inventory Value", stats.totalValue],
        ["Expired Items", stats.expired],
        ["Expiring Soon (≤7 days)", stats.expiring],
        ["Low Stock Items (≤10)", stats.lowOnly],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet(meta);
      wsMeta["!cols"] = [{ wch: 28 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsMeta, "Summary");

      XLSX.writeFile(wb, `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`);
      flash("Exported to Excel");
    } catch (e) {
      flash("Export failed", "danger");
    }
  };

  // ---------- Excel Import ----------
  const importExcel = async (file) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const imported = rows
        .filter((r) => r.Name || r.name)
        .map((r) => ({
          id: uid(),
          name: r.Name || r.name || "",
          sku: r["SKU / Barcode"] || r.SKU || r.sku || "",
          category: r.Category || r.category || "Uncategorized",
          quantity: Number(r.Quantity || r.quantity || 0),
          unitCost: Number(r["Unit Cost"] || r.unitCost || 0),
          expirationDate: r["Expiration Date"] || r.expirationDate || "",
          supplier: r.Supplier || r.supplier || "",
          notes: r.Notes || r.notes || "",
        }));
      if (!imported.length) {
        flash("No valid rows found", "danger");
        return;
      }
      setProducts((ps) => [...imported, ...ps]);
      flash(`Imported ${imported.length} products`);
    } catch {
      flash("Import failed", "danger");
    }
  };

  // ---------- Styles ----------
  const C = dark
    ? {
        bg: "bg-stone-950",
        panel: "bg-stone-900",
        panel2: "bg-stone-900/60",
        border: "border-stone-800",
        text: "text-stone-100",
        dim: "text-stone-400",
        dim2: "text-stone-500",
        input:
          "bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-600",
        hover: "hover:bg-stone-800/60",
        subtle: "bg-stone-800/40",
      }
    : {
        bg: "bg-stone-50",
        panel: "bg-white",
        panel2: "bg-white",
        border: "border-stone-200",
        text: "text-stone-900",
        dim: "text-stone-600",
        dim2: "text-stone-500",
        input:
          "bg-white border-stone-300 text-stone-900 placeholder:text-stone-400",
        hover: "hover:bg-stone-100",
        subtle: "bg-stone-100",
      };

  if (!loaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${C.bg} ${C.text}`}>
        <div className="animate-pulse text-sm tracking-wider uppercase">
          Loading inventory…
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${C.bg} ${C.text} font-sans`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; font-feature-settings: 'ss01'; }
        .font-sans { font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Header */}
      <header className={`border-b ${C.border} sticky top-0 z-30 backdrop-blur ${dark ? "bg-stone-950/80" : "bg-stone-50/80"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${dark ? "bg-amber-500" : "bg-stone-900"} flex items-center justify-center`}>
              <Boxes className={dark ? "text-stone-950" : "text-amber-400"} size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-display text-xl leading-none tracking-tight">
                Stockroom<span className="italic font-light"> / io</span>
              </div>
              <div className={`text-[10px] uppercase tracking-[0.18em] ${C.dim2} mt-1`}>
                Inventory Manager
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavBtn
              active={view === "dashboard"}
              onClick={() => setView("dashboard")}
              icon={<LayoutDashboard size={15} />}
              dark={dark}
            >
              Dashboard
            </NavBtn>
            <NavBtn
              active={view === "products"}
              onClick={() => setView("products")}
              icon={<ShoppingBag size={15} />}
              dark={dark}
            >
              Products
            </NavBtn>
          </nav>

          <div className="flex-1" />

          <button
            onClick={() => setDark((d) => !d)}
            className={`p-2 rounded-lg ${C.hover} ${C.dim}`}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={openAdd}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              dark ? "bg-amber-500 text-stone-950 hover:bg-amber-400" : "bg-stone-900 text-white hover:bg-stone-800"
            } transition`}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Product
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-5 pb-3">
          <NavBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard size={14} />} dark={dark}>
            Dashboard
          </NavBtn>
          <NavBtn active={view === "products"} onClick={() => setView("products")} icon={<ShoppingBag size={14} />} dark={dark}>
            Products
          </NavBtn>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pb-24">
        {view === "dashboard" && (
          <DashboardView
            stats={stats}
            products={products}
            getStatus={getStatus}
            C={C}
            dark={dark}
            onView={() => setView("products")}
            onFilterStatus={(s) => {
              setStatusFilter(s);
              setView("products");
            }}
          />
        )}

        {view === "products" && (
          <ProductsView
            products={filtered}
            allProducts={products}
            categories={categories}
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={(p) => setConfirmDelete(p)}
            onAdjustQty={adjustQty}
            onExport={exportExcel}
            onImport={importExcel}
            getStatus={getStatus}
            C={C}
            dark={dark}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t ${C.border} ${C.panel2}`}>
        <div className={`max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-xs ${C.dim}`}>
          <div className="flex items-center gap-2">
            <span className={`${C.dim2} font-mono`}>v1.0</span>
            <span>·</span>
            <span>Built by <span className={`${C.text} font-medium`}>Bareq Mohaisen</span></span>
          </div>
          <div className="font-mono text-[11px] tracking-wider uppercase">
            {stats.totalProducts} SKUs · {fmtMoney(stats.totalValue)} on hand
          </div>
        </div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <ProductModal
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          categories={categories}
          C={C}
          dark={dark}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmDialog
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          C={C}
          dark={dark}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 flex items-center gap-2 ${
            toast.kind === "danger"
              ? "bg-red-600 text-white"
              : dark
              ? "bg-amber-500 text-stone-950"
              : "bg-stone-900 text-white"
          }`}
        >
          {toast.kind === "danger" ? <AlertTriangle size={15} /> : <Check size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ---------- Nav button ----------
function NavBtn({ active, onClick, icon, children, dark }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? dark
            ? "bg-stone-800 text-stone-100"
            : "bg-stone-900 text-white"
          : dark
          ? "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Dashboard ----------
function DashboardView({ stats, products, getStatus, C, dark, onView, onFilterStatus }) {
  const alerts = products
    .filter((p) => {
      const s = getStatus(p);
      return s === "expired" || s === "expiring" || s === "low";
    })
    .slice(0, 6);

  const topValue = [...products]
    .sort(
      (a, b) =>
        Number(b.quantity || 0) * Number(b.unitCost || 0) -
        Number(a.quantity || 0) * Number(a.unitCost || 0)
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2">
        <div>
          <div className={`text-[11px] uppercase tracking-[0.2em] ${C.dim2} mb-2`}>
            Store Overview
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-none">
            Today's <span className="italic font-light">snapshot</span>
          </h1>
          <p className={`mt-3 text-sm ${C.dim} max-w-lg`}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Primary stat */}
      <div className={`${C.panel} ${C.border} border rounded-2xl p-6 md:p-8 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${dark ? "bg-amber-500" : "bg-amber-200"}`} />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          <div className="md:col-span-1">
            <div className={`text-[11px] uppercase tracking-[0.18em] ${C.dim2} mb-3`}>
              Total Inventory Value
            </div>
            <div className="font-display text-5xl md:text-6xl tracking-tight tabular">
              {fmtMoney(stats.totalValue)}
            </div>
            <div className={`mt-3 text-sm ${C.dim} tabular`}>
              across {fmtNum(stats.totalUnits)} units in stock
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-4 md:gap-6">
            <InlineMetric label="Products" value={stats.totalProducts} C={C} />
            <InlineMetric label="Units" value={fmtNum(stats.totalUnits)} C={C} />
            <InlineMetric label="Avg / SKU" value={stats.totalProducts ? fmtMoney(stats.totalValue / stats.totalProducts) : "—"} C={C} />
          </div>
        </div>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlertCard
          title="Expired"
          count={stats.expired}
          icon={<AlertTriangle size={18} />}
          accent="red"
          dark={dark}
          onClick={() => onFilterStatus("expired")}
        />
        <AlertCard
          title="Expiring Soon"
          subtitle="within 7 days"
          count={stats.expiring}
          icon={<Clock size={18} />}
          accent="amber"
          dark={dark}
          onClick={() => onFilterStatus("expiring")}
        />
        <AlertCard
          title="Low Stock"
          subtitle="10 units or less"
          count={stats.lowOnly}
          icon={<TrendingDown size={18} />}
          accent="blue"
          dark={dark}
          onClick={() => onFilterStatus("low")}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Alerts */}
        <div className={`lg:col-span-3 ${C.panel} ${C.border} border rounded-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${C.border}`}>
            <div>
              <div className="font-display text-lg tracking-tight">Attention required</div>
              <div className={`text-xs ${C.dim} mt-0.5`}>Items flagged for review</div>
            </div>
            <button onClick={onView} className={`text-xs ${C.dim} hover:underline`}>
              See all →
            </button>
          </div>
          <div className="divide-y divide-stone-200/10">
            {alerts.length === 0 ? (
              <div className={`px-6 py-10 text-center ${C.dim} text-sm`}>
                <Check size={28} className="mx-auto mb-3 opacity-60" />
                Everything looks good. No alerts right now.
              </div>
            ) : (
              alerts.map((p) => {
                const s = getStatus(p);
                const d = daysUntil(p.expirationDate);
                return (
                  <div
                    key={p.id}
                    className={`px-6 py-3.5 flex items-center gap-4 ${C.hover} transition`}
                  >
                    <StatusDot status={s} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className={`text-xs ${C.dim2} font-mono mt-0.5`}>
                        {p.sku} · {p.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium tabular">
                        {s === "expired"
                          ? `${Math.abs(d)}d overdue`
                          : s === "expiring"
                          ? `${d}d left`
                          : `${p.quantity} units`}
                      </div>
                      <div className={`text-xs ${C.dim2} tabular`}>
                        {fmtMoney(p.quantity * p.unitCost)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top value */}
        <div className={`lg:col-span-2 ${C.panel} ${C.border} border rounded-2xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${C.border}`}>
            <div className="font-display text-lg tracking-tight">Top value</div>
            <div className={`text-xs ${C.dim} mt-0.5`}>By on-hand worth</div>
          </div>
          <div className="px-6 py-4 space-y-3">
            {topValue.length === 0 ? (
              <div className={`py-6 text-center text-sm ${C.dim}`}>No products yet</div>
            ) : (
              topValue.map((p, i) => {
                const val = p.quantity * p.unitCost;
                const max = topValue[0].quantity * topValue[0].unitCost || 1;
                const pct = (val / max) * 100;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="truncate flex items-center gap-2">
                        <span className={`font-mono text-xs ${C.dim2}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="tabular font-medium">{fmtMoney(val)}</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${C.subtle} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${dark ? "bg-amber-500" : "bg-stone-900"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineMetric({ label, value, C }) {
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-[0.18em] ${C.dim2} mb-2`}>{label}</div>
      <div className="font-display text-2xl md:text-3xl tracking-tight tabular">{value}</div>
    </div>
  );
}

function AlertCard({ title, subtitle, count, icon, accent, dark, onClick }) {
  const accents = {
    red: dark ? "text-red-400 bg-red-950/40 border-red-900/50" : "text-red-700 bg-red-50 border-red-200",
    amber: dark ? "text-amber-400 bg-amber-950/40 border-amber-900/50" : "text-amber-700 bg-amber-50 border-amber-200",
    blue: dark ? "text-blue-400 bg-blue-950/40 border-blue-900/50" : "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <button
      onClick={onClick}
      className={`text-left border rounded-xl p-5 transition hover:scale-[1.01] ${accents[accent]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="opacity-80">{icon}</div>
        <div className="font-display text-4xl tabular leading-none">{count}</div>
      </div>
      <div className="font-medium text-sm">{title}</div>
      {subtitle && <div className="text-xs opacity-70 mt-0.5">{subtitle}</div>}
    </button>
  );
}

function StatusDot({ status }) {
  const map = {
    expired: "bg-red-500",
    expiring: "bg-amber-500",
    low: "bg-blue-500",
    ok: "bg-emerald-500",
  };
  return <div className={`w-2 h-2 rounded-full ${map[status]} shrink-0`} />;
}

// ---------- Products View ----------
function ProductsView({
  products,
  allProducts,
  categories,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  onAdd,
  onEdit,
  onDelete,
  onAdjustQty,
  onExport,
  onImport,
  getStatus,
  C,
  dark,
}) {
  const fileRef = React.useRef(null);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className={`text-[11px] uppercase tracking-[0.2em] ${C.dim2} mb-2`}>
            Catalog
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-none">
            Products
          </h1>
          <p className={`mt-2 text-sm ${C.dim}`}>
            Showing {products.length} of {allProducts.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm border ${C.border} ${C.hover}`}
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={onExport}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm border ${C.border} ${C.hover}`}
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button
            onClick={onAdd}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              dark ? "bg-amber-500 text-stone-950 hover:bg-amber-400" : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            <Plus size={15} strokeWidth={2.5} /> New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${C.panel} ${C.border} border rounded-xl p-4 flex flex-col md:flex-row gap-3`}>
        <div className="flex-1 relative">
          <Search
            size={15}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${C.dim2}`}
          />
          <input
            type="text"
            placeholder="Search name, SKU, supplier, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm ${C.input} focus:outline-none focus:ring-2 ${dark ? "focus:ring-amber-500/30" : "focus:ring-stone-900/20"}`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2.5 rounded-lg border text-sm ${C.input} focus:outline-none`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2.5 rounded-lg border text-sm ${C.input} focus:outline-none`}
          >
            <option value="all">All status</option>
            <option value="ok">In stock</option>
            <option value="low">Low / expiring</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${C.panel} ${C.border} border rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${C.border} ${dark ? "bg-stone-900/60" : "bg-stone-50"}`}>
                <Th>Product</Th>
                <Th className="hidden md:table-cell">Category</Th>
                <Th>Qty</Th>
                <Th className="hidden sm:table-cell">Unit Cost</Th>
                <Th>Total</Th>
                <Th className="hidden lg:table-cell">Expires</Th>
                <Th className="hidden xl:table-cell">Supplier</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`text-center py-16 ${C.dim}`}>
                    <Package size={32} className="mx-auto mb-3 opacity-50" />
                    <div className="text-sm">No products match your filters</div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const s = getStatus(p);
                  const d = daysUntil(p.expirationDate);
                  return (
                    <tr key={p.id} className={`border-b ${C.border} ${C.hover} transition`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <StatusDot status={s} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className={`text-xs ${C.dim2} font-mono mt-0.5`}>{p.sku || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3.5 ${C.dim} hidden md:table-cell`}>
                        {p.category || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onAdjustQty(p.id, -1)}
                            className={`w-6 h-6 rounded border ${C.border} ${C.hover} text-xs font-mono`}
                            title="Decrease"
                          >
                            −
                          </button>
                          <span className="font-mono tabular w-10 text-center font-medium">{p.quantity}</span>
                          <button
                            onClick={() => onAdjustQty(p.id, 1)}
                            className={`w-6 h-6 rounded border ${C.border} ${C.hover} text-xs font-mono`}
                            title="Increase"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className={`px-4 py-3.5 tabular hidden sm:table-cell ${C.dim}`}>
                        {fmtMoney(p.unitCost)}
                      </td>
                      <td className="px-4 py-3.5 tabular font-medium">
                        {fmtMoney(p.quantity * p.unitCost)}
                      </td>
                      <td className={`px-4 py-3.5 hidden lg:table-cell ${C.dim}`}>
                        {p.expirationDate ? (
                          <div>
                            <div>{p.expirationDate}</div>
                            <div className={`text-xs mt-0.5 ${
                              d < 0 ? "text-red-500" : d <= 7 ? "text-amber-500" : C.dim2
                            }`}>
                              {d < 0 ? `${Math.abs(d)}d ago` : d === 0 ? "today" : `in ${d}d`}
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className={`px-4 py-3.5 hidden xl:table-cell ${C.dim} text-xs`}>
                        {p.supplier || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={s} dark={dark} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => onEdit(p)}
                            className={`p-1.5 rounded ${C.hover} ${C.dim}`}
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(p)}
                            className={`p-1.5 rounded ${C.hover} text-red-500`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function StatusPill({ status, dark }) {
  const styles = {
    expired: dark ? "bg-red-950/50 text-red-300 border-red-900/60" : "bg-red-50 text-red-700 border-red-200",
    expiring: dark ? "bg-amber-950/50 text-amber-300 border-amber-900/60" : "bg-amber-50 text-amber-700 border-amber-200",
    low: dark ? "bg-blue-950/50 text-blue-300 border-blue-900/60" : "bg-blue-50 text-blue-700 border-blue-200",
    ok: dark ? "bg-emerald-950/50 text-emerald-300 border-emerald-900/60" : "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const label = {
    expired: "Expired",
    expiring: "Expiring",
    low: "Low stock",
    ok: "In stock",
  };
  return (
    <span className={`inline-flex text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border ${styles[status]}`}>
      {label[status]}
    </span>
  );
}

// ---------- Modal ----------
function ProductModal({ initial, onClose, onSave, categories, C, dark }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      unitCost: 0,
      expirationDate: "",
      supplier: "",
      notes: "",
    }
  );
  const [errors, setErrors] = useState({});

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (Number(form.quantity) < 0) errs.quantity = "Must be ≥ 0";
    if (Number(form.unitCost) < 0) errs.unitCost = "Must be ≥ 0";
    if (Object.keys(errs).length) return setErrors(errs);
    onSave({
      ...form,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${C.panel} border ${C.border} rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${C.border}`}>
          <div>
            <div className={`text-[11px] uppercase tracking-[0.18em] ${C.dim2}`}>
              {initial ? "Edit" : "Create"}
            </div>
            <div className="font-display text-xl tracking-tight">
              {initial ? initial.name : "New product"}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${C.hover}`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Product name *" error={errors.name} full>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${C.input}`}
                placeholder="e.g. Organic Whole Milk"
              />
            </Field>
            <Field label="SKU / Barcode">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono ${C.input}`}
                placeholder="DRY-001"
              />
            </Field>
            <Field label="Category">
              <input
                type="text"
                list="categories"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${C.input}`}
                placeholder="Dairy"
              />
              <datalist id="categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Quantity" error={errors.quantity}>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm tabular ${C.input}`}
              />
            </Field>
            <Field label="Unit cost" error={errors.unitCost}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => update("unitCost", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm tabular ${C.input}`}
              />
            </Field>
            <Field label="Expiration date">
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => update("expirationDate", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${C.input}`}
              />
            </Field>
            <Field label="Supplier">
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => update("supplier", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${C.input}`}
                placeholder="Valley Farms Co."
              />
            </Field>
            <Field label="Notes" full>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none ${C.input}`}
                placeholder="Storage instructions, reorder notes, etc."
              />
            </Field>
          </div>

          {/* Live total */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${C.subtle}`}>
            <div className={`text-xs ${C.dim} flex items-center gap-2`}>
              <DollarSign size={14} /> Calculated total cost
            </div>
            <div className="font-mono tabular font-medium">
              {fmtMoney(Number(form.quantity || 0) * Number(form.unitCost || 0))}
            </div>
          </div>
        </form>

        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${C.border}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm ${C.hover} ${C.dim}`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className={`px-5 py-2 rounded-lg text-sm font-medium ${
              dark ? "bg-amber-500 text-stone-950 hover:bg-amber-400" : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            {initial ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, error, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-xs font-medium uppercase tracking-wider opacity-70 mb-1.5">
        {label}
      </label>
      {children}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

// ---------- Confirm dialog ----------
function ConfirmDialog({ product, onCancel, onConfirm, C, dark }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={`${C.panel} border ${C.border} rounded-2xl max-w-md w-full p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600"}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg tracking-tight mb-1">Delete product?</div>
            <div className={`text-sm ${C.dim}`}>
              You're about to remove <span className="font-medium">{product.name}</span>. This can't be undone.
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm ${C.hover} ${C.dim}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
