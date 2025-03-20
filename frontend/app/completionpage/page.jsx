"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function FinalPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/home"); // Redirect to homepage
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black font-sans">
      <div className="text-2xl text-gray-200 font-semibold">
        Благодарим ви за попълването!
      </div>
      <div className="mt-5 text-lg text-gray-400">
        Вашето описание е успешно подадено.
      </div>
      <button
        onClick={handleGoHome}
        className="mt-5 bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105"
      >
        Виж всички бизнеси
      </button>
    </div>
  );
}
