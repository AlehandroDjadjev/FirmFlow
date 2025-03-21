"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessStatsPage() {
  const [stats, setStats] = useState("");
  const router = useRouter();

  const handleTextChange = (e) => {
    setStats(e.target.value);
  };

  const wordCount = stats
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleButtonClick = () => {
    if (wordCount > 500) {
      alert("Текстът не трябва да надвишава 500 думи.");
      return;
    }
    // Retrieve and update firmData with budget info
    const storedData = localStorage.getItem("firmData");
    let firmData = storedData ? JSON.parse(storedData) : {};
    firmData.budget = stats.trim();
    localStorage.setItem("firmData", JSON.stringify(firmData));
    // Navigate to final page
    router.push("/businessfuture");
  };

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen">
      {/* Left Side - Input */}
=======
    <div className="flex min-h-screen bg-black">
      {/* Left Side - Centered Input and Button */}
>>>>>>> 420364e2a51d25de2713158d0f2907a4b32c3a12
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Опиши мащаба на бизнеса си (бюджет, екип, печалба и т.н.)
        </h2>
        <div className="relative">
          <textarea
            className="w-full h-52 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none resize-none transition-all duration-300"
            placeholder="Пиши тук..."
            value={stats}
            onChange={handleTextChange}
          ></textarea>
          <span className="absolute top-2 right-3 text-sm text-[#666]">
            {wordCount}/500
          </span>
        </div>
        <button
          onClick={handleButtonClick}
          disabled={wordCount > 500}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${wordCount > 500
            ? "bg-[#222] text-[#555] cursor-not-allowed"
            : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
            }`}
        >
          Продължи
        </button>
      </div>

      {/* Right Side - Centered Info Box with Gradient Background */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-blue-400 to-red-500 to-purple-400 text-white bg-opacity-80 backdrop-blur-lg shadow-lg">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Защо тези данни са важни?
          </h2>
          <p className="text-left text-gray-300 leading-relaxed text-center">
            Разбирането на мащаба на твоя бизнес ти помага да планираш ресурси,
            инвестиции и растеж. Колкото по-добре познаваш числата, толкова
            по-ефективно можеш да вземаш решения.
          </p>
          <h3 className="mt-6 text-xl font-semibold text-center">
            Какво можеш да включиш?
          </h3>
          <ul className="list-disc pl-6 text-lg text-gray-400 space-y-2">
            <li className="text-left">Годишен приход и разходи</li>
            <li className="text-left">Брой служители и партньори</li>
            <li className="text-left">Инвестиции и дългове</li>
            <li className="text-left">Ключови финансови показатели</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
