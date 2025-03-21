"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessInfoPage() {
  const [text, setText] = useState("");
  const router = useRouter();

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleButtonClick = () => {
    if (wordCount <= 500) {
      router.push("/businesstats");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Full Width Input */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Опиши бизнеса си в 0-500 думи
        </h2>
        <div className="relative ">
          <textarea
            className="w-full h-52 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none resize-none transition-all duration-300"
            placeholder="Пиши тук..."
            value={text}
            onChange={handleTextChange}
          ></textarea>
          <span className="absolute top-2 right-3 text-sm text-[#666]">
            {wordCount}/500
          </span>
        </div>
        <button
          onClick={handleButtonClick}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
            wordCount > 500
              ? "bg-[#222] text-[#555] cursor-not-allowed"
              : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
          }`}
          disabled={wordCount > 500}
        >
          Продължи
        </button>
      </div>

      {/* Right Side - Text Content */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#111] text-white">
        <h2 className="text-2xl font-bold mb-4">Защо е важно?</h2>
        <p className="text-lg text-[#ddd] leading-relaxed">
          Описанието на бизнеса ти помага на клиентите да разберат какво
          предлагаш. Колкото по-ясно и точно е описанието, толкова по-лесно ще
          достигнеш до правилните хора.
        </p>
        <h3 className="mt-6 text-xl font-semibold">Съвети:</h3>
        <ul className="list-disc pl-6 text-lg text-[#bbb]">
          <li>Бъди ясен и точен</li>
          <li>Използвай ключови думи</li>
          <li>Опиши уникалността на бизнеса си</li>
        </ul>
      </div>
    </div>
  );
}
