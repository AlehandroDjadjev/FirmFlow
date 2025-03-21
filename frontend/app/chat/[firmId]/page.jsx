"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

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
        const res = await fetch(
          `http://localhost:8000/api/LLM/interactions/${firmId}/`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        const data = await res.json();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/90 to-[#3A86FF] text-white flex flex-col items-center">
      {/* Navbar (Fixed at top, full-width) */}
      <div className="fixed top-0 left-0 w-full bg-black/70 py-4 px-6 flex items-center justify-between shadow-md z-10">
        <button
          onClick={() => router.push("/home")}
          className="py-2 px-4 bg-black cursor-pointer rounded-xl hover:bg-[#3a3a3a] transition-colors duration-300"
        >
          Назад към Фирми
        </button>
        <h1 className="text-2xl font-bold">Чат за фирма ID: {firmId}</h1>
        <div className="w-16" /> {/* Empty div for symmetry */}
      </div>

      {/* Content Wrapper (To push content below navbar) */}
      <div className="w-full flex flex-col items-center mt-20">
        {/* Large Chat Container */}
        <div className="w-3/4 bg-black/70 shadow-lg rounded-2xl p-6 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto h-[60vh] p-4">
            {chatHistory.length === 0 ? (
              <p className="text-center text-gray-400">Няма чат история.</p>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className="flex items-start mb-4">
                  <input type="checkbox" className="mt-2 mr-2" />
                  <div>
                    <p className="bg-black/30 p-2 rounded-md">
                      <strong>Потребител:</strong> {msg.user_prompt}
                    </p>
                    <p className="bg-black/80 p-2 rounded-md mt-1">
                      <strong>AI:</strong> {msg.ai_response}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input and Send Button (Inside Container) */}
          <div className="flex mt-4">
            <input
              type="text"
              className="flex-1 p-4 text-white bg-black border border-[#1a1a1a] rounded-l-xl focus:outline-none"
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
              className={`px-6 py-4 rounded-r-xl transition-colors duration-300 ${
                loading || !inputMessage.trim()
                  ? "bg-[#222] text-[#555] cursor-not-allowed"
                  : "bg-[#292929] text-white cursor-pointer hover:bg-[#3a3a3a]"
              }`}
            >
              Изпрати
            </button>
          </div>

          {/* Centered Button for Incorporating Last AI Response */}
          <div className="flex justify-center mt-4">
            <button className="py-3 px-6 bg-black rounded-xl cursor-pointer hover:bg-black/60 transition-colors duration-300">
              Инкорпорирай последния отговор на бота
            </button>
          </div>
        </div>

        {/* Display Updated Business Plan if Available */}
        {updatedPlan && (
          <div className="w-3/4 bg-green-800 p-4 rounded-xl mt-4 shadow-lg">
            <h2 className="text-xl font-bold mb-2">Updated Business Plan:</h2>
            <p>{updatedPlan}</p>
          </div>
        )}
      </div>
    </div>
  );
}
