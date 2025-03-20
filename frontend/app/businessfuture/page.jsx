"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessFuturePage() {
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
      router.push("/completionpage");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Full Width Input */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Опиши бъдещето, което искаш за бизнеса си
        </h2>
        <div className="relative">
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
        <h2 className="text-2xl font-bold mb-4">Как изглежда бъдещето?</h2>
        <p className="text-lg text-[#ddd] leading-relaxed">
          За да развиеш успешен бизнес, трябва да имаш ясна визия за бъдещето.
          Опиши своите идеи, цели и стратегии за развитие.
        </p>
        <h3 className="mt-6 text-xl font-semibold">Полезни въпроси:</h3>
        <ul className="list-disc pl-6 text-lg text-[#bbb]">
          <li>Как ще изглежда бизнесът ти след 5 години?</li>
          <li>Какви иновации ще внедриш?</li>
          <li>Как ще се отличаваш от конкуренцията?</li>
        </ul>
      </div>
    </div>
  );
}
