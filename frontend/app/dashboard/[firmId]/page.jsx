"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  const [firm, setFirm] = useState(null);
  const { firmId } = useParams();
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!firmId || !token) return;

    fetch(`http://localhost:8000/api/LLM/firm/${firmId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setFirm)
      .catch((err) => console.error("Error fetching firm:", err));
  }, [firmId]);

  useEffect(() => {
    if (firm?.location && window.google && mapRef.current && mapReady) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: firm.location }, (results, status) => {
        if (status === "OK") {
          const map = new window.google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 14,
          });

          new window.google.maps.Marker({
            position: results[0].geometry.location,
            map,
          });
        } else {
          console.error("Geocoding failed:", status);
        }
      });
    }
  }, [firm, mapReady]);

  return (
    <>
      {/* Load Google Maps script only on the client */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCMMqnynUdYEbtnnhGUGrjeWPVU2x2GPj0`}
        strategy="afterInteractive"
        onLoad={() => setMapReady(true)}
      />

      <div className="min-h-screen bg-black text-white p-10">
        <div className="max-w-5xl mx-auto bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg shadow-lg p-10 flex flex-col gap-8">
          {!firm ? (
            <p>Зареждане...</p>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                {firm.logo ? (
                  <img
                    src={firm.logo}
                    alt="Firm Logo"
                    className="w-28 h-28 object-cover rounded-lg border border-gray-700"
                  />
                ) : (
                  <div className="text-gray-500 italic">Няма качено лого.</div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{firm.name}</h1>
                  <p className="text-gray-400 mt-2">{firm.description}</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Локация</h2>
                <p className="mb-2 text-gray-400">{firm.location}</p>
                <div
                  ref={mapRef}
                  className="w-full h-64 rounded-lg border border-[#222]"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
