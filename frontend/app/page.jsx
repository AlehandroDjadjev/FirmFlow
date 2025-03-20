"use client";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] text-white">
        <header className="text-center">
          <h1 className="text-4xl font-bold">FirmFlow</h1>
        </header>
        <main className="flex flex-col items-center">
          <h2 className="text-2xl mb-4 font-bold">
            Имате идея за бизнес, но не знаете откъде да започнете?
          </h2>
          <div className="flex gap-6 flex-wrap justify-center mt-8">
            <div className="relative w-40 h-40 flex items-center justify-center bg-gray-400/80 rounded-full text-center transition-all duration-300 hover:bg-gray-700 hover:text-white group">
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                📜
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Генерирайте детайлен бизнес план само с няколко клика.
              </span>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center bg-gray-400/80 rounded-full text-center transition-all duration-300 hover:bg-gray-700 hover:text-white group">
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                📂
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Качвайте документи и получавайте персонализирани анализи.
              </span>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center bg-gray-400/80 rounded-full text-center transition-all duration-300 hover:bg-gray-700 hover:text-white group">
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                ❓
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Задавайте въпроси и получавайте експертни отговори в реално
                време.
              </span>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center bg-gray-400/80 rounded-full text-center transition-all duration-300 hover:bg-gray-700 hover:text-white group">
              <span className="absolute inset-0 flex items-center justify-center text-4xl group-hover:hidden">
                📑
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-xsm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Създавайте специализирани документи – от правни консултации до
                маркетинг стратегии.
              </span>
            </div>
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
        <div className="fixed top-4 right-4 flex space-x-4">
          <Link
            href="/login"
            className="bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105"
          >
            Вход
          </Link>
          <Link
            href="/signup"
            className="bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
