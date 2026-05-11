import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

function QualityScoreDonut({ score = 0 }) {
  const data = [
    { name: "Passed", value: score, color: "#10b981" },
    { name: "Failed", value: 100 - score, color: "#ef4444" },
  ];

  return (
    <div className="h-[280px] w-full relative">
      <div className="absolute inset-0 flex flex-col items-center pointer-events-none" style={{ top: '57%', transform: 'translateY(-50%)' }}>
        <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{score}%</span>
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Overall Score</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            isAnimationActive={false} 
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "12px"
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QualityScoreDonut;
