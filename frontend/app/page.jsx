"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PaperClipIcon, FolderIcon, QuestionMarkCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline"; // Import icons

export default function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      try {
        const isExpired = checkTokenExpiration(token);

        if (!isExpired) {
          setIsAuthenticated(true);  // If token is valid, set authentication
        } else {
          localStorage.removeItem("access");  // Remove expired token
          setIsAuthenticated(false);
          router.push("/signup");  // Redirect to signup if the token expired
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsAuthenticated(false);
        router.push("/signup");  // Redirect to signup if token validation failed
      }
    } else {
      setIsAuthenticated(false);
      router.push("/signup");  // Redirect to signup if no token exists
    }
  }, []);  // Runs once on component mount

  // Function to decode JWT token and check expiration
  const checkTokenExpiration = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const payload = JSON.parse(atob(parts[1]));  // Decode base64 payload
    const expirationTime = payload.exp * 1000;  // Convert to milliseconds
    return expirationTime < Date.now();
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
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
          {[{
            icon: <PaperClipIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Генерирайте детайлен бизнес план само с няколко клика."
          }, {
            icon: <FolderIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Качвайте документи и получавайте персонализирани анализи."
          }, {
            icon: <QuestionMarkCircleIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Задавайте въпроси и получавайте експертни отговори в реално време."
          }, {
            icon: <DocumentTextIcon className="h-12 w-12 text-gray-500 group-hover:text-white" />,
            text: "Създавайте специализирани документи – от правни консултации до маркетинг стратегии."
          }].map((item, index) => (
            <div
              key={index}
              className="relative w-32 h-32 flex items-center justify-center bg-[#0e0f0f] rounded-xl transition-all duration-300 hover:bg-[#222]/100 group"
            >
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
            <button
              onClick={() => router.push("/businessinfo")}
              className="bg-[#181818] hover:bg-[#292929] px-6 py-3 rounded-lg text-white transition-all duration-300"
            >
              Започнете сега!
            </button>
          ) : (
            <button
              onClick={() => router.push("/signup")}
              className="bg-[#292929] px-6 py-3 rounded-lg text-gray-500 cursor-not-allowed"
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
        {isAuthenticated ? null : (
          <>
            <Link href="/login" className="bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all">
              Вход
            </Link>
            <Link href="/signup" className="bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
