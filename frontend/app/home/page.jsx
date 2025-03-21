"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [firms, setFirms] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const getAccessToken = async () => {
    let accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || checkTokenExpiration(accessToken)) {
      if (!refreshToken || checkTokenExpiration(refreshToken)) {
        console.error("Tokens expired, logging out.");
        logoutUser();
        return null;
      }
      try {
        const res = await fetch("http://localhost:8000/api/token/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("access_token", data.access);
          return data.access;
        } else {
          console.error("Failed to refresh token");
          logoutUser();
          return null;
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
        logoutUser();
        return null;
      }
    }
    return accessToken;
  };

  const logoutUser = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login"); // Redirect to login page
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchFirms = async () => {
      if (isAuthenticated === false) return;
      const token = await getAccessToken();
      if (!token) return;
      
      try {
        const res = await fetch("http://localhost:8000/api/REST/list-firms/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFirms(data.firms);
        } else {
          console.error("Failed to fetch firms");
        }
      } catch (error) {
        console.error("Error fetching firms:", error);
      }
    };

    if (isAuthenticated) {
      fetchFirms();
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Вашите фирми</h2>
      <ul>
        {firms.map((firm) => (
          <li key={firm.id} className="border p-3 rounded mb-2 flex justify-between items-center">
            <span>{firm.name}</span>
            <button onClick={() => router.push(`/chat?firm_id=${firm.id}`)} className="bg-blue-500 text-white px-3 py-1 rounded">
              Чат
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function checkTokenExpiration(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}
