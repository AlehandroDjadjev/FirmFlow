"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/apifetch";
import zxcvbn from "zxcvbn"; // Password strength checker

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
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

  const passwordStrength = zxcvbn(formData.password);
  const isPasswordWeak = passwordStrength.score < 3; // 0 to 4 scale

  const strengthText = () => {
    if (formData.password.length === 0) return "";
    if (passwordStrength.score <= 1) {
      return "Паролата е много слаба. Добавете главни букви, цифри и специални символи.";
    } else if (passwordStrength.score === 2) {
      return "Паролата е добра, но може да бъде по-силна. Помислете за удължаване или използване на повече символи.";
    } else {
      return "Паролата е силна! Продължавайте така.";
    }
  };

  const textColor = () => {
    if (passwordStrength.score <= 1) return "text-pink-400"; // Softer warning
    if (passwordStrength.score === 2) return "text-purple-400"; // FirmFlow purple
    return "text-blue-400"; // Soft blue for strong
  };

  const progressWidth = (passwordStrength.score + 1) * 20; // 0% to 100%

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-blue-600">
      <div className="bg-black/60 border border-white/20 p-8 rounded-2xl shadow-2xl w-80 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">Регистрация</h2>
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Име"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />
          <input
            type="text"
            name="first_name"
            placeholder="Първо Име"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Последно Име"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Имейл"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />
          <input
            type="tel"
            name="phone_number"
            placeholder="Тел. Номер"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            required
          />

          {/* Password Field Last */}
          <div className="space-y-2">
            <input
              type="password"
              name="password"
              placeholder="Парола"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              required
            />

            {/* Password Strength Progress Bar */}
            {formData.password.length > 0 && (
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-800 via-purple-500 to-blue-400 transition-all duration-700 ease-in-out"
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
            )}

            {/* Password Strength Text */}
            {formData.password.length > 0 && (
              <p className={`text-sm ${textColor()} text-center`}>
                {strengthText()}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isPasswordWeak}
              className={`w-40 ${
                isPasswordWeak
                  ? "bg-black/30 cursor-not-allowed"
                  : "bg-black/50 cursor-pointer hover:bg-black/70"
              } py-2 rounded-xl transition text-white font-semibold`}
            >
              Регистрирай се
            </button>
          </div>
        </form>

        <p className="text-sm mt-6 text-center text-white/80">
          Вече имате акаунт?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Вход
          </a>
        </p>
      </div>
    </div>
  );
}
