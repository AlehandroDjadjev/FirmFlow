import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "280px",
};

const LocationPicker = ({ setLocation }) => {
  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState({
    lat: 42.679306,
    lng:  23.338465,
  });

  useEffect(() => {
    const savedLatitude = localStorage.getItem("latitude");
    const savedLongitude = localStorage.getItem("longitude");

    if (savedLatitude && savedLongitude) {
      const lat = parseFloat(savedLatitude);
      const lng = parseFloat(savedLongitude);
      setMarkerPosition({ lat, lng });
    }
  }, []);

  const handleMapClick = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPosition({ lat: newLat, lng: newLng });

    // Save to localStorage
    localStorage.setItem("latitude", newLat);
    localStorage.setItem("longitude", newLng);

    // Send to parent component to update form data
    setLocation({ latitude: newLat, longitude: newLng });
  };

  const handleMarkerDragEnd = () => {
    const position = markerPosition;
    localStorage.setItem("latitude", position.lat);
    localStorage.setItem("longitude", position.lng);
    setLocation(position);
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyCMMqnynUdYEbtnnhGUGrjeWPVU2x2GPj0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={10}
        onClick={handleMapClick}
        onLoad={(mapInstance) => setMap(mapInstance)}
      >
        <Marker
          position={markerPosition}
          draggable
          onDragEnd={handleMarkerDragEnd}
        />
      </GoogleMap>
    </LoadScript>
  );
};

export default LocationPicker;
