// AddBranchForm.jsx
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast"; // Added Toaster and toast
import axiosInstance from "../../../service/axiosinstance";
import GlowButton from "../../helpers/glowbutton";
import CancelButton from "../../helpers/cancelbutton";
import { getGeolocation } from "../../../utils/geolocation";

const AddBranchForm = () => {
  const [formData, setFormData] = useState({
    branchName: "",
    branchCode: "",
    location: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    timeZone: "",
  });

  const [timeZones, setTimeZones] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const fetchTimeZones = async () => {
      try {
        const res = await axiosInstance.get("/admin/timezone/get");
        if (res.data?.data) {
          setTimeZones(res.data.data);
          if (res.data.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              timeZone: res.data.data[0].id.toString(),
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching time zones:", error);
      }
    };
    fetchTimeZones();
  }, []);

  /* ---------------- Fetch Current Location Logic ---------------- */
  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();

        try {
          const formattedLocation = await getGeolocation(lat, lng);

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: formattedLocation || prev.location,
          }));
          toast.success("Location fetched successfully");
        } catch (err) {
          toast.error("Failed to fetch location address");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        toast.error("Location permission denied");
        setLoadingLocation(false);
      },
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.branchName,
        code: formData.branchCode,
        description: formData.description,
        time_zone: formData.timeZone,
        longitude: formData.longitude,
        latitude: formData.latitude,
        address: formData.address,
        location: formData.location,
      };

      const res = await axiosInstance.post("/branch/add", payload);
      if (res.data?.status_code === 200) {
        toast.success(res.data.message || "Branch added successfully");
        setFormData({
          branchName: "",
          branchCode: "",
          location: "",
          description: "",
          address: "",
          latitude: "",
          longitude: "",
          timeZone: timeZones.length > 0 ? timeZones[0].id.toString() : "",
        });
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Failed to add branch");
    }
  };

  return (
    <>
      {/* Toaster component must be present for toasts to show */}
      <Toaster position="top-right" reverseOrder={false} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              placeholder="Enter name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Branch Code
            </label>
            <input
              type="text"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
              placeholder="Enter code"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="row-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              className="w-full h-[120px] border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-black"
            ></textarea>
          </div>

          <div className="flex flex-col justify-between h-[120px]">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Branch Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div className="pt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Time Zone
              </label>
              <div className="relative">
                <select
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.name}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="material-symbols:arrow-left-rounded"
                  className="absolute right-3 top-3 text-gray-500 rotate-[-90deg] text-lg pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-[120px]">
            <div className="flex items-end gap-3">
              <div
                onClick={handleFetchLocation}
                className={`flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md transition ${
                  loadingLocation
                    ? "bg-gray-200 cursor-not-allowed"
                    : "cursor-pointer hover:bg-gray-100"
                }`}
              >
                <Icon
                  icon={
                    loadingLocation
                      ? "line-md:loading-twotone-loop"
                      : "mdi:location"
                  }
                  className={`${loadingLocation ? "text-blue-500" : "text-gray-600"} text-[18px]`}
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <CancelButton
            onClick={() =>
              setFormData({
                branchName: "",
                branchCode: "",
                location: "",
                description: "",
                address: "",
                latitude: "",
                longitude: "",
                timeZone:
                  timeZones.length > 0 ? timeZones[0].id.toString() : "",
              })
            }
          />
          <GlowButton type="submit">Save</GlowButton>
        </div>
      </form>
    </>
  );
};

export default AddBranchForm;
