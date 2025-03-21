const API_URL = "http://127.0.0.1:8000";

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export default async function apiFetch(url, options = {}) {
  try {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = localStorage.getItem("refresh");
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const refreshResponse = await fetch(`${API_URL}/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (!refreshResponse.ok) {
            throw new Error("Failed to refresh token");
          }

          const { access } = await refreshResponse.json();
          localStorage.setItem("accessToken", access);
          onRefreshed(access);

          // Retry original request with new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${access}`,
            },
          });
        } catch (error) {
          refreshSubscribers = [];
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("user");

          // Store current path for redirect after login
          const currentPath = window.location.pathname;
          if (currentPath !== "/login") {
            localStorage.setItem("redirectAfterLogin", currentPath);
          }

          window.location.href = "/login";
          throw error;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for the token refresh
        const newToken = await new Promise((resolve) => {
          refreshSubscribers.push(resolve);
        });

        // Retry the original request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  } catch (error) {
    if (
      error.message.includes("No access token") ||
      error.message.includes("Failed to refresh token")
    ) {
      window.location.href = "/login";
    }
    throw error;
  }
}
