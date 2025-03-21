"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "../apifetch";

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [updatedPlan, setUpdatedPlan] = useState("");
  const { firmId } = useParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchChatHistory() {
      try {
        const token = localStorage.getItem("access");
        const res = await apiFetch(
          `http://localhost:8000/api/LLM/interactions/${firmId}/`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        const data = await res.json();
        // Ensure chatHistory is an array even if the property is missing.
        setChatHistory(
          Array.isArray(data.interactions) ? data.interactions : []
        );
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    }
    if (firmId) {
      fetchChatHistory();
    }
  }, [firmId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://localhost:8000/api/LLM/submit/${firmId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ prompt: inputMessage.trim() }),
        }
      );
      if (!res.ok) {
        throw new Error("Грешка при изпращането на съобщението");
      }
      const data = await res.json();
      // Use consistent keys for the message object.
      const newMessage = {
        user_prompt: inputMessage.trim(),
        ai_response: data.response,
      };
      setChatHistory((prev) => [...prev, newMessage]);
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (message, isChecked) => {
    // Combine the message text without altering its content.
    const combinedMessage = `Потребител: ${message.user_prompt}\nAI: ${message.ai_response}`;
    if (isChecked) {
      setSelectedMessages((prev) => [...prev, combinedMessage]);
    } else {
      setSelectedMessages((prev) =>
        prev.filter((msg) => msg !== combinedMessage)
      );
    }
  };

  const handleIncorporatePitch = async () => {
    if (selectedMessages.length === 0) {
      alert("Моля, изберете поне едно съобщение.");
      return;
    }
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://localhost:8000/api/LLM/firms/${firmId}/update-main-document/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ selected_messages: selectedMessages }),
        }
      );
      if (!res.ok) {
        throw new Error("Грешка при актуализиране на плана.");
      }
      const data = await res.json();
      setUpdatedPlan(data.updated_plan);
    } catch (error) {
      console.error("Error incorporating pitch:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-1/4 bg-[#0a0a0a] p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Фирми</h2>
        <button
          onClick={() => router.push("/")}
          className="w-full py-2 px-4 bg-[#181818] text-white rounded hover:bg-[#292929] transition-colors duration-300 mb-4"
        >
          Назад към Фирми
        </button>
      </div>

      <div className="w-3/4 bg-[#111] p-10 text-white flex flex-col">
        <h1 className="text-3xl font-bold mb-6">Чат за фирма ID: {firmId}</h1>
        <div className="flex-1 overflow-y-auto mb-6">
          {chatHistory.length === 0 ? (
            <p>Няма чат история.</p>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className="flex items-start mb-4">
                <input
                  type="checkbox"
                  className="mt-2 mr-2"
                  onChange={(e) => handleCheckboxChange(msg, e.target.checked)}
                />
                <div>
                  <p className="bg-[#181818] p-2 rounded">
                    <strong>Потребител:</strong> {msg.user_prompt}
                  </p>
                  <p className="bg-[#292929] p-2 rounded mt-1">
                    <strong>AI:</strong> {msg.ai_response}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex mb-4">
          <input
            type="text"
            className="flex-1 p-4 text-white bg-[#0e0e0e] border border-[#1a1a1a] rounded-l-lg focus:outline-none"
            placeholder="Напиши съобщение..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className={`px-6 py-4 rounded-r-lg transition-colors duration-300 ${
              loading || !inputMessage.trim()
                ? "bg-[#222] text-[#555] cursor-not-allowed"
                : "bg-[#181818] text-white hover:bg-[#292929]"
            }`}
          >
            Изпрати
          </button>
        </div>
        <button
          onClick={handleIncorporatePitch}
          className="mb-4 py-3 px-6 bg-blue-600 rounded hover:bg-blue-700 transition-colors duration-300"
        >
          Incorporate Pitch into Project
        </button>
        {updatedPlan && (
          <div className="bg-green-800 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">Updated Business Plan:</h2>
            <p>{updatedPlan}</p>
          </div>
        )}
      </div>
    </div>
  );
}
