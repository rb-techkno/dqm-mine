const API_BASE = import.meta.env.VITE_API_URL;

export const connectDatabase = async (payload) => {
  const response = await fetch(`${API_BASE}/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok && !data?.ok) {
    throw new Error(data?.message || "Connection request failed.");
  }

  return data;
};
