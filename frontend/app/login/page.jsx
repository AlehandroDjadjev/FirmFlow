"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/apifetch";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting login...");

    setError(null);

    try {
      const response = await fetch("http://localhost:8000/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      console.log("Login success:", data);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      router.push("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600">
      <div className="bg-black/60 border border-white/20 p-8 rounded-2xl shadow-2xl w-80 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">Вход</h2>
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Потребителско Име"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Парола"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-40 cursor-pointer bg-black/50 hover:bg-black/70 py-2 rounded-xl transition text-white font-semibold"
            >
              Влез
            </button>
          </div>
        </form>

        <p className="text-sm mt-6 text-center text-white/80">
          Нямате акаунт?{" "}
          <a
            href="/signup"
            className="text-blue-400 cursor-pointer hover:underline"
          >
            Регистрация
          </a>
        </p>
      </div>
    </div>
  );
}
