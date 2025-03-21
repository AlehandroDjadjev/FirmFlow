"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../apifetch";

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
      const response = await apiFetch(
        "http://localhost:8000/api/LLM/firms/initialize/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(firmData),
        }
      );
      if (!response.ok) {
        throw new Error("Грешка при изпращането на данните");
      }
      // Optionally process the response here if needed
      // After success, clear localStorage data and redirect to the home page
      localStorage.removeItem("firmData");
      router.push("/home");
    } catch (error) {
      setMessage(`Грешка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Side - Input Section */}
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
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
            wordCount > 500 || loading
              ? "bg-[#222] text-[#555] cursor-not-allowed"
              : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
          }`}
        >
          {loading ? "Изчакване..." : "Завърши и изпрати"}
        </button>
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>

      {/* Right Side - Info Section with Gradient */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-orange-4 00 to-red-600 to-red-400 text-white bg-opacity-80 backdrop-blur-lg shadow-lg">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Как изглежда бъдещето?
          </h2>
          <p className="text-left text-gray-300 leading-relaxed text-center">
            За да развиеш успешен бизнес, трябва да имаш ясна визия за бъдещето.
            Опиши своите идеи, цели и стратегии за развитие.
          </p>
          <h3 className="mt-6 text-xl font-semibold text-center">
            Полезни въпроси:
          </h3>
          <ul className="list-disc pl-6 text-lg text-gray-400 space-y-2">
            <li className="text-left">
              Как ще изглежда бизнесът ти след 5 години?
            </li>
            <li className="text-left">Какви иновации ще внедриш?</li>
            <li className="text-left">Как ще се отличаваш от конкуренцията?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
