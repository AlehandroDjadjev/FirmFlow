"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessFuturePage() {
  const [future, setFuture] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleTextChange = (e) => {
    setFuture(e.target.value);
  };

  const wordCount = future
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleButtonClick = async () => {
    if (wordCount > 500) {
      alert("Текстът не трябва да надвишава 500 думи.");
      return;
    }
    // Retrieve existing firm data and add future info
    const storedData = localStorage.getItem("firmData");
    let firmData = storedData ? JSON.parse(storedData) : {};
    firmData.future = future.trim();
    localStorage.setItem("firmData", JSON.stringify(firmData));

    // Retrieve the JWT token from localStorage under the key "access"
    const token = localStorage.getItem("access");

    // Send complete firmData to API with the JWT token in headers
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/LLM/initialize_firm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(firmData)
      });
      if (!response.ok) {
        throw new Error("Грешка при изпращането на данните");
      }
      // Optionally process the response here if needed
      // After success, clear localStorage data and redirect to the home page
      localStorage.removeItem("firmData");
      router.push("/");
    } catch (error) {
      setMessage(`Грешка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Input */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Опиши бъдещето на бизнеса си
        </h2>
        <div className="relative">
          <textarea
            className="w-full h-52 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none resize-none transition-all duration-300"
            placeholder="Пиши тук..."
            value={future}
            onChange={handleTextChange}
          ></textarea>
          <span className="absolute top-2 right-3 text-sm text-[#666]">
            {wordCount}/500
          </span>
        </div>
        <button
          onClick={handleButtonClick}
          disabled={wordCount > 500 || loading}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${wordCount > 500 || loading
            ? "bg-[#222] text-[#555] cursor-not-allowed"
            : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
            }`}
        >
          {loading ? "Изчакване..." : "Завърши и изпрати"}
        </button>
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>

      {/* Right Side - Informational Content */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#111] text-white">
        <h2 className="text-2xl font-bold mb-4">Защо тези данни са важни?</h2>
        <p className="text-lg text-[#ddd] leading-relaxed">
          Информацията за бъдещето на бизнеса ти помага да планираш стратегии и да очертаеш целите си.
          Тези данни са важни за дългосрочното развитие.
        </p>
        <h3 className="mt-6 text-xl font-semibold">Съвети:</h3>
        <ul className="list-disc pl-6 text-lg text-[#bbb]">
          <li>Бъди амбициозен, но реалистичен</li>
          <li>Определи конкретни цели</li>
          <li>Мисли за растеж и иновации</li>
        </ul>
      </div>
    </div>
  );
}
