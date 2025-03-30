"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/app/apifetch";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
    phone_number: "",
    social_links: "",
    profile_picture: null,
  });

  const [firms, setFirms] = useState([]);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    apiFetch("http://localhost:8000/auth/profile/", {
      headers: { Authorization: `Bearer ${token}` }, 
    })
      .then(res => res.json())
      .then(data => setProfile(data));

    apiFetch("http://localhost:8000/api/LLM/firms/list/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFirms(data.firms || []));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setProfile((prev) => ({ ...prev, profile_picture: e.target.files[0] }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("access");
    const formData = new FormData();

    Object.keys(profile).forEach((key) => {
        if (key === 'profile_picture') {
          if (profile[key] instanceof File) {
            formData.append(key, profile[key]);
          }
        } else if (profile[key]) {
          formData.append(key, profile[key]);
        }
      });

    await fetch("http://localhost:8000/auth/profile/", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    setEditing(false);
    alert("Профилът е обновен успешно.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-600 text-white flex flex-col items-center p-10">
      <div className="bg-[#121212]/70 rounded-xl p-8 max-w-2xl w-full shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Профил</h1>

        {!editing ? (
          <div className="flex flex-col gap-4">
            {profile.profile_picture && (
              <img src={`http://localhost:8000${profile.profile_picture}`} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto" />
            )}
            <p>Потребителско име: {profile.user}</p>
            <p>Име: {profile.first_name}</p>
            <p>Фамилия: {profile.last_name}</p>
            <p>Телефонен номер: {profile.phone_number}</p>
            <p>Социални връзки: {profile.social_links}</p>
            <p>Биография: {profile.bio}</p>

            <button onClick={() => setEditing(true)} className="mt-4 bg-blue-600 hover:bg-blue-500 py-2 px-4 rounded w-full">
              Редактирай
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input type="file" onChange={handleImageChange} className="mb-4" />
            <input name="user" placeholder="Потребителско име" value={profile.user} className="bg-gray-700 p-3 rounded" />
            <input name="first_name" placeholder="Име" value={profile.first_name} onChange={handleChange} className="bg-gray-700 p-3 rounded" />
            <input name="last_name" placeholder="Фамилия" value={profile.last_name} onChange={handleChange} className="bg-gray-700 p-3 rounded" />
            <input name="phone_number" placeholder="Телефонен номер" value={profile.phone_number} onChange={handleChange} className="bg-gray-700 p-3 rounded" />
            <input name="social_links" placeholder="Социални връзки" value={profile.social_links} onChange={handleChange} className="bg-gray-700 p-3 rounded" />
            <textarea name="bio" placeholder="Биография" value={profile.bio} onChange={handleChange} className="bg-gray-700 p-3 rounded h-24" />

            <button onClick={handleSave} className="mt-4 bg-green-600 hover:bg-green-500 py-2 px-4 rounded w-full">
              Запази
            </button>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Твоите фирми:</h2>
          {firms.length === 0 ? (
            <p className="text-gray-300">Нямаш създадени фирми.</p>
          ) : (
            <ul className="list-disc pl-6">
              {firms.map((firm) => (
                <li key={firm.id}>{firm.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="mt-4 px-6 py-3 bg-[#1a1a1a]/70 rounded-lg text-lg font-semibold hover:bg-[#292929]/70 transition cursor-pointer"
      >
        Обратно към начало
      </button>
    </div>
  );
}
