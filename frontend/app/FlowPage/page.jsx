"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/app/apifetch";

export default function FlowPage() {
  const [firms, setFirms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchFirms() {
      try {
        const token = localStorage.getItem("access");
        const res = await apiFetch(
          "http://localhost:8000/api/LLM/flow/firm/list/",
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        const data = await res.json();
        setFirms(data.firms || []);
      } catch (error) {
        console.error("Error fetching firms:", error);
      }
    }
    fetchFirms();
  }, []);

  const filteredFirms = firms.filter((firm) =>
    firm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600 text-white p-10">
      <h1 className="text-4xl font-bold text-center mb-6">The Flow</h1>

      {/* Search Bar */}
      <div className="flex justify-center mb-10">
        <input
          type="text"
          placeholder="Търси фирми..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />
      </div>

      {/* Firms or No Results */}
      {filteredFirms.length > 0 ? (
        <div
          className={`${
            isSearching
              ? "flex flex-wrap justify-center gap-8"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          }`}
        >
          {filteredFirms.map((firm) => (
            <div
              key={firm.id}
              className="backdrop-blur-md bg-black/60 hover:bg-black/70 transition-all duration-300 p-6 rounded-2xl shadow-2xl hover:scale-105"
            >
              {firm.image && (
                <div className="flex justify-center mb-4">
                  <img
                    src={firm.image}
                    alt="Profile"
                    className="w-24 h-24 object-cover rounded-full border-4 border-white/20 shadow-lg"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-center mb-2">
                {firm.name}
              </h2>
              <p className="text-gray-300 text-center mb-4 line-clamp-3">
                {firm.description}
              </p>
              <p className="text-center font-semibold">
                Creator:
                <span
                  className="ml-1 text-blue-400 hover:underline cursor-pointer"
                  onClick={() => router.push(`/user/${firm.id}`)}
                >
                  {firm.user_name}
                </span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-white/80 text-lg">Няма намерени фирми...</p>
        </div>
      )}

      <div className="flex justify-center mt-10">
        <button
          onClick={() => router.push("/")}
          className="mt-6 cursor-pointer bg-black/50 hover:bg-black/70 py-2 px-4 rounded-lg"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
