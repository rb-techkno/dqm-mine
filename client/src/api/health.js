const API_BASE = import.meta.env.VITE_API_URL;

export const fetchApiHealth = async () => {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error("Unable to fetch API health.");
  }
  return response.json();
};

export const fetchDatabaseStatus = async () => {
  const response = await fetch(`${API_BASE}/db/status`);
  if (!response.ok) {
    throw new Error("Unable to fetch database status.");
  }
  return response.json();
};
