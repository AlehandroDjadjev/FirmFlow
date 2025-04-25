"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiFetch from "@/app/apifetch";

export default function UserPage() {
  const { firmId } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState([]);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem("access");
        if (!token) return; // or handle unauthorized state

        const res = await apiFetch(
          `http://localhost:8000/api/LLM/profile/${firmId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error("Failed to load user data");
        }
        const data = await res.json();
        setProfile(data);
        apiFetch("http://localhost:8000/api/LLM/firms/list/", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setFirms(data.firms || []));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [firmId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">Loading...</div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <p>Потребителят не е намерен.</p>
        <button
          onClick={() => router.push("/home")}
          className="mt-4 px-6 py-3 bg-[#1a1a1a]/70 rounded-lg text-lg font-semibold hover:bg-[#292929]/70 transition cursor-pointer"
        >
          Обратно към начало
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600 text-white p-10 flex flex-col items-center">
      <div className="bg-[#121212]/70 rounded-xl p-8 max-w-2xl w-full shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Профил на {profile.username}
        </h1>

        {profile.profile_picture && (
          <img
            src={`http://localhost:8000${profile.profile_picture}`}
            alt="Профилна снимка"
            className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
          />
        )}
        <div className="text-lg space-y-2">
          <p>Име: {profile.first_name || "Няма име"}</p>
          <p>Фамилия: {profile.last_name || "Няма фамилия"}</p>
          <p>Телефон: {profile.phone_number || "Няма телефон"}</p>
          <p>Социални мрежи: {profile.social_links || "Няма линк"}</p>
          <p className="mt-3">Биография: {profile.bio || "Няма биография"}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Фирми:</h2>
          {firms && firms.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-300 mt-2">
              {firms.map((firm) => (
                <li key={firm.id}>{firm.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">Няма създадени фирми</p>
          )}
        </div>

        <button
          onClick={() => router.push("/home")}
          className="mt-6 cursor-pointer bg-black/60 hover:bg-black/80 py-2 px-4 rounded-lg text-white"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
