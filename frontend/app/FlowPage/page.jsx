"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/app/apifetch";

export default function FlowPage() {
  const [firms, setFirms] = useState([]);
  const router = useRouter();

   useEffect(() => {
      async function fetchFirms() {
        try {
          const token = localStorage.getItem("access");
          const res = await apiFetch("http://localhost:8000/api/LLM/firms/all/", {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          const data = await res.json();
          setFirms(data.firms || []);
        } catch (error) {
          console.error("Error fetching firms:", error);
        }
      }
      fetchFirms();
    }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600 text-white p-10">
      <h1 className="text-3xl font-bold text-center mb-6">The Flow</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {firms.map(firm => (
          <div key={firm.id} className="bg-black/60 p-6 rounded-lg shadow-xl">
            {firm.image && (
              <img src={firm.image} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto" />
            )}
            <h2 className="text-xl font-semibold">{firm.name}</h2>
            <p className="my-2 text-gray-300">{firm.description}</p>
            <p className="font-bold">Creator: 
              <span 
                className="cursor-pointer text-blue-400 ml-1"
                onClick={() => router.push(`/user/${firm.id}`)}
              >
                {firm.user}
              </span>
            </p>
          </div>
        ))}
      </div>
      <button 
        onClick={() => router.push("/home")}
        className="mt-6 bg-black/50 hover:bg-black/70 py-2 px-4 rounded-lg"
      >
        Go Home
      </button>
    </div>
  );
}
