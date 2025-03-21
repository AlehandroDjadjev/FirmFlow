"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import  apiFetch  from "@/app/apifetch";

export default function HomePage() {
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchFirms() {
      try {
        const token = localStorage.getItem("access");
        const res = await apiFetch("http://localhost:8000/api/LLM/firms/list/", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        setFirms(data.firms || []);
      } catch (error) {
        console.error("Error fetching firms:", error);
      }
    }
    fetchFirms();
  }, []);

  const handleSelectFirm = () => {
    if (selectedFirm) {
      router.push(`/dashboard/${selectedFirm}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600 text-white flex flex-col items-center transition-all duration-600">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full bg-[#121212]/70 backdrop-blur-md py-4 px-6 flex items-center justify-between shadow-md z-10">
        <button
          onClick={() => router.push("/")}
          className="py-2 px-4 bg-[#1a1a1a]/60 rounded-lg hover:bg-[#292929]/60 transition cursor-pointer"
        >
          Назад към началото
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold">
          FirmFlow
        </h1>
        <div className="w-16" /> {/* Empty div for symmetry */}
      </div>
  
      {/* Main Content */}
      <div className="w-full flex flex-col items-center mt-24 space-y-6 ">
        {/* Stats Section */}
        <motion.div
          className="bg-[#1a1a1a]/50 p-6 rounded-xl w-[400px] text-center shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold mb-2">Информация за платформата</h2>
          <p className="text-gray-400">Фирми в системата: {firms.length}</p>
          <p className="text-gray-400">Анализирани проекти: 120+</p>
        </motion.div>
  
        {/* Selection Container */}
        <motion.div
          className="bg-[#121212]/70 backdrop-blur-md p-8 rounded-xl shadow-lg flex flex-col items-center w-[400px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold mb-4">Изберете фирма:</h2>
  
          {/* Dropdown Selection */}
          <select
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white text-lg focus:outline-none cursor-pointer appearance-none"
            value={selectedFirm || ""}
            onChange={(e) => setSelectedFirm(e.target.value)}
          >
            <option className="bg-[#24152e] hover:bg-[#3a3a3a] text-gray-400 rounded-lg" value="" disabled>
              -- Изберете фирма --
            </option>
            {firms.map((firm) => (
              <option
                className="p-3 bg-[#1a1a1a]/70 hover:bg-[#333333] text-white rounded-lg"
                key={firm.id}
                value={firm.id}
              >
                {firm.name}
              </option>
            ))}
          </select>
  
          {/* Select Button */}
          <button
            onClick={handleSelectFirm}
            disabled={!selectedFirm}
            className={`mt-4 px-6 py-3 rounded-lg text-lg font-semibold transition cursor-pointer ${
              selectedFirm
                ? "bg-[#1a1a1a]/70 hover:bg-[#3a3a3a]"
                : "bg-[#1a1a1a]/60 text-gray-400 cursor-not-allowed"
            }`}
          >
            Влез
          </button>
        </motion.div>
  
        {/* Button to Go Back to Hero Page */}
        <motion.button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-[#1a1a1a]/70 rounded-lg text-lg font-semibold hover:bg-[#292929]/70 transition cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Начална страница
        </motion.button>
      </div>
    </div>
  );
  
}
