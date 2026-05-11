import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

function SeverityDonutChart({ data = {} }) {
  const chartData = [
    { name: "Critical", value: data.critical || 0, color: "#ef4444" },
    { name: "Error", value: data.error || 0, color: "#f97316" },
    { name: "Warning", value: data.warning || 0, color: "#eab308" },
    { name: "Info", value: data.info || 0, color: "#3b82f6" },
  ].filter(item => item.value > 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          {/* Keep your UI intact */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "12px"
            }}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-[11px] font-medium text-slate-500">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SeverityDonutChart;