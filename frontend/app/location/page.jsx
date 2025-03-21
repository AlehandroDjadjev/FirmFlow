"use client";

import React, { useState } from "react";
import LocationPicker from "./LocationPicker";

const FirmForm = () => {
  const [firmData, setFirmData] = useState({
    name: "",
    description: "",
    image: null,
    latitude: null,
    longitude: null,
  });

  const handleLocationChange = (location) => {
    setFirmData({
      ...firmData,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

    try {
      const response = await fetch("http://localhost:8000/api/LLM/firms/location/", {
        method: "POST",
        headers: {

        },
        body: formData,
      });

      const data = await response.json();
      console.log("Firm created:", data);
    } catch (error) {
      console.error("Error:", error);
    }

      <LocationPicker setLocation={handleLocationChange} />
  

