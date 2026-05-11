function Table({ columns, rows, emptyMessage = "No data available.", onRowClick }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-xl border text-sm"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-subtle)",
          color: "var(--text-muted)",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-x-auto rounded-xl border"
      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}
    >
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-subtle)" }}
          >
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider ${column.className || ""}`}
                style={{ color: "var(--text-muted)" }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${i}-${row[columns[0].key] ?? "row"}`}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b last:border-0 transition-colors ${onRowClick ? "cursor-pointer" : "cursor-default"}`}
              style={{ borderColor: "var(--border-subtle)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-5 py-3.5 ${column.className || ""}`}
                  style={{ color: "var(--text-secondary)" }}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
