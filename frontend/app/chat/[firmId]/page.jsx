"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mainDocument, setMainDocument] = useState("");
  const { firmId } = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!firmId || !token) return;

    fetch(`http://localhost:8000/api/LLM/interactions/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setChatHistory(data.interactions || []))
      .catch((err) => console.error("Chat history error:", err));

    fetch(`http://localhost:8000/api/LLM/documents/main/${firmId}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMainDocument(data.main_document || ""))
      .catch((err) => console.error("Main doc error:", err));
  }, [firmId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://localhost:8000/api/LLM/submit/${firmId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: inputMessage.trim() }),
      });

      if (!res.ok) throw new Error("Грешка при съобщението");

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          user_prompt: inputMessage.trim(),
          ai_response: data.response,
          rag_context: data.rag_context || "",
        },
      ]);
      setInputMessage("");
    } catch (err) {
      console.error("Send Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadContext = (contextText, index) => {
    const blob = new Blob([contextText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `context_firm_${firmId}_msg_${index + 1}.txt`;
    link.click();
  };

  const toggleCheckbox = (index) => {
    setSelectedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Chat Interface with Gradient - 5/7 */}
      <div className="w-5/7 min-h-screen flex flex-col justify-start px-10 py-6 bg-gradient-to-br from-orange-400 to-red-500 text-white">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/home")}
            className="bg-black px-4 py-2 rounded hover:bg-black/70 transition"
          >
            Назад
          </button>
          <h2 className="text-xl font-bold">Фирма ID: {firmId}</h2>
          <button
            onClick={() => router.push("/rag_add")}
            className="bg-black px-4 py-2 rounded hover:bg-black/70 transition"
          >
            ➕ Добави RAG Контекст
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {chatHistory.length === 0 ? (
            <p className="text-gray-100">Няма съобщения.</p>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className="mb-6 p-6 rounded-lg bg-white/5 flex gap-4 items-start">
                <input
                  type="checkbox"
                  checked={selectedIndexes.includes(idx)}
                  onChange={() => toggleCheckbox(idx)}
                  className="mt-2 h-5 w-5 accent-white cursor-pointer"
                />
                <div className="flex-1">
                  <div className="mb-4 bg-neutral-800/15 p-4 rounded-lg">
                    <p className="mb-1">
                      <strong>🧑 Потребител:</strong> {msg.user_prompt}
                    </p>
                  </div>
                  <div className="mb-4 bg-neutral-800/15 p-4 rounded-lg">
                    <p className="mb-1">
                      <strong>🤖 AI:</strong> {msg.ai_response}
                    </p>
                  </div>
                  {msg.rag_context && (
                    <button
                      onClick={() => downloadContext(msg.rag_context, idx)}
                      className="text-sm mt-2 px-3 py-1 rounded bg-black/40 hover:bg-black/60 transition"
                    >
                      📄 Изтегли контекста
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex mt-6">
          <input
            type="text"
            className="flex-1 p-4 bg-black/40 text-white border border-white/30 rounded-l-lg focus:outline-none"
            placeholder="Въведи съобщение..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className={`px-6 py-4 rounded-r-lg transition-all duration-300 ${
              loading || !inputMessage.trim()
                ? "bg-black/30 text-white/30 cursor-not-allowed"
                : "bg-black hover:bg-black/70"
            }`}
          >
            Изпрати
          </button>
        </div>
      </div>

      {/* Right: Main Document - 2/7, Black background */}
      <div className="w-2/7 min-h-screen bg-black text-white p-6 overflow-y-auto border-l border-white/10">
        <h2 className="text-2xl font-bold mb-4 text-center">Основен документ</h2>
        {mainDocument ? (
          <div className="text-sm whitespace-pre-wrap text-gray-300 leading-relaxed">
            {mainDocument}
          </div>
        ) : (
          <p className="text-gray-500 text-center">Няма документ.</p>
        )}
      </div>
    </div>
  );
}
