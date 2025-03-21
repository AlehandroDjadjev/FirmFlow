"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessInfoPage() {
  const [firmName, setFirmName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleFirmNameChange = (e) => {
    setFirmName(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const descriptionWordCount = description
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleButtonClick = () => {
    if (firmName.trim() === "") {
      alert("Моля, въведете името на фирмата.");
      return;
    }
    if (descriptionWordCount > 500) {
      alert("Описанието не трябва да надвишава 500 думи.");
      return;
    }
    // Save values to localStorage
    const firmData = {
      name: firmName.trim(),
      description: description.trim(),
    };
    localStorage.setItem("firmData", JSON.stringify(firmData));
    // Navigate to next page
    router.push("/businesstats");
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Side - Centered Input and Button */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">Въведи данни за фирмата</h2>
        <input
          type="text"
          placeholder="Име на фирмата"
          value={firmName}
          onChange={handleFirmNameChange}
          className="w-full mb-4 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none transition-all duration-300"
        />
        <h2 className="text-3xl font-semibold text-white mb-6">
          Опиши бизнеса си в 0-500 думи
        </h2>
        <div className="relative">
          <textarea
            className="w-full h-52 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none resize-none transition-all duration-300"
            placeholder="Пиши тук..."
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
          <span className="absolute top-2 right-3 text-sm text-[#666]">
            {descriptionWordCount}/500
          </span>
        </div>
        <button
          onClick={handleButtonClick}
          disabled={descriptionWordCount > 500 || firmName.trim() === ""}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
            descriptionWordCount > 500 || firmName.trim() === ""
              ? "bg-[#222] text-[#555] cursor-not-allowed"
              : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
          }`}
        >
          Продължи
        </button>
      </div>

      {/* Right Side - Left-Aligned Text Content */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-green-400 via-yellow-500 to-yellow-400 text-white bg-opacity-80 backdrop-blur-lg shadow-lg">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Защо е важно?</h2>
          <p className="text-left text-gray-300 leading-relaxed text-center">
            Описанието на бизнеса ти помага на клиентите да разберат какво
            предлагаш. Колкото по-ясно и точно е описанието, толкова по-лесно ще
            достигнеш до правилните хора.
          </p>
          <h3 className="mt-6 text-xl font-semibold text-center">Съвети:</h3>
          <ul className="list-disc pl-6 text-lg text-gray-400 space-y-2">
            <li className="text-left">Бъди ясен и точен</li>
            <li className="text-left">Използвай ключови думи</li>
            <li className="text-left">Опиши уникалността на бизнеса си</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
