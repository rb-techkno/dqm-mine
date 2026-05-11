import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = {
  Critical: "#ef4444",
  Error:    "#f97316",
  Warning:  "#eab308",
  Info:     "#3b82f6",
};

const renderLegend = ({ payload }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", justifyContent: "center", marginTop: 8 }}>
    {payload.map((entry) => (
      <span key={entry.value} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, display: "inline-block" }} />
        {entry.value}: <strong style={{ color: "#111827" }}>{entry.payload.value}</strong>
      </span>
    ))}
  </div>
);

export default function SeverityDonutChart({ data = {} }) {
  const chartData = [
    { name: "Critical", value: data.critical || 0 },
    { name: "Error",    value: data.error    || 0 },
    { name: "Warning",  value: data.warning  || 0 },
    { name: "Info",     value: data.info     || 0 },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height: 280, width: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          
          {/* Merged Tooltip with Hex colors to prevent oklch crashes */}
          <Tooltip 
            formatter={(v) => [`${v} (${((v / total) * 100).toFixed(1)}%)`, ""]} 
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "12px"
            }}
          />
          
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Centre label */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>total events</div>
      </div>
    </div>
  );
}