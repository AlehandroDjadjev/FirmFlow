"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [firms, setFirms] = useState([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    
    const fetchFirms = async () => {
      const res = await fetch("http://localhost:8000/api/REST/list-firms/", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setFirms(data.firms);
      }
    };

    fetchFirms();
  }, [token, router]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Вашите фирми</h2>
      <ul>
        {firms.map((firm) => (
          <li key={firm.id} className="border p-3 rounded mb-2 flex justify-between items-center">
            <span>{firm.name}</span>
            <button onClick={() => router.push(`/chat?firm_id=${firm.id}`)} className="bg-blue-500 text-white px-3 py-1 rounded">
              Чат
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
