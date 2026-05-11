const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const dev = "http://localhost:5075";

export const finalUrl = configuredBaseUrl || dev;
