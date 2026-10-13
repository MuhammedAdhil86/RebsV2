import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import { addDivision, getBranchData } from "../../../service/companyService";
import { fetchTimeZone } from "../../../service/eventservice";
import { getGeolocation } from "../../../utils/geolocation";

import GlowButton from "../../helpers/glowbutton";
import CancelButton from "../../helpers/cancelbutton";

const AddDivisionForm = () => {
  const [branches, setBranches] = useState([]);
  const [timeZones, setTimeZones] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [formData, setFormData] = useState({
    divisionName: "",
    divisionCode: "",
    location: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    timeZone: "",
    parentBranch: "",
  });

  /* ---------------- Fetch Branches ---------------- */
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getBranchData();
        setBranches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, []);

  /* ---------------- Fetch Timezones ---------------- */
  useEffect(() => {
    const fetchTZ = async () => {
      try {
        const data = await fetchTimeZone();
        setTimeZones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTZ();
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

    const name = formData.divisionName.trim();
    const code = formData.divisionCode.trim();
    const location = formData.location.trim();
    const description = formData.description.trim();
    const address = formData.address.trim();
    const lat = formData.latitude.toString().trim();
    const lng = formData.longitude.toString().trim();

    // Division Name
    if (!name) {
      newErrors.divisionName = "Division name is required";
    } else if (name.length < 2) {
      newErrors.divisionName = "Division name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.divisionName = "Division name must be 100 characters or less";
    }

    // Division Code
    if (!code) {
      newErrors.divisionCode = "Division code is required";
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(code)) {
      newErrors.divisionCode = "2-20 characters: letters, numbers, - or _ only";
    }

    // Location
    if (!location) {
      newErrors.location = "Location is required";
    } else if (location.length < 2) {
      newErrors.location = "Location must be at least 2 characters";
    } else if (location.length > 255) {
      newErrors.location = "Location must be 255 characters or less";
    }

    // Description
    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length < 5) {
      newErrors.description = "Description must be at least 5 characters";
    } else if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    // Address
    if (!address) {
      newErrors.address = "Address is required";
    } else if (address.length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    } else if (address.length > 255) {
      newErrors.address = "Address must be 255 characters or less";
    }

    // Time Zone
    if (!formData.timeZone) {
      newErrors.timeZone = "Time zone is required";
    }

    // Parent Branch
    if (!formData.parentBranch) {
      newErrors.parentBranch = "Parent branch is required";
    }

    // Latitude
    if (!lat) {
      newErrors.latitude = "Latitude is required";
    } else if (isNaN(Number(lat))) {
      newErrors.latitude = "Latitude must be a number";
    } else if (Number(lat) < -90 || Number(lat) > 90) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }

    // Longitude
    if (!lng) {
      newErrors.longitude = "Longitude is required";
    } else if (isNaN(Number(lng))) {
      newErrors.longitude = "Longitude must be a number";
    } else if (Number(lng) < -180 || Number(lng) > 180) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Fetch Current Location ---------------- */
  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
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
            location: formattedLocation || "",
          }));

          // Clear errors for the fields that were just filled
          setErrors((prev) => ({
            ...prev,
            latitude: "",
            longitude: "",
            location: "",
          }));

          toast.success("Location fetched");
        } catch (err) {
          toast.error("Failed to fetch location");
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        toast.error("Location permission denied");
        setLoadingLocation(false);
      },
    );
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    const payload = {
      name: formData.divisionName,
      code: formData.divisionCode,
      desc: formData.description,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      location: formData.location,
      time_zone: formData.timeZone,
    };

    try {
      await addDivision(formData.parentBranch, payload);

      toast.success("Division added successfully");

      setFormData({
        divisionName: "",
        divisionCode: "",
        location: "",
        description: "",
        address: "",
        latitude: "",
        longitude: "",
        timeZone: "",
        parentBranch: "",
      });

      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to add division");
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Division Name
            </label>
            <input
              type="text"
              name="divisionName"
              value={formData.divisionName}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm"
            />
            {errors.divisionName && (
              <p className="text-red-500 text-xs mt-1">{errors.divisionName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Division Code
            </label>
            <input
              type="text"
              name="divisionCode"
              value={formData.divisionCode}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm"
            />
            {errors.divisionCode && (
              <p className="text-red-500 text-xs mt-1">{errors.divisionCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm"
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full h-[120px] border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Address Line
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm"
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
                  className="w-full appearance-none border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {timeZones.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.name}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="material-symbols:arrow-left-rounded"
                  className="absolute right-3 top-3 rotate-[-90deg]"
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
                  className="flex items-center justify-center w-10 h-10 border bg-gray-50 rounded-md cursor-pointer"
                >
                  <Icon icon="mdi:location" />
                </div>

                <div className="flex-1">
                  <label className="block text-sm">Latitude</label>
                  <input
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full border bg-gray-50 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm">Longitude</label>
                  <input
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full border bg-gray-50 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(errors.latitude || errors.longitude) && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.latitude || errors.longitude}
                </p>
              )}
            </div>

            <div className="pt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Parent Branch
              </label>
              <select
                name="parentBranch"
                value={formData.parentBranch}
                onChange={handleChange}
                className="w-full border bg-gray-50 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.parentBranch && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.parentBranch}
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
                divisionName: "",
                divisionCode: "",
                location: "",
                description: "",
                address: "",
                latitude: "",
                longitude: "",
                timeZone: "",
                parentBranch: "",
              });
              setErrors({});
            }}
          >
            Cancel
          </CancelButton>

          <GlowButton type="submit">Save</GlowButton>
        </div>
      </form>
    </>
  );
};

export default AddDivisionForm;
