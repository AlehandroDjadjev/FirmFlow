"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PaperClipIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("access");
      if (token) {
        try {
          const isExpired = checkTokenExpiration(token);
          if (!isExpired) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("access");
            setIsAuthenticated(false);
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              const refreshResponse = await fetch(
                "http://localhost:8000/auth/token/refresh/",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ refresh: refreshToken }),
                }
              );
              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                localStorage.setItem("access", data.access);
                setIsAuthenticated(true);
              } else {
                localStorage.removeItem("access");
                setIsAuthenticated(false);
                router.push("/login");
              }
            } else {
              router.push("/login");
            }
          }
        } catch (error) {
          setIsAuthenticated(false);
          router.push("/signup");
        }
      } else {
        setIsAuthenticated(false);
        router.push("/signup");
      }
    };
    checkAuthentication();
  }, []);

  const decodeToken = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  };

  const checkTokenExpiration = (token) => {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
  };

  function getRefreshToken() {
    return localStorage.getItem("refresh");
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken || checkTokenExpiration(refreshToken)) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        location.reload(true);
        return;
      }
      const response = await fetch("http://localhost:8000/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.ok) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        location.reload(true);
      }
    } catch (error) {}
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-400 via-purple-600 to-purple-900 text-white flex flex-col items-center justify-center px-6 transition-all duration-500">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
      <div className="relative w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">FirmFlow</h1>
        <h2 className="text-2xl font-medium text-gray-400 mb-6">
          Имате идея за бизнес, но не знаете откъде да започнете?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-30 justify-center">
          {[
            {
              icon: <PaperClipIcon className="h-12 w-12 cursor-defult text-gray-500" />,
              text: "Генерирайте детайлен бизнес план само с няколко клика.",
            },
            {
              icon: <FolderIcon className="h-12 w-12 cursor-defult text-gray-500" />,
              text: "Качвайте документи и получавайте персонализирани анализи.",
            },
            {
              icon: <QuestionMarkCircleIcon className="h-12 w-12 cursor-defult text-gray-500" />,
              text: "Задавайте въпроси и получавайте експертни отговори в реално време.",
            },
            {
              icon: <DocumentTextIcon className="h-12 w-12 cursor-defult text-gray-500" />,
              text: "Създавайте специализирани документи – от правни консултации до маркетинг стратегии.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="relative w-32 h-32 flex items-center justify-center  bg-[#0e0f0f]/70 backdrop-blur-lg rounded-xl transition-all duration-300 hover:backdrop-blur-lg group"
            >
              <span className="absolute inset-0 flex items-center justify-center cursor-defult text-4xl transition-opacity duration-300 group-hover:opacity-0">
                {item.icon}
              </span>
              <span className="absolute inset-0 flex items-center justify-center cursor-defult text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-300 p-2">
                {item.text}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => router.push("/home")}
                className="bg-[#181818]/80 cursor-pointer hover:bg-[#292929]/70 px-6 py-3 rounded-lg text-white transition-all duration-300 min-w-[180px]"
              >
                Започнете сега!
              </button>
              {/* 🚀 NEW: The Flow button */}
              <button
                onClick={() => router.push("/FlowPage")}
                className="bg-[#181818]/80 cursor-pointer hover:bg-[#292929]/70 px-6 py-3 rounded-lg text-white transition-all duration-300 min-w-[180px]"
              >
                The Flow
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-[#292929] px-6 py-3 rounded-lg text-gray-500 cursor-not-allowed min-w-[180px]"
                disabled
              >
                Започнете сега!
              </button>
              {/* The Flow button also disabled if not authenticated */}
              <button
                className="bg-[#292929] px-6 py-3 rounded-lg text-gray-500 cursor-not-allowed min-w-[180px]"
                disabled
              >
                The Flow
              </button>
            </>
          )}
        </div>
      </div>
      <footer className="absolute bottom-6 text-center text-gray-500 text-sm">
        &copy; 2025 FirmFlow. Всички права запазени.
      </footer>
      <div className="fixed top-4 right-4 flex space-x-4">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="bg-[#181818]/80 cursor-pointer hover:bg-[#292929]/70 px-4 py-2 rounded-lg transition-all"
          >
            Изход
          </button>
        ) : (
          <>
            <Link
              href="/login"
              className="bg-[#181818]/80 hover:bg-[#292929]/70 px-4 py-2 rounded-lg transition-all"
            >
              Вход
            </Link>
            <Link
              href="/signup"
              className="bg-[#181818]/80 hover:bg-[#292929]/70 px-4 py-2 rounded-lg transition-all"
            >
              Регистрация
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
