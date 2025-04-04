"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/app/apifetch";
import { FiEdit2 } from "react-icons/fi";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    user: "",
    bio: "",
    phone_number: "",
    social_links: "",
    profile_picture: null,
  });

  const [firms, setFirms] = useState([]);
  const [view, setView] = useState("profile");
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    apiFetch("http://localhost:8000/auth/profile/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProfile(data));

    apiFetch("http://localhost:8000/api/LLM/firms/list/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFirms(data.firms || []));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, profile_picture: file }));
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("access");
    const formData = new FormData();

    Object.keys(profile).forEach((key) => {
      if (key === "profile_picture") {
        if (profile[key] instanceof File) {
          formData.append(key, profile[key]);
        }
      } else if (profile[key] || profile[key] === "") {
        formData.append(key, profile[key]);
      }
    });

    await fetch("http://localhost:8000/auth/profile/", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    alert("Профилът е обновен успешно.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-600 text-white transition-all duration-500">
      <nav className="w-full py-4 text-center text-2xl font-bold bg-[#121212]/60 shadow-md">
        Профил
      </nav>

      <div className="flex justify-center gap-6 py-4 text-lg font-medium transition-all duration-300">
        <button
          className={`transition-all duration-300 cursor-pointer ${
            view === "profile"
              ? "text-white border-b-2 border-white"
              : "text-gray-300 hover:text-white"
          }`}
          onClick={() => setView("profile")}
        >
          Профил
        </button>
        <button
          className={`transition-all duration-300 cursor-pointer ${
            view === "firms"
              ? "text-white border-b-2 border-white"
              : "text-gray-300 hover:text-white"
          }`}
          onClick={() => setView("firms")}
        >
          Фирми
        </button>
      </div>

      {view === "profile" ? (
        <div className="flex max-w-5xl mx-auto bg-[#121212]/70 rounded-xl p-8 shadow-xl gap-10 animate-fadeIn">
          <div className="flex flex-col items-center w-1/3 relative">
            {profile.profile_picture &&
            !(profile.profile_picture instanceof File) ? (
              <img
                src={`http://localhost:8000${profile.profile_picture}`}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mb-4 transition-all duration-300"
              />
            ) : profile.profile_picture instanceof File ? (
              <img
                src={URL.createObjectURL(profile.profile_picture)}
                alt="Profile Preview"
                className="w-32 h-32 object-cover rounded-full mb-4 transition-all duration-300"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-700 rounded-full mb-4" />
            )}

            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute top-2 right-2 bg-transparent text-blue-400 hover:text-blue-500 p-1 rounded-full transition cursor-pointer text-sm"
            >
              <FiEdit2 size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
            <p className="text-xl font-semibold mt-2">
              {profile.user || "Без потребителско име"}
            </p>
          </div>

          <div className="flex flex-col gap-4 w-2/3">
            <Field label="Потребителско име" value={profile.user} />
            <AddableField
              label="Име"
              value={profile.first_name}
              name="first_name"
              onChange={handleChange}
            />
            <AddableField
              label="Фамилия"
              value={profile.last_name}
              name="last_name"
              onChange={handleChange}
            />
            <AddableField
              label="Телефонен номер"
              value={profile.phone_number}
              name="phone_number"
              type="tel"
              pattern="^\d+$"
              onChange={handleChange}
            />
            <AddableField
              label="Социални връзки"
              value={profile.social_links}
              name="social_links"
              onChange={handleChange}
            />
            <AddableField
              label="Биография"
              value={profile.bio}
              name="bio"
              onChange={handleChange}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="mt-2 px-6 py-3 bg-[#1a1a1a]/70 rounded-lg text-lg font-semibold hover:bg-[#292929]/70 transition-all duration-300 cursor-pointer"
              >
                Запази
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-[#121212]/70 rounded-xl p-8 shadow-xl animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4">Твоите фирми</h2>
          {firms.length === 0 ? (
            <p className="text-gray-300">Нямаш създадени фирми.</p>
          ) : (
            <div className="space-y-4">
              {firms.map((firm) => (
                <div
                  key={firm.id}
                  className="flex justify-between items-center bg-gray-800/60 p-4 rounded-lg transition-all duration-300"
                >
                  <span className="text-lg">{firm.name}</span>
                  <button
                    onClick={() => router.push(`/dashboard/${firm.id}`)}
                    className="text-white hover:text-blue-400 transition-all duration-300 cursor-pointer"
                  >
                    Виж фирма
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push("/home")}
          className="px-6 py-3 bg-[#1a1a1a]/70 rounded-lg text-lg font-semibold hover:bg-[#292929]/70 transition-all duration-300 cursor-pointer"
        >
          Обратно към начало
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}:</p>
      <div className="bg-gray-800/50 p-3 rounded text-sm transition-all duration-300">
        {value || "Не е добавено"}
      </div>
    </div>
  );
}

function AddableField({
  label,
  value,
  name,
  onChange,
  type = "text",
  pattern,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState(value || "");
  const isValid = pattern ? new RegExp(pattern).test(input) : input.length > 0;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (isValid) {
      onChange({ target: { name, value: input } });
      setIsEditing(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}:</p>
      {isEditing ? (
        <div className="flex gap-2 items-center transition-all duration-300">
          <input
            type={type}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`text-blue-400 cursor-pointer hover:text-blue-500 text-sm ${
              isValid ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
          >
            Запази
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded text-sm transition-all duration-300">
          <span>{value || "Не е добавено"}</span>
          <button
            onClick={handleEdit}
            className="text-blue-400 hover:text-blue-500 text-sm cursor-pointer"
          >
            Редактирай
          </button>
        </div>
      )}
    </div>
  );
}
