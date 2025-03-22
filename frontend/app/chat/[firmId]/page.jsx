"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiMaximize2, FiMinimize2, FiDownload } from "react-icons/fi";
import  apiFetch  from "@/app/apifetch";

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [firmName, setFirmName] = useState("");
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mainDocument, setMainDocument] = useState("");
  const { firmId } = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!firmId || !token) return;

    apiFetch(`http://localhost:8000/api/LLM/interactions/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setChatHistory(data.interactions || []))
      .catch((err) => console.error("Chat history error:", err));

    apiFetch(`http://localhost:8000/api/LLM/firm/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFirmName(data.name))
      .catch((err) => console.error("Name fetching error:", err));

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
      <div className="w-5/7 min-h-screen flex flex-col justify-start px-10 py-6 bg-gradient-to-br from-orange-400 to-red-500 text-white">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/home")}
            className="bg-[#0e0e0e]/80 px-4 py-2 rounded hover:[#292929]/70 cursor-pointer"
          >
            Назад
          </button>
          <h2 className="text-xl font-bold cursor-default">{firmName}</h2>
          <button
            onClick={() => router.push("/rag_add")}
            className="bg-[#0e0e0e]/80 px-4 py-2 rounded hover:[#292929]/70 cursor-pointer"
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
                ? "bg-[#0e0e0e]/70 text-white/30 cursor-not-allowed"
                : "bg-[#0e0e0e]/80 hover:[#292929]/70 cursor-pointer"
            }`}
          >
            Изпрати
          </button>
        </div>
      </div>

      <div className="w-2/7 min-h-screen bg-black text-white p-6 overflow-y-auto border-l border-white/10">
      <div
  className={`${
    isExpanded
      ? "fixed top-0 left-0 w-full h-full z-50 bg-black p-6"
      : "w-full min-h-screen bg-black text-white p-6 border-l border-white/10"
  } transition-all duration-300 overflow-y-auto`}
>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold text-center flex-1">Основен документ</h2>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const blob = new Blob([mainDocument], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `firm_${firmId}_plan.txt`;
            link.click();
          }}
          title="Изтегли"
          className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded"
        >
          <FiDownload />
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Намали" : "Разшири"}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded"
        >
          {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>
  </div>

  {mainDocument ? (
    <div className="text-sm whitespace-pre-wrap text-gray-300 leading-relaxed bg-neutral-900 p-4 rounded-lg">
      {mainDocument}
    </div>
  ) : (
    <p className="text-gray-500 text-center">Няма документ.</p>
  )}
</div>
      </div>
    </div>
  );
}
