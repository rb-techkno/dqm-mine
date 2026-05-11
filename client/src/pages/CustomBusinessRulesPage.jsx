
import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Plus, Database, Table as TableIcon, Columns, FileText, CheckCircle2, AlertCircle, Search, Edit2, Trash2, X } from "lucide-react";
import { getTables, getColumns, getBusinessRules, addBusinessRule, updateBusinessRule, deleteBusinessRule } from "../api";

const CustomBusinessRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingColumns, setFetchingColumns] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [newRule, setNewRule] = useState({
    ruleName: "",
    scope: "Specific", // "Global" or "Specific"
    tableName: "",
    columnName: "",
    ruleDefinition: "",
    severity: "Medium",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [rulesData, tablesData] = await Promise.all([
        getBusinessRules(),
        getTables()
      ]);
      setRules(rulesData);
      setTables(tablesData.tables || []);
      setError(null);
    } catch (err) {
      setError("Failed to load business rules or tables. Please check your database connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setNewRule({ 
      ...newRule, 
      scope, 
      tableName: scope === "Global" ? "*" : "", 
      columnName: scope === "Global" ? "*" : "" 
    });
    setColumns([]);
  };

  const handleTableChange = async (e) => {
    const tableName = e.target.value;
    setNewRule({ ...newRule, tableName, columnName: "" });
    
    if (tableName && tableName !== "*") {
      setFetchingColumns(true);
      try {
        const data = await getColumns(tableName);
        setColumns(data.columns || []);
      } catch (err) {
        console.error("Failed to fetch columns", err);
      } finally {
        setFetchingColumns(false);
      }
    } else {
      setColumns([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRule({ ...newRule, [name]: value });
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (newRule.ruleName && newRule.tableName && newRule.columnName && newRule.ruleDefinition) {
      try {
        if (editingId) {
          const updated = await updateBusinessRule(editingId, newRule);
          setRules(rules.map(r => r.id === editingId ? updated : r));
          setEditingId(null);
        } else {
          const addedRule = await addBusinessRule(newRule);
          console.log(addedRule);
          setRules([...rules, addedRule]);
        }
        resetForm();
      } catch (err) {
        console.log(err);
        setError(editingId ? "Failed to update rule. Please try again." : "Failed to add rule. Please try again.");
      }
    }
  };

  const handleEdit = async (rule) => {
    setEditingId(rule.id);
    setNewRule({
      ruleName: rule.ruleName,
      scope: rule.scope || "Specific",
      tableName: rule.tableName,
      columnName: rule.columnName,
      ruleDefinition: rule.ruleDefinition,
      severity: rule.severity || "Medium"
    });

    if (rule.scope !== "Global" && rule.tableName) {
      setFetchingColumns(true);
      try {
        const data = await getColumns(rule.tableName);
        setColumns(data.columns || []);
      } catch (err) {
        console.error("Failed to fetch columns", err);
      } finally {
        setFetchingColumns(false);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this rule?")) {
      try {
        await deleteBusinessRule(id);
        setRules(rules.filter(r => r.id !== id));
      } catch (err) {
        setError("Failed to delete rule. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setNewRule({
      ruleName: "",
      scope: "Specific",
      tableName: "",
      columnName: "",
      ruleDefinition: "",
      severity: "Medium"
    });
    setEditingId(null);
    setColumns([]);
  };

  if (loading) return <LoadingSpinner />;

  const tableColumns = [
    { key: "ruleName", label: "Rule Name" },
    { 
      key: "scope", 
      label: "Scope",
      render: (val) => (
        <Badge variant={val === "Global" ? "info" : "default"}>
          {val || "Specific"}
        </Badge>
      )
    },
    { 
      key: "tableName", 
      label: "Table",
      render: (val) => val === "*" ? <span className="text-blue-500 font-medium">All Tables</span> : val
    },
    { 
      key: "columnName", 
      label: "Column",
      render: (val) => val === "*" ? <span className="text-blue-500 font-medium">Matching Columns</span> : val
    },
    { key: "ruleDefinition", label: "Definition" },
    { 
      key: "severity", 
      label: "Severity",
      render: (val) => (
        <Badge 
          variant={val === "High" ? "error" : val === "Medium" ? "warning" : "info"}
        >
          {val}
        </Badge>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, rule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(rule)}
            className="p-1 hover:text-blue-500 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => handleDelete(e, rule.id)}
            className="p-1 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Custom Business Rules
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Define rules globally across all tables or for specific columns. Click any rule to edit its details.
          </p>
        </div>
      </div> */}

      {error && <ErrorMessage message={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rule Form */}
        <div className="lg:col-span-1">
          <Card 
            title={editingId ? "Edit Business Rule" : "Add New Rule"} 
            icon={editingId ? <Edit2 size={18} /> : <Plus size={18} />}
            action={editingId && (
              <button onClick={resetForm} className="text-xs flex items-center gap-1 hover:text-red-500">
                <X size={12} /> Cancel
              </button>
            )}
          >
            <form onSubmit={handleAddRule} className="space-y-4 mt-4">
              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Rule Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleScopeChange("Specific")}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      newRule.scope === "Specific" 
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    Specific Column
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeChange("Global")}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      newRule.scope === "Global" 
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    Global (All Tables)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Rule Name
                </label>
                <input
                  type="text"
                  name="ruleName"
                  value={newRule.ruleName}
                  onChange={handleInputChange}
                  placeholder={newRule.scope === "Global" ? "e.g. Audit Fields Validation" : "e.g. Email Format Validation"}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  required
                />
              </div>

              {newRule.scope === "Specific" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Select Table
                    </label>
                    <div className="relative">
                      <select
                        name="tableName"
                        value={newRule.tableName}
                        onChange={handleTableChange}
                        className="w-full px-3 py-2 rounded-lg border appearance-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                        required
                      >
                        <option value="">Choose a table...</option>
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                        <TableIcon size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Select Column
                    </label>
                    <div className="relative">
                      <select
                        name="columnName"
                        value={newRule.columnName}
                        onChange={handleInputChange}
                        disabled={!newRule.tableName || fetchingColumns}
                        className="w-full px-3 py-2 rounded-lg border appearance-none focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50"
                        style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                        required
                      >
                        <option value="">{fetchingColumns ? "Loading..." : "Choose a column..."}</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                        <Columns size={14} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Target Column Name (Pattern)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="columnName"
                      value={newRule.columnName === "*" ? "" : newRule.columnName}
                      onChange={(e) => setNewRule({ ...newRule, columnName: e.target.value })}
                      placeholder="e.g. created_at, email, user_id"
                      className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                      <Search size={14} />
                    </div>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Rule will apply to any table containing this column name.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Rule Definition (SQL or Logic)
                </label>
                <textarea
                  name="ruleDefinition"
                  value={newRule.ruleDefinition}
                  onChange={handleInputChange}
                  placeholder="e.g. column_name IS NOT NULL"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Severity
                </label>
                <select
                  name="severity"
                  value={newRule.severity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={18} />
                {editingId ? "Update Business Rule" : "Create Business Rule"}
              </button>
            </form>
          </Card>
        </div>

        {/* Rules Table */}
        <div className="lg:col-span-2">
          <Card 
            title="Existing Business Rules" 
            subtitle={`${rules.length} rules currently active. Click any row to edit.`}
            icon={<FileText size={18} />}
          >
            <div className="mt-4">
              <Table 
                columns={tableColumns} 
                rows={rules} 
                onRowClick={handleEdit}
                emptyMessage="No business rules defined yet. Create your first rule to get started."
              />

              {/* <button className="btn btn-primary mt-2">Apply rules</button> */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomBusinessRulesPage;
