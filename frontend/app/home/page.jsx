"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [firms, setFirms] = useState([
    {
      id: 1,
      name: "TechNova Solutions",
      location: "София, България",
      industry: "Софтуерна компания",
      team: "Екип: 150 души",
      budget: "Бюджет: 50,000 евро",
    },
    {
      id: 2,
      name: "GreenFuture Energy",
      location: "Пловдив, България",
      industry: "Възобновяема енергия",
      team: "Екип: 300 души",
      budget: "Бюджет: 120,000 евро",
    },
    {
      id: 3,
      name: "NextGen Robotics",
      location: "Варна, България",
      industry: "Роботика",
      team: "Екип: 200 души",
      budget: "Бюджет: 80,000 евро",
    },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const router = useRouter();

  useEffect(() => {
    async function fetchFirms() {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch("http://localhost:8000/api/LLM/firms/list/", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        // Assuming response structure: { firms: [ { id, name, ... }, ... ] }
        setFirms(data.firms);
      } catch (error) {
        console.error("Error fetching firms:", error);
      }
    }
    fetchFirms();
  }, []);
  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % firms.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + firms.length) % firms.length);
  };

  const handleSelectFirm = () => {
    const selectedFirm = firms[selectedIndex];
    router.push(`/chat/${selectedFirm.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Firm Selection Carousel */}
      <div className="relative flex items-center justify-center h-[300px] mt-10">
        <button
          onClick={handlePrev}
          className="absolute left-10 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
        >
          <ChevronLeft size={30} />
        </button>

        <div className="flex gap-8 items-center">
          {firms.map((firm, index) => (
            <motion.div
              key={firm.id}
              className={`p-6 rounded-xl shadow-lg text-center transition ${index === selectedIndex
                ? "scale-125 bg-blue-700"
                : "scale-90 bg-gray-800 opacity-60"
                }`}
              animate={{
                scale: index === selectedIndex ? 1.2 : 0.9,
                opacity: index === selectedIndex ? 1 : 0.6,
              }}
            >
              <h3 className="text-xl font-bold">{firm.name}</h3>
              <p className="text-sm">{firm.location}</p>
              <p className="text-sm">{firm.industry}</p>
              <p className="text-sm">{firm.team}</p>
              <p className="text-sm">{firm.budget}</p>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="absolute right-10 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
        >
          <ChevronRight size={30} />
        </button>
      </div>

      {/* Selection Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSelectFirm}
          className="px-6 py-3 bg-blue-500 cursor-pointer rounded-lg text-lg font-semibold hover:bg-blue-600 transition"
        >
          Избери фирма
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-grow items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Добре дошли!</h1>
          <p className="text-lg text-gray-300">
            Използвайте стрелките, за да изберете фирма, и натиснете "Избери
            фирма".
          </p>
        </div>
      </div>
    </div>
  );
}
