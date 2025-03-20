"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessInfoPage() {
  const [text, setText] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);
  const router = useRouter();

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleButtonClick = (e) => {
    setButtonClicked(true);
    if (wordCount <= 500) {
      router.push("/businesstats");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black font-sans">
      <div className="mb-5 text-2xl text-gray-200 font-semibold">
        Опиши бизнеса си в 0-500 думи
      </div>
      <div className="relative w-96">
        <textarea
          className="w-full h-36 p-2 text-lg text-white rounded-lg border border-gray-300 shadow-sm resize-none transition-all duration-300 ease-in-out focus:border-blue-500 focus:shadow-lg"
          placeholder="Пиши тук..."
          value={text}
          onChange={handleTextChange}
        ></textarea>
        <div className="absolute bottom-2 right-2 text-gray-200 transition-all duration-300 ease-in-out">
          {wordCount}/500
        </div>
      </div>
      <button
        onClick={handleButtonClick}
        className={`bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105 ${
          wordCount > 500 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={wordCount > 500}
      >
        Продължи
      </button>
    </div>
  );
}
