"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import jwt_decode from "jwt-decode";  // Import jwt_decode

export default function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = jwt_decode(token);  // Decode the token
        const isExpired = decoded.exp * 1000 < Date.now();  // Check if the token is expired
        if (!isExpired) {
          setIsAuthenticated(true);  // Set to true if token is valid
        } else {
          localStorage.removeItem("access");  // Remove expired token
        }
      } catch (error) {
        console.error("Error decoding token:", error);  // Handle decoding errors
      }
    }
  }, []);  // Runs once on component mount

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Background Blur Effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Content */}
      <div className="relative w-full max-w-4xl text-center">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-200 mb-4">FirmFlow</h1>

        {/* Subtitle */}
        <h2 className="text-2xl font-medium text-gray-400 mb-6">
          Имате идея за бизнес, но не знаете откъде да започнете?
        </h2>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-center">
          {[
            { icon: "📜", text: "Генерирайте детайлен бизнес план само с няколко клика." },
            { icon: "📂", text: "Качвайте документи и получавайте персонализирани анализи." },
            { icon: "❓", text: "Задавайте въпроси и получавайте експертни отговори в реално време." },
            { icon: "📑", text: "Създавайте специализирани документи – от правни консултации до маркетинг стратегии." }
          ].map((item, index) => (
            <div key={index} className="relative w-32 h-32 flex items-center justify-center bg-gray-900 rounded-xl transition-all duration-300 hover:bg-gray-700 group">
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                {item.icon}
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-300 p-2">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {isAuthenticated ? (
            <Link
              href="/businessinfo"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg text-white transition-all duration-300"
            >
              Започнете сега!
            </Link>
          ) : (
            <button
              className="bg-gray-800 px-6 py-3 rounded-lg text-gray-500 cursor-not-allowed"
              disabled
            >
              Започнете сега!
            </button>
          )}
        </div>
      </div>

      {/* Footer & Authentication Links */}
      <footer className="absolute bottom-6 text-center text-gray-500 text-sm">
        &copy; 2025 FirmFlow. Всички права запазени.
      </footer>

      <div className="fixed top-4 right-4 flex space-x-4">
        <Link
          href="/login"
          className="bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
        >
          Вход
        </Link>
        <Link
          href="/signup"
          className="bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
        >
          Регистрация
        </Link>
      </div>
    </div>
  );
}
