'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPicker from "./LocationPicker"; // Assuming this is your LocationPicker component

const FirmForm = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [image, setImage] = useState(null); // For storing the selected image
  const router = useRouter();

  const handleLocationChange = (newLocation) => {
    console.log(newLocation);
    location.latitude = newLocation.lat
    location.longitude = newLocation.lng // Update location state
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Convert image to base64 string
      };
      reader.readAsDataURL(file); // Convert the image to base64 string
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if location is set
    if (!location.latitude || !location.longitude) {
      alert("Моля, изберете местоположение на картата.");
      return;
    }
    const firmData = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    localStorage.setItem("firmData", JSON.stringify(firmData));

    // Save the image to localStorage if it exists
    if (image) {
      localStorage.setItem("businessImage", image); // Save base64 image string to localStorage
    }

    // Confirm saving and redirect
    alert("Местоположението и изображението са успешно записани.");
    router.push('/businesstats'); // Redirect to another page after saving

  };

  return (
    <div className="min-h-screen flex bg-black">
      <div className="w-1/2 p-12 text-white flex flex-col justify-center items-start space-y-6 bg-[#0a0a0a]">
        <h2 className="text-3xl font-semibold">
          Избери местоположението на своя бизнес на картата
        </h2>
        <div className="w-full p-4 rounded-lg">
          <LocationPicker setLocation={handleLocationChange} /> {/* Update location state */}
        </div>

        <div className="mt-6">
          <label htmlFor="image" className="block text-lg font-medium">Избери изображение на бизнеса</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 p-2 bg-gray-700 text-white rounded-lg"
          />
          {image && <img src={image} alt="Preview" className="mt-4 w-48 h-48 object-cover" />}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full py-3 text-lg font-medium rounded-lg transition-all duration-300 bg-[#181818] text-white hover:bg-[#292929] cursor-pointer"
        >
          Продължи
        </button>
      </div>

      <div className="w-1/2 p-12 bg-gradient-to-r from-blue-600 to-pink-500 text-white flex flex-col justify-center items-start rounded-l-2xl">
        <div className="bg-black bg-opacity-60 p-8 rounded-xl shadow-lg max-w-sm">
          <h3 className="text-xl font-bold mb-4">Защо е важно да избереш точно местоположение?</h3>
          <p className="mb-4">
            Точното местоположение на твоя бизнес помага на клиентите лесно да те намерят и подобрява видимостта в онлайн карти и навигационни приложения. Това е особено важно за локални търсения и за прецизно планиране на логистика и доставки.
          </p>
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
