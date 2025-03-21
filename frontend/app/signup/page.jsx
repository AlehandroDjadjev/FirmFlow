"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import  apiFetch  from "@/app/apifetch";

export default function Signup() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form..."); 

    setError(null); 

    try {
      const response = await fetch("http://localhost:8000/auth/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Signup failed");
      }

      const data = await response.json(); 

      router.push("/login"); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="bg-black border border-[#1a1a1a] p-8 rounded-xl shadow-lg w-80 text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Име"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 mb-3 rounded bg-[#0e0e0e] text-white outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Имейл"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 mb-3 rounded bg-[#0e0e0e] text-white outline-none"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Парола"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 mb-3 rounded bg-[#0e0e0e] text-white outline-none"
            required
          />

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-40 cursor-pointer bg-[#181818] p-2 rounded-xl hover:bg-[#292929] transition text-white"
            >
              Регистрирай се
            </button>
          </div>
        </form>

        <p className="text-sm mt-3 text-center">
          Вече имате акаунт?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Вход
          </a>
        </p>
      </div>
    </div>
  );
}
