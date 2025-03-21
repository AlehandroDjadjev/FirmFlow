"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [firms, setFirms] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchFirms() {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch("http://localhost:8000/api/LLM/firms/list/", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        // Assuming response structure: { firms: [ { id, name, ... }, ... ] }
        setFirms(data.firms);
      } catch (error) {
        console.error("Error fetching firms:", error);
      }
    }
    fetchFirms();
  }, []);

  const handleFirmClick = (firmId) => {
    router.push(`/chat/${firmId}`);
  };

  return (
    <div className="flex min-h-screen">
      {/* Vertical Navigation Sidebar */}
      <div className="w-1/4 bg-[#0a0a0a] p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Фирми</h2>
        {firms.length === 0 ? (
          <p className="text-white">Няма налични фирми</p>
        ) : (
          <ul>
            {firms.map((firm) => (
              <li key={firm.id} className="mb-4">
                <button
                  onClick={() => handleFirmClick(firm.id)}
                  className="w-full py-2 px-4 bg-[#181818] text-white rounded hover:bg-[#292929] transition-colors duration-300"
                >
                  {firm.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-3/4 bg-[#111] p-10 text-white flex items-center justify-center">
        <div>
          <h1 className="text-3xl font-bold mb-4">Добре дошли!</h1>
          <p className="text-lg">
            Изберете фирма от лявата навигация, за да започнете чат с AI бота.
          </p>
        </div>
      </div>
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
