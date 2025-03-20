"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function FinalPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/home");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen font-sans relative min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" />

      <div className="relative text-2xl text-white font-semibold z-10 text-center">
        Благодарим ви за попълването!
      </div>

      <div className="relative mt-5 text-lg text-gray-300 z-10 text-center">
        Вашето описание е успешно подадено.
      </div>

      <button
        onClick={handleGoHome}
        className="relative mt-5 bg-gray-700 cursor-pointer hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105 z-10"
      >
        Виж всички бизнеси
      </button>
    </div>
  );
}
