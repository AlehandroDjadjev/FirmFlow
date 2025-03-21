"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../apifetch";

export default function DomainCheckPage() {
  const [domain, setDomain] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDomainChange = (e) => {
    setDomain(e.target.value);
    setError("");
    setSuggestions("");
  };

  const handleCheckDomain = async () => {
    if (!domain.trim()) {
      setError("Моля, въведете домейн.");
      return;
    }
    setLoading(true);
    try {
      // Retrieve the JWT token from localStorage
      const token = localStorage.getItem("access");
      const response = await apiFetch("http://localhost:8000/api/LLM/firms/name/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the JWT token in the Authorization header
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Грешка при проверката на домейна.");
        setLoading(false);
        return;
      }
      if (data.message && data.message.includes("available")) {
        // Domain is available: save domain info and proceed
        const storedData = localStorage.getItem("firmData");
        let firmData = storedData ? JSON.parse(storedData) : {};
        firmData.domain = domain.trim();
        localStorage.setItem("firmData", JSON.stringify(firmData));
        router.push("/nextPage"); // Navigate to the next page (adjust route as needed)
      } else {
        // Domain is taken: show alternative suggestions from ChatGPT
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      setError("Нещо се обърка. Моля, опитайте по-късно.");
    }
    setLoading(false);
  };

  const handleSkip = () => {
    // Option to skip domain creation: save empty domain and proceed
    const storedData = localStorage.getItem("firmData");
    let firmData = storedData ? JSON.parse(storedData) : {};
    firmData.domain = "";
    localStorage.setItem("firmData", JSON.stringify(firmData));
    router.push("/nextPage"); // Navigate to the next page (adjust route as needed)
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Input and Buttons */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Въведи желания домейн за твоя бизнес
        </h2>
        <input
          type="text"
          value={domain}
          onChange={handleDomainChange}
          placeholder="например: mojibiznes.bg"
          className="w-full h-12 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none transition-all duration-300"
        />
        {error && (
          <p className="mt-2 text-red-500 text-sm">{error}</p>
        )}
        {suggestions && (
          <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg text-white">
            <h3 className="font-semibold mb-2">Алтернативни предложения:</h3>
            <p>{suggestions}</p>
          </div>
        )}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleCheckDomain}
            disabled={loading}
            className={`w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
              loading
                ? "bg-[#222] text-[#555] cursor-not-allowed"
                : "bg-[#181818] text-white hover:bg-[#292929]"
            }`}
          >
            {loading ? "Проверка..." : "Провери домейн"}
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 bg-[#292929] text-white hover:bg-[#3a3a3a]"
          >
            Пропусни
          </button>
        </div>
      </div>

      {/* Right Side - Info Box */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-blue-400 to-red-500 to-purple-400 bg-opacity-80 backdrop-blur-lg shadow-lg">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Защо е важен домейнът?
          </h2>
          <p className="text-center text-gray-300 leading-relaxed mb-4">
            Добре подбраният домейн изгражда доверие, запомняемост и професионален имидж.
            Той може да бъде ключов за успеха на твоя бизнес онлайн.
          </p>
          <h3 className="mt-6 text-xl font-semibold text-center">
            Какво трябва да бъде?
          </h3>
          <ul className="list-disc pl-6 text-lg text-gray-400 space-y-2">
            <li>Кратък и запомнящ се</li>
            <li>Лесен за изписване и произнасяне</li>
            <li>Отразява същността на твоя бизнес</li>
            <li>Професионален и модерен</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
