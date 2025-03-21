"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import apiFetch from "@/app/apifetch";

export default function FirmDashboardPage() {
  const { firmId } = useParams();
  const router = useRouter();
  const [firm, setFirm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  useEffect(() => {
    if (!firmId || !token) return;

    apiFetch(`http://localhost:8000/api/LLM/firm/${firmId}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFirm(data);
        setForm({ name: data.name, description: data.description });
      })
      .catch((err) => console.error("Error loading firm:", err));
  }, [firmId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      if (logoFile) {
        formData.append("image", logoFile);
      }

      const res = await fetch(`http://localhost:8000/api/LLM/firm/edit/${firmId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update firm");

      const updated = await res.json();
      setFirm(updated);
      setEditing(false);
      setLogoFile(null);
    } catch (err) {
      console.error(err);
      alert("Неуспешно запазване.");
    } finally {
      setLoading(false);
    }
  };

  const deleteFirm = async () => {
    if (!confirm("Сигурен ли си, че искаш да изтриеш фирмата?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/LLM/firm/edit/${firmId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        router.push("/home");
      } else {
        alert("Грешка при изтриването.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!firm) return <div className="text-white p-6">Зареждане...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-pink-600 text-white flex items-center justify-center px-10">
      <div className="bg-[#121212]/80 p-10 rounded-xl max-w-2xl w-full shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Настройки на фирмата</h1>

        {firm.image && (
          <div className="mb-6 text-center">
            <img
              src={`http://localhost:8000${firm.image}`}
              alt="Firm Logo"
              className="h-32 mx-auto rounded border border-gray-700"
            />
          </div>
        )}

        {editing && (
          <div className="mb-6">
            <label className="block text-sm mb-2">Качи ново лого:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full bg-black text-white border border-[#333] p-2 rounded"
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm mb-2 text-gray-400">Име на фирмата</label>
          {editing ? (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444] focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-lg">{firm.name}</p>
          )}
        </div>
  
        <div className="mb-6">
          <label className="block text-sm mb-2 text-gray-400">Описание</label>
          {editing ? (
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-3 h-24 rounded-lg bg-[#1a1a1a] text-white border border-[#444] focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-300">{firm.description || "Без описание"}</p>
          )}
        </div>
  
        <div className="flex justify-between gap-4">
          <button
            onClick={() => router.push(`/chat/${firmId}`)}
            className="bg-[#0e0e0e] px-4 py-2 rounded-lg hover:bg-[#292929] transition w-full cursor-pointer"
          >
            💬 Към чата
          </button>
          <button
            onClick={() => router.push(`/home`)}
            className="bg-[#0e0e0e] px-4 py-2 rounded-lg hover:bg-[#292929] transition w-full cursor-pointer"
          >
            📊 Обратно към началната страница
          </button>
        </div>
  
        <div className="flex justify-between gap-4 mt-6">
          {editing ? (
            <>
              <button
                onClick={saveChanges}
                className={`w-full py-2 rounded ${
                  loading ? "bg-[#444]" : "bg-green-600 hover:bg-green-500"
                }`}
                disabled={loading}
              >
                💾 Запази
              </button>
              <button
                onClick={() => {
                  setForm({ name: firm.name, description: firm.description });
                  setLogoFile(null);
                  setEditing(false);
                }}
                className="w-full py-2 bg-[#0e0e0e] hover:bg-[#292929] rounded-lg cursor-pointer"
              >
                Отказ
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2 bg-[#0e0e0e] hover:bg-[#292929] rounded-lg cursor-pointer"
            >
              ✏️ Редактирай
            </button>
          )}
          <button
            onClick={deleteFirm}
            className="w-full py-2 bg-[#0e0e0e] hover:bg-[#292929] rounded-lg cursor-pointer"
          >
            🗑️ Изтрий
          </button>
        </div>
      </div>
    </div>
  );  
}
