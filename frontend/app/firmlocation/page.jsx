"use client";

import React, { useState } from "react";
import LocationPicker from "./LocationPicker";

const FirmForm = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const handleLocationChange = (location) => {
    setLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("latitude", location.latitude);
    formData.append("longitude", location.longitude);

    try {
      const response = await fetch("http://localhost:8000/api/LLM/firms/location/", {
        method: "POST",
        headers: {},
        body: formData,
      });

      const data = await response.json();
      console.log("Firm created:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      <div className="w-1/2 p-12 text-white flex flex-col justify-center items-start space-y-6 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold">Избери местоположението на своя бизнес на картата.</h2>
        <div className="w-full p-4 rounded-lg">
          <LocationPicker setLocation={handleLocationChange} />
        </div>
        <button
          onClick={handleSubmit}
          className={`mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 "bg-[#222] text-[#555] cursor-not-allowed bg-[#181818] cursor-pointer text-white hover:bg-[#292929] `}
        >
          Продължи
        </button>
      </div>

      <div className="w-1/2 p-12 bg-gradient-to-r from-blue-600 to-pink-500 text-white flex flex-col justify-center items-start rounded-l-2xl">
        <div className="bg-black bg-opacity-60 p-8 bg-[#0a0a0a] rounded-xl shadow-lg max-w-sm">
          <h3 className="text-xl font-bold mb-4">Защо е важно да избереш точно местоположение?</h3>
          <p className="mb-4">Точното местоположение на твоя бизнес помага на клиентите лесно да те намерят и подобрява видимостта в онлайн карти и навигационни приложения. Това е особено важно за локални търсения и за прецизно планиране на логистика и доставки.</p>
          <h4 className="text-lg font-semibold">Какво трябва да посочиш?</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Точни GPS координати (ширина и дължина)</li>
            <li>Адрес и пощенски код</li>
            <li>Град и област</li>
            <li>Близки забележителности или ориентири</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FirmForm;
