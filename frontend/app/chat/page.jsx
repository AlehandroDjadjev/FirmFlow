'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firmId = searchParams.get('firm_id');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (firmId) fetchMessages();
  }, [firmId]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('access'); // Get JWT Token

    const res = await fetch(`http://localhost:8000/api/interactions/${firmId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setMessages(data.saved_interactions);
    } else {
      console.error('Failed to fetch chat history');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const token = localStorage.getItem('access'); // Get JWT Token

    const newMessage = { user_prompt: input, ai_response: "..." };
    setMessages((prev) => [...prev, newMessage]);

    const res = await fetch(`http://localhost:8000/api/submit/${firmId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: input }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev.slice(0, -1), { user_prompt: input, ai_response: data.response }]);
    } else {
      alert('Failed to send message');
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Чат за фирма #{firmId}</h2>

      <div className="h-96 overflow-y-auto border p-4 mb-4">
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 flex-1 rounded"
          placeholder="Напишете съобщение..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Изпращане...' : 'Изпрати'}
        </button>
      </div>
    </div>
  );
}
