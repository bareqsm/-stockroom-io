import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Upload,
  FileSpreadsheet,
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Moon,
  Sun,
  X,
  AlertTriangle,
  Check,
  DollarSign,
  Clock,
  TrendingDown,
  PieChart,
} from "lucide-react";

const STORAGE_KEY = "inventory:products:v2";
const THEME_KEY = "inventory:theme:v2";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);

const fmtNum = (n) => new Intl.NumberFormat("en-US").format(Number(n) || 0);

const daysUntil = (dateStr) => {
  if (!dateStr) return Infinity;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
};

const seedProducts = [
  {
    id: uid(),
    name: "Organic Whole Milk",
    sku: "DRY-001",
    category: "Dairy",
    quantity: 48,
    unitCost: 2.85,
    expirationDate: new Date(Date.now() + 5 * 86400000)
      .toISOString()
      .slice(0, 10),
    supplier: "Valley Farms Co.",
    notes: "Keep refrigerated",
  },
  {
    id: uid(),
    name: "Artisan Sourdough Bread",
    sku: "BKY-014",
    category: "Bakery",
    quantity: 12,
    unitCost: 4.5,
    expirationDate: new Date(Date.now() + 2 * 86400000)
      .toISOString()
      .slice(0, 10),
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
    expirationDate: new Date(Date.now() + 180 * 86400000)
      .toISOString()
      .slice(0, 10),
    supplier: "Highland Roasters",
    notes: "Low stock",
  },
];

export default function InventoryApp() {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEY);
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(seedProducts);
      }
    } catch {
      setProducts(seedProducts);
    }

    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark") setDark(true);
    } catch {}

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark, loaded]);

  const flash = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2500);
  };

  const getStatus = (product) => {
    const days = daysUntil(product.expirationDate);

    if (product.expirationDate && days < 0) return "expired";
    if (product.expirationDate && days <= 7) return "expiring";
    if (Number(product.quantity) <= 10) return "low";

    return "ok";
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
  }, [products]);

  const stats = useMemo(() => {
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.quantity || 0) * Number(p.unitCost || 0),
      0
    );

    const totalUnits = products.reduce(
      (sum, p) => sum + Number(p.quantity || 0),
      0
    );

    return {
      totalProducts: products.length,
      totalUnits,
      totalValue,
      expired: products.filter((p) => getStatus(p) === "expired").length,
      expiring: products.filter((p) => getStatus(p) === "expiring").length,
      low: products.filter((p) => Number(p.quantity || 0) <= 10).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const text = `${p.name} ${p.sku} ${p.category} ${p.supplier} ${p.notes}`.toLowerCase();

      if (q && !text.includes(q)) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;

      if (statusFilter !== "all") {
        const status = getStatus(p);
        if (
          statusFilter === "low" &&
          !(status === "low" || status === "expiring")
        )
          return false;
        if (statusFilter === "expired" && status !== "expired") return false;
        if (statusFilter === "expiring" && status !== "expiring") return false;
        if (statusFilter === "ok" && status !== "ok") return false;
      }

      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const saveProduct = (data) => {
    if (editing) {
      setProducts((items) =>
        items.map((p) => (p.id === editing.id ? { ...p, ...data } : p))
      );
      flash("Product updated");
    } else {
      setProducts((items) => [{ id: uid(), ...data }, ...items]);
      flash("Product added");
    }

    setModalOpen(false);
    setEditing(null);
  };

  const deleteProduct = (id) => {
    setProducts((items) => items.filter((p) => p.id !== id));
    setConfirmDelete(null);
    flash("Product deleted", "danger");
  };

  const adjustQty = (id, amount) => {
    setProducts((items) =>
      items.map((p) =>
        p.id === id
          ? {
              ...p,
              quantity: Math.max(
                0,
                Number(p.quantity || 0) + Number(amount || 0)
              ),
            }
          : p
      )
    );
  };

  const setExactQty = (id, qty) => {
    setProducts((items) =>
      items.map((p) =>
        p.id === id
          ? {
              ...p,
              quantity: Math.max(0, Number(qty || 0)),
            }
          : p
      )
    );
  };

  const importExcel = async (file) => {
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const imported = rows
        .filter((row) => row.Name || row.name || row.Product || row.product)
        .map((row) => ({
          id: uid(),
          name: row.Name || row.name || row.Product || row.product || "",
          sku:
            row["SKU / Barcode"] ||
            row.SKU ||
            row.sku ||
            row.Barcode ||
            row.barcode ||
            "",
          category: row.Category || row.category || "Uncategorized",
          quantity: Number(
            row.Quantity || row.quantity || row.Qty || row.qty || 0
          ),
          unitCost: Number(
            row["Unit Cost"] ||
              row.unitCost ||
              row["Unit cost"] ||
              row.Cost ||
              row.cost ||
              0
          ),
          expirationDate:
            row["Expiration Date"] ||
            row.expirationDate ||
            row.Expires ||
            row.expires ||
            "",
          supplier: row.Supplier || row.supplier || "",
          notes: row.Notes || row.notes || "",
        }));

      if (!imported.length) {
        flash("No valid products found", "danger");
        return;
      }

      setProducts((items) => [...imported, ...items]);
      flash(`Imported ${imported.length} products`);
    } catch (error) {
      console.error(error);
      flash("Import failed", "danger");
    }
  };

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

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 32 },
        { wch: 16 },
        { wch: 16 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 12 },
        { wch: 22 },
        { wch: 35 },
      ];

      const summary = [
        ["Store Inventory Report"],
        ["Generated", new Date().toLocaleString()],
        [],
        ["Total Products", stats.totalProducts],
        ["Total Units", stats.totalUnits],
        ["Total Inventory Value", stats.totalValue],
        ["Expired Items", stats.expired],
        ["Expiring Soon", stats.expiring],
        ["Low Stock Items", stats.low],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summary);
      summarySheet["!cols"] = [{ wch: 28 }, { wch: 35 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      XLSX.writeFile(
        workbook,
        `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      flash("Exported Excel file");
    } catch (error) {
      console.error(error);
      flash("Export failed", "danger");
    }
  };

  const C = dark
    ? {
        bg: "bg-slate-950",
        panel: "bg-slate-900",
        panel2: "bg-slate-900/70",
        border: "border-slate-800",
        text: "text-slate-100",
        dim: "text-slate-400",
        dim2: "text-slate-500",
        input:
          "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500",
        hover: "hover:bg-slate-800",
        primary: "bg-blue-500 text-white hover:bg-blue-400",
      }
    : {
        bg: "bg-slate-50",
        panel: "bg-white",
        panel2: "bg-white",
        border: "border-slate-200",
        text: "text-slate-900",
        dim: "text-slate-600",
        dim2: "text-slate-500",
        input:
          "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
        hover: "hover:bg-slate-100",
        primary: "bg-blue-700 text-white hover:bg-blue-800",
      };

  if (!loaded) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${C.bg} ${C.text}`}
      >
        Loading inventory...
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${C.bg} ${C.text}`}>
      <header className={`${C.panel2} border-b ${C.border} sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-800 text-white flex items-center justify-center">
              <Boxes size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                Stockroom <span className="text-blue-700">/ io</span>
              </div>
              <div className={`text-sm ${C.dim}`}>Inventory Manager</div>
            </div>
          </div>

          <div className="flex-1" />

          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setView("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                view === "dashboard"
                  ? C.primary
                  : `${C.panel} ${C.text} border ${C.border}`
              }`}
            >
              <LayoutDashboard size={17} />
              Dashboard
            </button>

            <button
              onClick={() => setView("statistics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                view === "statistics"
                  ? C.primary
                  : `${C.panel} ${C.text} border ${C.border}`
              }`}
            >
              <PieChart size={17} />
              Statistics
            </button>

            <button
              onClick={() => setView("products")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                view === "products"
                  ? C.primary
                  : `${C.panel} ${C.text} border ${C.border}`
              }`}
            >
              <ShoppingBag size={17} />
              Products
            </button>

            <button
              onClick={() => setDark((v) => !v)}
              className={`${C.panel} border ${C.border} px-4 py-2 rounded-xl`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {view === "dashboard" && (
          <Dashboard
            stats={stats}
            products={products}
            getStatus={getStatus}
            setView={setView}
            setStatusFilter={setStatusFilter}
            C={C}
          />
        )}

        {view === "statistics" && (
          <StatisticsPage
            products={products}
            stats={stats}
            getStatus={getStatus}
            C={C}
          />
        )}

        {view === "products" && (
          <Products
            products={filteredProducts}
            allProducts={products}
            categories={categories}
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            importExcel={importExcel}
            exportExcel={exportExcel}
            openAdd={openAdd}
            openEdit={openEdit}
            setConfirmDelete={setConfirmDelete}
            adjustQty={adjustQty}
            setExactQty={setExactQty}
            getStatus={getStatus}
            C={C}
          />
        )}
      </main>

      {modalOpen && (
        <ProductModal
          initial={editing}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={saveProduct}
          C={C}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteProduct(confirmDelete.id)}
          C={C}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold ${
            toast.kind === "danger"
              ? "bg-red-600 text-white"
              : "bg-slate-900 text-white"
          }`}
        >
          {toast.kind === "danger" ? (
            <AlertTriangle size={17} />
          ) : (
            <Check size={17} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Dashboard({ stats, products, getStatus, setView, setStatusFilter, C }) {
  const alertProducts = products
    .filter((p) => ["expired", "expiring", "low"].includes(getStatus(p)))
    .slice(0, 8);

  const openFilter = (filter) => {
    setStatusFilter(filter);
    setView("products");
  };

  return (
    <div className="space-y-8">
      <div>
        <div className={`text-sm font-bold uppercase tracking-widest ${C.dim2}`}>
          Store Overview
        </div>
        <h1 className="text-5xl font-extrabold mt-2">Dashboard</h1>
      </div>

      <section className={`${C.panel} border ${C.border} rounded-3xl p-8 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Metric
            title="Inventory Value"
            value={fmtMoney(stats.totalValue)}
            icon={<DollarSign />}
          />
          <Metric title="Products" value={fmtNum(stats.totalProducts)} icon={<Package />} />
          <Metric title="Units" value={fmtNum(stats.totalUnits)} icon={<Boxes />} />
          <Metric title="Low Stock" value={fmtNum(stats.low)} icon={<TrendingDown />} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AlertBox
          title="Expired"
          count={stats.expired}
          color="red"
          icon={<AlertTriangle />}
          onClick={() => openFilter("expired")}
        />
        <AlertBox
          title="Expiring Soon"
          count={stats.expiring}
          color="amber"
          icon={<Clock />}
          onClick={() => openFilter("expiring")}
        />
        <AlertBox
          title="Low Stock"
          count={stats.low}
          color="blue"
          icon={<TrendingDown />}
          onClick={() => openFilter("low")}
        />
      </section>

      <section className={`${C.panel} border ${C.border} rounded-3xl overflow-hidden shadow-sm`}>
        <div className={`px-6 py-4 border-b ${C.border}`}>
          <h2 className="text-2xl font-extrabold">Attention Required</h2>
          <p className={`text-sm ${C.dim}`}>Products that need review</p>
        </div>

        {alertProducts.length === 0 ? (
          <div className={`p-10 text-center ${C.dim}`}>No alerts right now.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {alertProducts.map((p) => (
              <div key={p.id} className="px-6 py-4 flex justify-between gap-4">
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className={`text-sm ${C.dim}`}>
                    {p.sku} · {p.category}
                  </div>
                </div>
                <StatusPill status={getStatus(p)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatisticsPage({ products, stats, getStatus, C }) {
  const categoryStats = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const quantity = Number(product.quantity || 0);
      const value = Number(product.quantity || 0) * Number(product.unitCost || 0);

      if (!map.has(category)) {
        map.set(category, {
          category,
          quantity: 0,
          value: 0,
          count: 0,
        });
      }

      const item = map.get(category);
      item.quantity += quantity;
      item.value += value;
      item.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [products]);

  const statusStats = useMemo(() => {
    const data = {
      ok: 0,
      low: 0,
      expiring: 0,
      expired: 0,
    };

    products.forEach((product) => {
      data[getStatus(product)] += 1;
    });

    return data;
  }, [products, getStatus]);

  const totalValue = categoryStats.reduce((sum, item) => sum + item.value, 0);

  const colors = [
    "#1f5f99",
    "#15803d",
    "#b45309",
    "#7c3aed",
    "#be123c",
    "#0891b2",
    "#ca8a04",
    "#4338ca",
    "#047857",
    "#c2410c",
  ];

  let currentPercent = 0;

  const pieGradient =
    categoryStats.length === 0
      ? "#e5e7eb 0% 100%"
      : categoryStats
          .map((item, index) => {
            const percent = totalValue ? (item.value / totalValue) * 100 : 0;
            const start = currentPercent;
            const end = currentPercent + percent;
            currentPercent = end;
            return `${colors[index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ");

  return (
    <div className="space-y-8">
      <div>
        <div className={`text-sm font-bold uppercase tracking-widest ${C.dim2}`}>
          Inventory Analytics
        </div>
        <h1 className="text-5xl font-extrabold mt-3">Statistics</h1>
        <p className={`mt-4 text-lg ${C.dim}`}>
          Visual overview of stock value, quantity, categories, and product status.
        </p>
      </div>

      <section className={`${C.panel} border ${C.border} rounded-3xl p-8 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Metric title="Inventory Value" value={fmtMoney(stats.totalValue)} icon={<DollarSign />} />
          <Metric title="Products" value={fmtNum(stats.totalProducts)} icon={<Package />} />
          <Metric title="Units" value={fmtNum(stats.totalUnits)} icon={<Boxes />} />
          <Metric title="Categories" value={fmtNum(categoryStats.length)} icon={<PieChart />} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${C.panel} border ${C.border} rounded-3xl p-8 shadow-sm`}>
          <h2 className="text-3xl font-extrabold">Stock Value by Category</h2>
          <p className={`mt-2 ${C.dim}`}>
            Pie chart based on total inventory value per category.
          </p>

          <div className="mt-8 flex flex-col md:flex-row items-center gap-8">
            <div
              className="w-72 h-72 rounded-full shadow-md border border-slate-200"
              style={{ background: `conic-gradient(${pieGradient})` }}
            />

            <div className="flex-1 w-full space-y-3">
              {categoryStats.map((item, index) => {
                const percent = totalValue
                  ? ((item.value / totalValue) * 100).toFixed(1)
                  : "0.0";

                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <div>
                        <div className="font-bold">{item.category}</div>
                        <div className={`text-sm ${C.dim}`}>
                          {fmtNum(item.quantity)} units · {item.count} products
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold">{fmtMoney(item.value)}</div>
                      <div className={`text-sm ${C.dim}`}>{percent}%</div>
                    </div>
                  </div>
                );
              })}

              {categoryStats.length === 0 && (
                <div className={`text-center py-10 ${C.dim}`}>No inventory data yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className={`${C.panel} border ${C.border} rounded-3xl p-8 shadow-sm`}>
          <h2 className="text-3xl font-extrabold">Stock Status</h2>
          <p className={`mt-2 ${C.dim}`}>
            Product condition based on expiry date and quantity.
          </p>

          <div className="mt-8 space-y-5">
            <StatusStat label="In Stock" value={statusStats.ok} total={products.length} color="#15803d" />
            <StatusStat label="Low Stock" value={statusStats.low} total={products.length} color="#1f5f99" />
            <StatusStat label="Expiring Soon" value={statusStats.expiring} total={products.length} color="#b45309" />
            <StatusStat label="Expired" value={statusStats.expired} total={products.length} color="#b42318" />
          </div>
        </div>
      </section>

      <section className={`${C.panel} border ${C.border} rounded-3xl overflow-hidden shadow-sm`}>
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-3xl font-extrabold">Category Breakdown</h2>
          <p className={`mt-2 ${C.dim}`}>Detailed inventory totals by category.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Products</Th>
                <Th>Units</Th>
                <Th>Total Value</Th>
                <Th>Share</Th>
              </tr>
            </thead>

            <tbody>
              {categoryStats.map((item) => {
                const percent = totalValue
                  ? ((item.value / totalValue) * 100).toFixed(1)
                  : "0.0";

                return (
                  <tr key={item.category} className="border-t border-slate-200">
                    <td className="px-4 py-4 font-bold">{item.category}</td>
                    <td className="px-4 py-4">{fmtNum(item.count)}</td>
                    <td className="px-4 py-4">{fmtNum(item.quantity)}</td>
                    <td className="px-4 py-4 font-bold">{fmtMoney(item.value)}</td>
                    <td className="px-4 py-4">{percent}%</td>
                  </tr>
                );
              })}

              {categoryStats.length === 0 && (
                <tr>
                  <td colSpan="5" className={`text-center py-12 ${C.dim}`}>
                    No category data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusStat({ label, value, total, color }) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">{label}</div>
        <div className="font-extrabold">
          {value} <span className="text-slate-500 font-bold">({percent}%)</span>
        </div>
      </div>

      <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 bg-white">
      <div className="text-blue-700 mb-4">
        {React.cloneElement(icon, { size: 26 })}
      </div>
      <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
        {title}
      </div>
      <div className="text-3xl font-extrabold mt-2">{value}</div>
    </div>
  );
}

function AlertBox({ title, count, icon, color, onClick }) {
  const colors = {
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-6 ${colors[color]}`}
    >
      <div className="flex justify-between items-center">
        {React.cloneElement(icon, { size: 28 })}
        <span className="text-4xl font-extrabold">{count}</span>
      </div>
      <div className="font-extrabold mt-4">{title}</div>
    </button>
  );
}

function Products({
  products,
  allProducts,
  categories,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  importExcel,
  exportExcel,
  openAdd,
  openEdit,
  setConfirmDelete,
  adjustQty,
  setExactQty,
  getStatus,
  C,
}) {
  const fileInput = useRef(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div>
          <div className={`text-sm font-bold uppercase tracking-widest ${C.dim2}`}>
            Catalog
          </div>
          <h1 className="text-5xl font-extrabold mt-3">Products</h1>
          <p className={`mt-4 text-lg ${C.dim}`}>
            Showing {products.length} of {allProducts.length}
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importExcel(file);
                e.target.value = "";
              }}
            />

            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800"
            >
              <Upload size={17} />
              Import
            </button>

            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800"
            >
              <FileSpreadsheet size={17} />
              Export Excel
            </button>

            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800"
            >
              <Plus size={17} />
              New Product
            </button>
          </div>
        </div>

        <QuickStockPanel
          products={allProducts}
          adjustQty={adjustQty}
          setExactQty={setExactQty}
          openEdit={openEdit}
          C={C}
        />
      </div>

      <section className={`${C.panel} border ${C.border} rounded-3xl p-5 shadow-sm`}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
          <div className="relative">
            <Search
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${C.dim2}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, supplier, notes..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${C.input}`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-3 rounded-xl border ${C.input}`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-3 rounded-xl border ${C.input}`}
          >
            <option value="all">All status</option>
            <option value="ok">In stock</option>
            <option value="low">Low / expiring</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </section>

      <section className={`${C.panel} border ${C.border} rounded-3xl overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Qty</Th>
                <Th>Unit Cost</Th>
                <Th>Total</Th>
                <Th>Expires</Th>
                <Th>Supplier</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className={`text-center py-16 ${C.dim}`}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const status = getStatus(p);
                  const days = daysUntil(p.expirationDate);

                  return (
                    <tr key={p.id} className="border-t border-slate-200">
                      <td className="px-4 py-4">
                        <div className="font-bold">{p.name}</div>
                        <div className={`text-xs ${C.dim}`}>{p.sku || "No SKU"}</div>
                      </td>

                      <td className="px-4 py-4">{p.category || "—"}</td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => adjustQty(p.id, -1)}
                            className="w-8 h-8 rounded-lg border border-slate-300"
                          >
                            −
                          </button>
                          <span className="font-mono font-bold w-12 text-center">
                            {p.quantity}
                          </span>
                          <button
                            onClick={() => adjustQty(p.id, 1)}
                            className="w-8 h-8 rounded-lg border border-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">{fmtMoney(p.unitCost)}</td>
                      <td className="px-4 py-4 font-bold">
                        {fmtMoney(Number(p.quantity || 0) * Number(p.unitCost || 0))}
                      </td>

                      <td className="px-4 py-4">
                        {p.expirationDate ? (
                          <>
                            <div>{p.expirationDate}</div>
                            <div
                              className={`text-xs ${
                                days < 0
                                  ? "text-red-600"
                                  : days <= 7
                                  ? "text-amber-600"
                                  : C.dim
                              }`}
                            >
                              {days < 0
                                ? `${Math.abs(days)}d ago`
                                : days === 0
                                ? "today"
                                : `in ${days}d`}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-4">{p.supplier || "—"}</td>

                      <td className="px-4 py-4">
                        <StatusPill status={status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-lg border border-slate-300"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(p)}
                            className="p-2 rounded-lg border border-red-300 text-red-600"
                          >
                            <Trash2 size={15} />
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
      </section>
    </div>
  );
}

function QuickStockPanel({ products, adjustQty, setExactQty, openEdit, C }) {
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState(1);
  const [exact, setExact] = useState("");

  const selected = products.find((p) => p.id === selectedId);

  useEffect(() => {
    if (selected) setExact(selected.quantity);
  }, [selectedId, selected]);

  const amountNum = Math.max(1, Number(amount || 1));

  return (
    <section className={`${C.panel} border ${C.border} rounded-3xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm font-bold uppercase tracking-widest ${C.dim2}`}>
            Quick Controls
          </div>
          <h2 className="text-3xl font-extrabold mt-2">Add / Remove / Update</h2>
        </div>
        <Boxes size={34} className="text-blue-700" />
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className={`block text-sm font-bold mb-2 ${C.dim}`}>
            Select Product
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
          >
            <option value="">Choose product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Qty: {p.quantity}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <div className="font-extrabold text-blue-950">{selected.name}</div>
            <div className="text-sm text-blue-800 mt-1">
              Current quantity: <strong>{selected.quantity}</strong>
            </div>
            <div className="text-sm text-blue-800">
              Value:{" "}
              <strong>
                {fmtMoney(
                  Number(selected.quantity || 0) * Number(selected.unitCost || 0)
                )}
              </strong>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-bold mb-2 ${C.dim}`}>
              Add / Remove Amount
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${C.dim}`}>
              Set Exact Quantity
            </label>
            <input
              type="number"
              min="0"
              value={exact}
              onChange={(e) => setExact(e.target.value)}
              disabled={!selected}
              className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            disabled={!selected}
            onClick={() => selected && adjustQty(selected.id, amountNum)}
            className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 disabled:opacity-40"
          >
            + Add
          </button>

          <button
            disabled={!selected}
            onClick={() => selected && adjustQty(selected.id, -amountNum)}
            className="px-4 py-3 rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-700 disabled:opacity-40"
          >
            − Remove
          </button>

          <button
            disabled={!selected}
            onClick={() => selected && setExactQty(selected.id, exact)}
            className="px-4 py-3 rounded-xl bg-blue-700 text-white font-extrabold hover:bg-blue-800 disabled:opacity-40"
          >
            Update
          </button>

          <button
            disabled={!selected}
            onClick={() => selected && openEdit(selected)}
            className="px-4 py-3 rounded-xl bg-slate-800 text-white font-extrabold hover:bg-slate-900 disabled:opacity-40"
          >
            Edit
          </button>
        </div>
      </div>
    </section>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600">
      {children}
    </th>
  );
}

function StatusPill({ status }) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
    expiring: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-red-50 text-red-700 border-red-200",
  };

  const labels = {
    ok: "In stock",
    low: "Low stock",
    expiring: "Expiring",
    expired: "Expired",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-extrabold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ProductModal({ initial, categories, onClose, onSave, C }) {
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

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!String(form.name || "").trim())
      newErrors.name = "Product name is required";
    if (Number(form.quantity) < 0)
      newErrors.quantity = "Quantity must be 0 or more";
    if (Number(form.unitCost) < 0)
      newErrors.unitCost = "Cost must be 0 or more";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...form,
      quantity: Number(form.quantity || 0),
      unitCost: Number(form.unitCost || 0),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div
        className={`${C.panel} ${C.text} border ${C.border} rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden`}
      >
        <div
          className={`px-6 py-4 border-b ${C.border} flex justify-between items-center`}
        >
          <div>
            <div className={`text-sm uppercase tracking-widest font-bold ${C.dim2}`}>
              {initial ? "Edit Product" : "New Product"}
            </div>
            <h2 className="text-2xl font-extrabold">
              {initial ? initial.name : "Create product"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Product Name" error={errors.name} full>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="SKU / Barcode">
              <input
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="Category">
              <input
                list="category-list"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
              <datalist id="category-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Quantity" error={errors.quantity}>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="Unit Cost" error={errors.unitCost}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => update("unitCost", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="Expiration Date">
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => update("expirationDate", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="Supplier">
              <input
                value={form.supplier}
                onChange={(e) => update("supplier", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>

            <Field label="Notes" full>
              <textarea
                rows="3"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${C.input}`}
              />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-100 p-4 flex justify-between">
            <span className="font-bold text-slate-600">Calculated Total</span>
            <span className="font-extrabold">
              {fmtMoney(Number(form.quantity || 0) * Number(form.unitCost || 0))}
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-700 text-white font-extrabold hover:bg-blue-800"
            >
              {initial ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, error, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-bold mb-2">{label}</label>
      {children}
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
    </div>
  );
}

function ConfirmDialog({ product, onCancel, onConfirm, C }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div
        className={`${C.panel} ${C.text} border ${C.border} rounded-3xl p-6 max-w-md w-full`}
      >
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold">Delete product?</h2>
            <p className={`mt-2 ${C.dim}`}>
              You are about to delete <strong>{product.name}</strong>. This
              cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-slate-300 font-bold"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-3 rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}