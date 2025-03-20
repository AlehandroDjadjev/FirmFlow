"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Hero() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if access token exists in localStorage
    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
      router.push("/login"); // Redirect to login if not authenticated
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <p className="text-red-500 text-lg">{error}</p>
        <Link
          href="/login"
          className="mt-4 bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl"
        >
          Вход
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) return null; // Prevent rendering while checking auth


  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] text-white">
        <header className="text-center">
          <h1 className="text-4xl font-bold">FirmFlow</h1>
        </header>
        <main className="flex flex-col items-center">
          <h2 className="text-2xl mb-4 font-bold">
            Имате идея за бизнес, но не знаете откъде да започнете?
          </h2>
          <div className="flex gap-6 flex-wrap justify-center mt-8">
            {[
              {
                question: "Какви са предимствата?",
                answer:
                  "Генерирайте детайлен бизнес план само с няколко клика.",
              },
              {
                question: "Какво мога да правя?",
                answer:
                  "Качвайте документи и получавайте персонализирани анализи.",
              },
              {
                question: "Ами какво ако не знам как да продължа?",
                answer:
                  "Задавайте въпроси и получавайте експертни отговори в реално време.",
              },
              {
                question: "С кое пестя време?",
                answer:
                  "Създавайте специализирани документи – от правни консултации до маркетинг стратегии.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative w-40 h-40 flex items-center justify-center bg-gray-400/80 rounded-full text-center transition-all duration-300 group"
              >
                <span className="absolute inset-0 font-bold flex items-center justify-center text-xl transition-opacity duration-300 group-hover:opacity-0">
                  {item.question}
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.answer}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/businessinfo"
            className="mt-8 bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105"
          >
            Започнете сега!
          </Link>
        </main>
        <footer className="text-center">
          <p>&copy; 2025 FirmFlow. Всички права запазени.</p>
        </footer>
      </div>
    </div>
  );
}