"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateFirmPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: ""
  });
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("http://localhost:8000/api/LLM/initialize_firm/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      router.push("/home");
    } else {
      const error = await res.json();
      alert("Initialization failed: " + error.detail);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Инициализация на фирма</h2>

      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Име на фирмата" value={formData.name} onChange={handleChange} required className="border p-2 rounded w-full mb-4"/>
        <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full">
          {loading ? "Инициализация..." : "Създай фирма"}
        </button>
      </form>
    </div>
  );
}
