// src/utils/mapmodel.jsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const MapModal = ({ latitude, longitude, employeeName = "Employee", employeeImage = null, onClose }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      layers: [
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }),
      ],
    });

    const icon = L.icon({
      iconUrl: employeeImage || DEFAULT_AVATAR,
      iconSize: [50, 50],
      className: "rounded-full border-2 border-white",
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    marker.bindPopup(`<div style="display:flex; align-items:center;">
      <img src="${employeeImage || DEFAULT_AVATAR}" style="width:32px; height:32px; border-radius:50%; margin-right:8px;" />
      <span>${employeeName}</span>
    </div>`).openPopup();

    return () => {
      map.remove(); // Cleanup map on unmount
    };
  }, [latitude, longitude, employeeImage, employeeName]);

  if (!latitude || !longitude) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose} // Close if click outside modal
    >
      <div
        className="relative bg-white rounded-2xl shadow-lg w-11/12 md:w-3/4 lg:w-1/2 h-[500px]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-700 z-50"
        >
          &times;
        </button>

        {/* Map container */}
        <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "1rem" }} />
      </div>
    </div>
  );
};

export default MapModal;
