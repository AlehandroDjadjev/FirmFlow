"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import  apiFetch  from "@/app/apifetch";

export default function RAGUploadPage() {
  const [ragText, setRagText] = useState("");
  const [ragUrl, setRagUrl] = useState("");
  const [ragFile, setRagFile] = useState(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const wordCount = ragText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleSubmit = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Липсва токен за достъп.");
      return;
    }

    if (!ragText && !ragUrl && !ragFile) {
      alert("Моля, попълни текст, линк или качи PDF файл.");
      return;
    }

    if (wordCount > 500) {
      alert("Текстът не трябва да надвишава 500 думи.");
      return;
    }

    const formData = new FormData();
    if (ragText) formData.append("rag_EXTRA", ragText);
    if (ragUrl) formData.append("url", ragUrl);
    if (ragFile) formData.append("pdf_file", ragFile);

    setLoading(true);
    setMessage("");

    try {
      const response = await apiFetch("http://localhost:8000/api/LLM/rag/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Грешка при качване.");
      }

      setMessage("✅ Успешно изпратихме информацията в системата.");
      setRagText("");
      setRagUrl("");
      setRagFile(null);
    } catch (error) {
      setMessage(`❌ Грешка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left side: Upload Form */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center px-20 bg-[#0a0a0a] space-y-6">
        <h2 className="text-3xl font-semibold text-white">
          Качи информация към RAG модела
        </h2>

        <div>
          <label className="text-white block mb-2">Текст:</label>
          <textarea
            className="w-full h-32 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg"
            placeholder="Въведи текст..."
            value={ragText}
            onChange={(e) => setRagText(e.target.value)}
          />
          <span className="text-sm text-[#666]">{wordCount}/500 думи</span>
        </div>

        <div>
          <label className="text-white block mb-2">URL линк:</label>
          <input
            type="text"
            className="w-full p-3 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg"
            placeholder="https://example.com"
            value={ragUrl}
            onChange={(e) => setRagUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="text-white block mb-2">Качи PDF файл:</label>
          <input
            type="file"
            accept=".pdf"
            className="text-white"
            onChange={(e) => setRagFile(e.target.files[0])}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 ${
            loading
              ? "bg-[#222] text-[#555] cursor-not-allowed"
              : "bg-[#181818] cursor-pointer text-white hover:bg-[#292929]"
          }`}
        >
          {loading ? "Изчакване..." : "Изпрати към RAG"}
        </button>

        <button
          onClick={() => router.push("/home")}
          className="w-full py-3 text-lg font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
        >
          ⬅️ Назад към началото
        </button>

        {message && <p className="text-white">{message}</p>}
      </div>

      {/* Right side: Info Section */}
      <div className="w-1/2 min-h-screen flex justify-center items-center px-16 bg-gradient-to-br from-purple-600 to-indigo-800 text-white">
        <div className="bg-black/90 rounded-lg max-w-lg w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Какво да качиш?</h2>
          <p className="text-gray-300 text-center mb-4">
            Използвай текст, PDF файлове или линкове, за да обучим модела да бъде по-информиран.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-400 text-lg">
            <li>Маркетингови стратегии</li>
            <li>Правни документи (PDF)</li>
            <li>Описания на услуги или продукти</li>
            <li>Информация от уебсайтове</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
