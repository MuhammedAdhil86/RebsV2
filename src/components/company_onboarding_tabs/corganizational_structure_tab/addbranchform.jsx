// AddBranchForm.jsx
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx
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
  const [errors, setErrors] = useState({});
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

  /* ---------------- Handle Change ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};

    const name = formData.branchName.trim();
    const code = formData.branchCode.trim();
    const location = formData.location.trim();
    const description = formData.description.trim();
    const address = formData.address.trim();
    const lat = formData.latitude.toString().trim();
    const lng = formData.longitude.toString().trim();

    // Branch Name
    if (!name) {
      newErrors.branchName = "Branch name is required";
    } else if (name.length < 2) {
      newErrors.branchName =
        "Branch name is too short. Enter at least 2 characters";
    } else if (name.length > 100) {
      newErrors.branchName =
        "Branch name is too long. Enter 100 characters or fewer";
    }

    // Branch Code
    if (!code) {
      newErrors.branchCode = "Branch code is required";
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(code)) {
      newErrors.branchCode =
        "Branch code must be 2 to 20 characters and can only contain letters, numbers, hyphen (-) or underscore (_)";
    }

    // Location
    if (!location) {
      newErrors.location = "Location is required";
    } else if (location.length < 2) {
      newErrors.location = "Location is too short. Enter at least 2 characters";
    } else if (location.length > 255) {
      newErrors.location =
        "Location is too long. Enter 255 characters or fewer";
    }

    // Description
    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length < 5) {
      newErrors.description =
        "Description is too short. Enter at least 5 characters";
    } else if (description.length > 500) {
      newErrors.description =
        "Description is too long. Enter 500 characters or fewer";
    }

    // Branch Address
    if (!address) {
      newErrors.address = "Branch address is required";
    } else if (address.length < 5) {
      newErrors.address =
        "Branch address is too short. Enter at least 5 characters";
    } else if (address.length > 255) {
      newErrors.address =
        "Branch address is too long. Enter 255 characters or fewer";
    }

    // Time Zone
    if (!formData.timeZone) {
      newErrors.timeZone = "Please select a time zone";
    }

    // Latitude
    if (!lat) {
      newErrors.latitude = "Latitude is required";
    } else if (isNaN(Number(lat))) {
      newErrors.latitude = "Latitude must be a number, for example 10.5204";
    } else if (Number(lat) < -90 || Number(lat) > 90) {
      newErrors.latitude = "Latitude must be a value between -90 and 90";
    }

    // Longitude
    if (!lng) {
      newErrors.longitude = "Longitude is required";
    } else if (isNaN(Number(lng))) {
      newErrors.longitude = "Longitude must be a number, for example 76.2144";
    } else if (Number(lng) < -180 || Number(lng) > 180) {
      newErrors.longitude = "Longitude must be a value between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Fetch Current Location Logic ---------------- */
  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support location access");
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

          // Clear errors for the fields that were just filled
          setErrors((prev) => ({
            ...prev,
            latitude: "",
            longitude: "",
            location: "",
          }));

          toast.success("Current location added successfully");
        } catch (err) {
          toast.error("Could not get your location details. Please try again");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        toast.error(
          "Location access was denied. Please allow location permission in your browser settings",
        );
        setLoadingLocation(false);
      },
    );
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields and try again");
      return;
    }

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
        setErrors({});
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Could not add the branch. Please try again");
    }
  };

  return (
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
          {errors.branchName && (
            <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>
          )}
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
          {errors.branchCode && (
            <p className="text-red-500 text-xs mt-1">{errors.branchCode}</p>
          )}
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
          {errors.location && (
            <p className="text-red-500 text-xs mt-1">{errors.location}</p>
          )}
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
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div className="flex flex-col justify-between">
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
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
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
            {errors.timeZone && (
              <p className="text-red-500 text-xs mt-1">{errors.timeZone}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
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
            {(errors.latitude || errors.longitude) && (
              <p className="text-red-500 text-xs mt-1">
                {errors.latitude || errors.longitude}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <CancelButton
          onClick={() => {
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
            setErrors({});
          }}
        />
        <GlowButton type="submit">Save</GlowButton>
      </div>
    </form>
  );
};

export default AddBranchForm;
