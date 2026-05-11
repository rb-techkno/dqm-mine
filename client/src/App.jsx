import { useMemo, useState, useEffect } from "react";
import DashboardPage from "@/pages/DashboardPage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import DataQualityPage from "@/pages/DataQualityPage";
import GovernancePage from "@/pages/GovernancePage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import QueryExplorerPage from "@/pages/QueryExplorerPage";
import AboutUsPage from "@/pages/AboutUsPage";
import ManualPage from "@/pages/ManualPage";
import CustomBusinessRulesPage from "@/pages/CustomBusinessRulesPage";
import {
  Sun, Moon, LayoutDashboard, Database, ShieldCheck,
  FileText, Sparkles, Search, PanelLeftClose, PanelLeftOpen,
  Info, BookOpen, ClipboardList
} from "lucide-react";
import DashboardPageTest from "./pages/DashboardPageTest";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Connections", icon: Database },
  { name: "Data Quality", icon: ShieldCheck },
  { name: "Governance", icon: FileText },
  { name: "AI Recommendations", icon: Sparkles },
  { name: "Query Explorer", icon: Search },
  { name: "Custom Business Rules", icon: ClipboardList },
  { name: "About Us", icon: Info },
  { name: "Manual", icon: BookOpen },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const pageContent = useMemo(() => {
    if (activePage === "Connections") return <ConnectionsPage />;
    if (activePage === "Data Quality") return <DataQualityPage />;
    if (activePage === "Governance") return <GovernancePage />;
    if (activePage === "AI Recommendations") return <RecommendationsPage />;
    if (activePage === "Query Explorer") return <QueryExplorerPage />;
    if (activePage === "Custom Business Rules") return <CustomBusinessRulesPage />;
    if (activePage === "About Us") return <AboutUsPage />;
    if (activePage === "Manual") return <ManualPage />;
    return <DashboardPage />;
  }, [activePage]);

  return (
    <main
      className="h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <div className="flex h-full overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className={`hidden md:flex md:flex-col border-r h-full transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "w-[64px]" : "w-[220px]"
          }`}
          style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border-default)" }}
        >
          {/* Logo */}
          <div
            className={`flex items-center gap-3 px-4 py-4 border-b ${sidebarCollapsed ? "justify-center px-2" : ""}`}
            style={{ borderColor: "var(--border-default)" }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Database size={16} strokeWidth={2.5} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-sm font-bold tracking-tight">
                  DataGuard
                </h1>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                  Data Intelligence
                </p>
              </div>
            )}
          </div>

          {/* Utility Buttons */}
          <div className="p-2 space-y-1 border-b" style={{ borderColor: "var(--border-default)" }}>
            <SidebarButton
              collapsed={sidebarCollapsed}
              icon={sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              label="Collapse sidebar"
              onClick={() => setSidebarCollapsed(p => !p)}
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            />
            <SidebarButton
              collapsed={sidebarCollapsed}
              icon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
              label={darkMode ? "Light mode" : "Dark mode"}
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "Switch to light" : "Switch to dark"}
            />
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-2 space-y-0.5">
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Navigation
              </p>
            )}
            {navItems.map(item => {
              const active = activePage === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActivePage(item.name)}
                  className={`group relative flex w-full items-center rounded-lg transition-all ${
                    sidebarCollapsed ? "h-11 justify-center" : "gap-3 px-3 py-2.5 text-[13px]"
                  }`}
                  style={{
                    backgroundColor: active ? "var(--bg-toggle)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <item.icon
                    size={16}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                  />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer hint */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-2 rounded-lg p-3" style={{ backgroundColor: "var(--bg-toggle)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "var(--success)" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)" }} />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>Live Monitoring</p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Content Area ── */}
        <section className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-8 py-2.5 border-b backdrop-blur-sm"
            style={{
              borderColor: "var(--border-default)",
              background: darkMode
                ? "rgba(11, 18, 32, 0.85)"
                : "rgba(248, 250, 252, 0.85)",
            }}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Workspace
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                {activePage}
              </h2>
            </div>

                        <div className="flex items-center gap-3">
              {/* Live badge */}
              <div
                className="hidden sm:flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest border"
                style={{
                  backgroundColor: "var(--success-bg)",
                  borderColor: "rgba(16, 185, 129, 0.2)",
                  color: "var(--success-text)",
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "var(--success)" }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
                </span>
                All Systems Live
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
              {pageContent}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}

/* Sidebar button */
function SidebarButton({ collapsed, icon, label, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex w-full items-center rounded-lg text-sm font-medium transition-all ${
        collapsed ? "h-10 justify-center" : "gap-3 px-3 py-2"
      }`}
      style={{ color: "var(--text-secondary)" }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export default App;
