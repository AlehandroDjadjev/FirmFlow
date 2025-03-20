"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const savedBusinesses =
      JSON.parse(localStorage.getItem("businesses")) || [];
    setBusinesses(savedBusinesses);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen font-sans relative min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" />

      <div className="relative text-2xl text-white font-semibold z-10">
        Всички мои проекти
      </div>

      {businesses.length === 0 ? (
        <div className="relative text-gray-300 z-10 mt-2">
          Нямате добавени проекти.
        </div>
      ) : (
        <div className="relative space-y-4 z-10 mt-4">
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
        <button className="relative mt-5 cursor-pointer bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105 z-10">
          Добави нов проект
        </button>
      </Link>
    </div>
  );
}
