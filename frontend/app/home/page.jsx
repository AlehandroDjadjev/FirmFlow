"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [businesses, setBusinesses] = useState([]);

  // Simulating fetching businesses from localStorage or an API
  useEffect(() => {
    // Example: Loading some dummy businesses
    const savedBusinesses =
      JSON.parse(localStorage.getItem("businesses")) || [];
    setBusinesses(savedBusinesses);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black font-sans">
      <div className="mb-5 text-2xl text-gray-200 font-semibold">
        Всички мои проекти
      </div>

      {businesses.length === 0 ? (
        <div className="text-gray-400">Нямате добавени проекти.</div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business, index) => (
            <div
              key={index}
              className="w-96 p-4 bg-gray-700 text-white rounded-xl shadow-md"
            >
              <h3 className="text-xl font-semibold">{business.name}</h3>
              <p>{business.description}</p>
            </div>
          ))}
        </div>
      )}

      <Link href="/businessinfo">
        <button className="mt-5 bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105">
          Добави нов проект
        </button>
      </Link>
    </div>
  );
}
