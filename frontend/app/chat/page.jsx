"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firmId = searchParams.get("firm_id");
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchMessages = async () => {
      const res = await fetch(`http://localhost:8000/api/LLM/interactions/?firm_id=${firmId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.saved_interactions);
      }
    };

    fetchMessages();
  }, [firmId, token, router]);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    setLoading(true);
    const res = await fetch("http://localhost:8000/api/LLM/submit/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ firm_id: firmId, prompt: userMessage })
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, { user_prompt: userMessage, ai_response: data.response }]);
      setUserMessage("");
    } else {
      alert("Error sending message.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Чат за фирма</h2>

      <div className="border p-4 rounded h-80 overflow-y-auto mb-4">
        {messages.length === 0 ? <p className="text-gray-500">Няма съобщения.</p> : messages.map((msg, idx) => (
          <div key={idx} className="mb-3">
            <p className="font-bold">Потребител:</p>
            <p className="bg-gray-100 p-2 rounded">{msg.user_prompt}</p>
            <p className="font-bold mt-2">AI:</p>
            <p className="bg-blue-100 p-2 rounded">{msg.ai_response}</p>
          </div>
        ))}
      </div>

      <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Въведете съобщение..." className="border p-2 rounded w-full mb-2"></textarea>
      <button onClick={handleSendMessage} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
        {loading ? "Изпращане..." : "Изпрати"}
      </button>
    </div>
  );
}
