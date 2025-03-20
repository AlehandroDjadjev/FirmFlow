"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessFuturePage() {
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

  const handleButtonClick = () => {
    setButtonClicked(true);
    if (wordCount <= 500) {
      router.push("/completionpage");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen font-sans relative min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

      <div className="relative mb-5 text-2xl text-white font-semibold z-10 text-center">
        Опиши бъдещето, което искаш за бизнеса си
      </div>

      <div className="relative w-96 z-10">
        <textarea
          className="w-full h-36 p-2 text-lg text-white bg-black/50 rounded-lg shadow-sm resize-none transition-all duration-300 ease-in-out focus:border-blue-500 focus:shadow-lg"
          placeholder="Пиши тук..."
          value={text}
          onChange={handleTextChange}
        ></textarea>
        <div className="absolute bottom-2 right-2 text-gray-200 transition-all duration-300 ease-in-out">
          {wordCount}/500
        </div>
      </div>

      {buttonClicked && wordCount > 500 && (
        <div className="mt-2 text-red-500 transition-opacity duration-300 ease-in-out opacity-100 animate-bounce z-10">
          Максималният брой думи е 500
        </div>
      )}

      <button
        onClick={handleButtonClick}
        className={`mt-4 bg-gray-700 cursor-pointer hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105 ${
          wordCount > 500 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={wordCount > 500}
      >
        Продължи
      </button>
    </div>
  );
}
