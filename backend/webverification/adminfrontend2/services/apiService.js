import { Platform } from "react-native";
export const BASE_URL = "https://jkd-webverification-cfe7b0e5f6ehgqca.centralindia-01.azurewebsites.net".replace(/\/+$/, "");
export const ONBOARDING_BASE_URL = "https://jkd-onboarding-f2e6hzfubndjhrc5.centralindia-01.azurewebsites.net".replace(/\/+$/, "");
if (Platform.OS === "web") {
  window.API_BASE_URL = BASE_URL;
  window.API_ONBOARDING_URL = ONBOARDING_BASE_URL;
}

// Helper to handle timeouts with fetch
const API_TIMEOUT = 90000; // Increased to 90 seconds to handle extreme tunnel latency
const MAX_RETRIES = 2;

const fetchWithTimeout = async (url, options = {}, retryCount = 0) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);

    const errorMsg = error.message?.toLowerCase() || "";
    const isTimeout =
      error.name === "AbortError" ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("exceeded");
    const isNetworkError = errorMsg.includes("network request failed");

    if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
      console.log(
        `API Retry ${retryCount + 1} for: ${url} (Reason: ${isTimeout ? "Timeout" : "Network"})`,
      );
      // Wait 1.5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return fetchWithTimeout(url, options, retryCount + 1);
    }

    if (isTimeout) {
      throw new Error(
        `Request timed out after 90 seconds. This is likely due to Ngrok latency. Please try again. (${error.message})`,
      );
    }
    throw error;
  }
};

export const apiService = {
  // Retailer APIs
  getRetailers: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const url = `${BASE_URL}/api/retailers?${queryParams.toString()}`;
      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`Fetch failed for ${url}:`, text);
        throw new Error(`Failed to fetch retailers: ${response.status}`);
      }
      const json = await response.json();
      return json; // Backend returns { success, count, data, total }
    } catch (error) {
      console.error("API Error (getRetailers):", error);
      console.warn(
        "Check: Is your backend running? Does it have app.use(cors())?",
      );
      throw error;
    }
  },

  getRetailerById: async (id) => {
    try {
      const token =
        Platform.OS === "web" ? localStorage.getItem("auth_token") : null;
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/retailers/${id}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch retailer details");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("API Error (getRetailerById):", error);
      throw error;
    }
  },

  updateRetailerStatus: async (id, status, remark = "") => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/retailers/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ status, remark }),
        },
      );
      if (!response.ok) throw new Error("Failed to update retailer status");
      return await response.json();
    } catch (error) {
      console.error("API Error (updateRetailerStatus):", error);
      throw error;
    }
  },

  // Unified Dashboard APIs
  getStaff: async () => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/dashboard/staff`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch staff list");
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("API Error (getStaff):", error);
      throw error;
    }
  },

  getDashboardStats: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}/api/dashboard/stats?${queryParams.toString()}`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("API Error (getDashboardStats):", error);
      throw error;
    }
  },

  getDashboardDetails: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}/api/dashboard/details?${queryParams.toString()}`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard details");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("API Error (getDashboardDetails):", error);
      throw error;
    }
  },

  exportDashboardData: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const url = `${BASE_URL}/api/dashboard/export?${queryParams.toString()}`;
      console.log("Initiating export request:", url);

      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      // 1. Check HTTP Status
      if (!response.ok) {
        const text = await response.text();
        console.error("Export failed with status:", response.status, text);
        throw new Error(`Export failed: ${response.status} ${text}`);
      }

      // 2. Check Content-Type Header
      const contentType = response.headers.get("content-type");
      console.log("Export response content-type:", contentType);

      if (
        contentType &&
        (contentType.includes("application/json") ||
          contentType.includes("text/plain"))
      ) {
        const errorText = await response.text();
        // Try to parse as JSON to get a clean message if possible
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(
            errorJson.message || errorJson.error || "Server returned an error",
          );
        } catch (e) {
          throw new Error(
            errorText || "Server returned text instead of a file",
          );
        }
      }

      // 3. Get Blob
      const responseBlob = await response.blob();
      console.log("Export blob size:", responseBlob.size);

      // 4. Sanity Check: If blob is tiny (< 100 bytes), it might be a hidden error text
      if (responseBlob.size < 100) {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(responseBlob);
        });

        // If it looks like JSON or an error message, treat it as such
        if (
          text.includes('"success":false') ||
          text.includes('"error"') ||
          text.includes("Error")
        ) {
          console.error("Small blob detected as error:", text);
          throw new Error(
            "Export failed: Server returned an error message instead of a file.",
          );
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const extension = params.format === "pdf" ? "pdf" : "xlsx";
      const filename = `dashboard_export_${timestamp}.${extension}`;

      if (Platform.OS === "web") {
        // Determine the correct MIME type
        const mimeType =
          params.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        // Create a new Blob with explicit MIME type (critical for Excel)
        const blob = new Blob([responseBlob], { type: mimeType });

        // Create blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", filename);
        link.target = "_blank"; // Helpful for some mobile browsers
        document.body.appendChild(link);

        console.log(`Triggering download for ${filename} (Size: ${blob.size})`);
        link.click();

        // Cleanup with delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      } else {
        console.log("Mobile download not yet implemented");
        throw new Error("Export is currently only supported on web");
      }

      return { success: true, filename };
    } catch (error) {
      console.error("API Error (exportDashboardData):", error);
      throw error;
    }
  },

  // Vendor APIs
  getVendors: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const url = `${BASE_URL}/api/vendors?${queryParams.toString()}`;
      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`Fetch failed for ${url}:`, text);
        throw new Error(`Failed to fetch vendors: ${response.status}`);
      }
      const json = await response.json();
      return json; // Backend returns { success, count, data, total }
    } catch (error) {
      console.error("API Error (getVendors):", error);
      console.warn(
        "Check: Is your backend running? Does it have app.use(cors())?",
      );
      throw error;
    }
  },

  getVendorById: async (id) => {
    try {
      const token =
        Platform.OS === "web" ? localStorage.getItem("auth_token") : null;
      const response = await fetchWithTimeout(`${BASE_URL}/api/vendors/${id}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch vendor details");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("API Error (getVendorById):", error);
      throw error;
    }
  },

  updateVendorStatus: async (id, status, remark = "") => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/vendors/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ status, remark }),
        },
      );
      if (!response.ok) throw new Error("Failed to update vendor status");
      return await response.json();
    } catch (error) {
      console.error("API Error (updateVendorStatus):", error);
      throw error;
    }
  },

  // Admin User Management (Staff Verification)
  getPendingUsers: async () => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/admin/users/pending`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch pending users");
      return await response.json();
    } catch (error) {
      console.error("API Error (getPendingUsers):", error);
      throw error;
    }
  },

  getStaffList: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const queryString = queryParams.toString();
      const url = `${BASE_URL}/api/admin/users/all-staff${queryString ? `?${queryString}` : ""}`;

      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) throw new Error("Failed to fetch staff list");
      return await response.json();
    } catch (error) {
      console.error("API Error (getStaffList):", error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/admin/users/${id}`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch user details");
      return await response.json();
    } catch (error) {
      console.error("API Error (getUserById):", error);
      throw error;
    }
  },

  approveUser: async (userId) => {
    try {
      // DIRECT BACKEND UPDATE (Port 5000)
      const url = `${BASE_URL}/api/admin/users/approve`;
      console.log(`[API SERVICE] Calling Approve User: ${url}`);

      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(
          `[API SERVICE] Approval Failed: ${response.status}`,
          text,
        );
        throw new Error("Failed to approve user");
      }
      return await response.json();
    } catch (error) {
      console.error("API Error (approveUser):", error);
      throw error;
    }
  },

  rejectUser: async (userId, reason) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/admin/users/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ userId, reason }),
        },
      );
      if (!response.ok) throw new Error("Failed to reject user");
      return await response.json();
    } catch (error) {
      console.error("API Error (rejectUser):", error);
      throw error;
    }
  },

  login: async (userid, password) => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ userid, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      return data;
    } catch (error) {
      console.error("API Error (login):", error);
      throw error;
    }
  },

  // Image/Document URL Helpers
  getRetailerPhotoUrl: (photoId) => {
    if (!photoId) return "";
    const idStr = String(photoId);
    if (idStr.startsWith("http")) {
      return idStr.includes("?")
        ? `${idStr}&ngrok-skip-browser-warning=true`
        : `${idStr}?ngrok-skip-browser-warning=true`;
    }
    return `${BASE_URL}/api/retailers/photos/${photoId}?ngrok-skip-browser-warning=true`;
  },
  getRetailerDocUrl: (docId) => {
    if (!docId) return "";
    const idStr = String(docId);
    if (idStr.startsWith("http")) {
      return idStr.includes("?")
        ? `${idStr}&ngrok-skip-browser-warning=true`
        : `${idStr}?ngrok-skip-browser-warning=true`;
    }
    return `${BASE_URL}/api/retailers/documents/${docId}?ngrok-skip-browser-warning=true`;
  },
  getVendorPhotoUrl: (photoId) => {
    if (!photoId) return "";
    const idStr = String(photoId);
    if (idStr.startsWith("http")) {
      return idStr.includes("?")
        ? `${idStr}&ngrok-skip-browser-warning=true`
        : `${idStr}?ngrok-skip-browser-warning=true`;
    }
    return `${BASE_URL}/api/vendors/photos/${photoId}?ngrok-skip-browser-warning=true`;
  },
  getVendorDocUrl: (docId) => {
    if (!docId) return "";
    const idStr = String(docId);
    if (idStr.startsWith("http")) {
      return idStr.includes("?")
        ? `${idStr}&ngrok-skip-browser-warning=true`
        : `${idStr}?ngrok-skip-browser-warning=true`;
    }
    return `${BASE_URL}/api/vendors/documents/${docId}?ngrok-skip-browser-warning=true`;
  },

  // Products
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.vendorId) queryParams.append("vendorId", params.vendorId);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.offset) queryParams.append("offset", params.offset);

      const url = `${BASE_URL}/api/products?${queryParams.toString()}`;
      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      return await response.json();
    } catch (error) {
      console.error("apiService.getProducts error:", error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const url = `${BASE_URL}/api/products/${id}`;
      const response = await fetchWithTimeout(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("apiService.getProductById error:", error);
      throw error;
    }
  },

  async updateProductStatus(id, status, remark) {
    try {
      const url = `${BASE_URL}/api/products/${id}/status`;
      const response = await fetchWithTimeout(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ status, remark }),
      });
      return await response.json();
    } catch (error) {
      console.error("apiService.updateProductStatus error:", error);
      throw error;
    }
  },

  getProductImageUrl(imageId) {
    return `${BASE_URL}/api/products/image/${imageId}`;
  },

  getLocations: async () => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/api/locations/unique`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) throw new Error("Failed to fetch location data");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("API Error (getLocations):", error);
      throw error;
    }
  },
};

