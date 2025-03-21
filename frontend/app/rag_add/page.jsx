"use client";

import React, { useState } from "react";

export default function RAGUploadPage() {
  const [rag_EXTRA, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const wordCount = rag_EXTRA
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleSubmit = async () => {
    if (wordCount > 500) {
      alert("Текстът не трябва да надвишава 500 думи.");
      return;
    }

    const token = localStorage.getItem("access");

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/LLM/rag/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization" : `Bearer ${token}`,
        },
        body: JSON.stringify({ rag_EXTRA }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Грешка при качване на текста.");
      }

      setMessage("Успешно изпратихме информацията в системата.");
      setText("");
    } catch (error) {
      setMessage(`Грешка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left side: input */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Качи информация към RAG модела
        </h2>
        <div className="relative">
          <textarea
            className="w-full h-52 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg focus:ring-2 focus:ring-[#222] focus:outline-none resize-none transition-all duration-300"
            placeholder="Въведи текста тук..."
            value={rag_EXTRA}
            onChange={handleTextChange}
          ></textarea>
          <span className="absolute top-2 right-3 text-sm text-[#666]">
            {wordCount}/500
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={wordCount > 500 || loading}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
            wordCount > 500 || loading
              ? "bg-[#222] text-[#555] cursor-not-allowed"
              : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
          }`}
        >
          {loading ? "Изчакване..." : "Изпрати към RAG"}
        </button>
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>

      {/* Right side: info */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-purple-600 to-indigo-800 text-white bg-opacity-80 backdrop-blur-lg shadow-lg">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Какво да качиш?
          </h2>
          <p className="text-left text-gray-300 leading-relaxed text-center">
            Това поле е предназначено за качване на текстова информация, която
            ще бъде използвана от нашия AI модел, за да дава по-информирани
            отговори и предложения.
          </p>
          <h3 className="mt-6 text-xl font-semibold text-center">
            Примери за подходяща информация:
          </h3>
          <ul className="list-disc pl-6 text-lg text-gray-400 space-y-2">
            <li className="text-left">Маркетингова стратегия</li>
            <li className="text-left">Описания на продукти и услуги</li>
            <li className="text-left">Проучвания на пазара</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
