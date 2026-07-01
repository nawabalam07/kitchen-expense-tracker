// Auto-detect API URL based on environment

const getApiUrl = () => {
  // Development (local machine)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return import.meta.env.VITE_API_URL || "${API_URL}";
  }
  
  // Production (deployed on web)
  const productionUrl = import.meta.env.VITE_API_URL;
  if (productionUrl) {
    return productionUrl;
  }
  
  // Fallback: use current domain with /api path
  return `${window.location.origin}/api`;
};

export const API_URL = getApiUrl();

console.log(`[KitchenMate] API URL: ${API_URL}`);