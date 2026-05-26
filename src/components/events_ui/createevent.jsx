import React, { useState, useEffect } from "react";
import { Drawer } from "@mui/material";
import EventEmployee from "./eventemployee";
import { createEvent, fetchTimeZone } from "../../service/eventservices";
import toast, { Toaster } from "react-hot-toast";

const EventCreate = () => {
  const [timeZone, setTimeZone] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    event_type: "",
    participation: [], // Array storing checked employee UUID strings
    place: "",
    link: "",
    when_to_notify: "",
    timezone: "",
  });

  useEffect(() => {
    const getTimeZoneData = async () => {
      try {
        const data = await fetchTimeZone();
        setTimeZone(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching timezones:", err);
      }
    };
    getTimeZoneData();
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentView, setCurrentView] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const formatTime = (minutes) => {
    if (!minutes) return "00:00:00";
    const hrs = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hrs}:${mins}:00`;
  };

  const formatDateTimeWithZone = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";
    const standardTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return `${dateStr}T${standardTime}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description)
      newErrors.description = "Description is required";
    if (!formData.start_date) newErrors.start_date = "Start Date is required";
    if (!formData.start_time) newErrors.start_time = "Start Time is required";
    if (!formData.end_date) newErrors.end_date = "End Date is required";
    if (!formData.end_time) newErrors.end_time = "End Time is required";
    if (!formData.event_type) newErrors.event_type = "Event type is required";
    if (!formData.timezone)
      newErrors.timezone = "Timezone selection is required";
    if (!formData.when_to_notify)
      newErrors.when_to_notify = "Notification timing is required";

    if (formData.event_type === "offline" && !formData.place) {
      newErrors.place = "Place is required for offline events";
    }
    if (formData.event_type === "online" && !formData.link) {
      newErrors.link = "Meeting link is required for online events";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const startDateTime = formatDateTimeWithZone(
        formData.start_date,
        formData.start_time,
      );
      const endDateTime = formatDateTimeWithZone(
        formData.end_date,
        formData.end_time,
      );

      const participationArray = formData.participation.map((uuid) => ({
        uuid,
      }));

      const eventPayload = {
        title: formData.title,
        description: formData.description,
        start_date: startDateTime,
        end_date: endDateTime,
        event_type: formData.event_type,
        participation: participationArray,
        place: formData.event_type === "offline" ? formData.place : "Online",
        meeting_url: formData.event_type === "online" ? formData.link : "",
        reminder_before: formatTime(parseInt(formData.when_to_notify, 10)),
        time_zone: formData.timezone,
      };

      try {
        const response = await createEvent(eventPayload);
        toast.success("Event created successfully");
        setFormData({
          title: "",
          description: "",
          start_date: "",
          start_time: "",
          end_date: "",
          end_time: "",
          event_type: "",
          participation: [],
          place: "",
          link: "",
          when_to_notify: "",
          timezone: "",
        });
      } catch (error) {
        toast.error("Error creating event. Please Try Again");
        console.error("Error creating event:", error);
      }
    }
  };

  // Handles checking/unchecking boxes from within the Drawer list view
  const handleEmployeeToggle = (uuid) => {
    setFormData((prevFormData) => {
      const isAlreadySelected = prevFormData.participation.includes(uuid);
      if (isAlreadySelected) {
        return {
          ...prevFormData,
          participation: prevFormData.participation.filter((id) => id !== uuid),
        };
      } else {
        return {
          ...prevFormData,
          participation: [...prevFormData.participation, uuid],
        };
      }
    });
  };

  // Removes a chip entry cleanly from the outside layout preview block
  const handleRemoveEmployee = (uuidToRemove) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      participation: prevFormData.participation.filter(
        (id) => id !== uuidToRemove,
      ),
    }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCurrentView(null);
  };

  return (
    <div className="h-auto min-h-[800px] p-8 bg-white font-['Poppins'] font-normal text-black">
      <h1 className="text-3xl text-black font-semibold mb-6 font-['Poppins']">
        Create Event
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {successMessage && (
          <div
            style={{ color: "green", marginBottom: "10px" }}
            className="font-['Poppins']"
          >
            {successMessage}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Title
          </label>
          <input
            className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
            name="title"
            placeholder="Event title"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && (
            <p className="text-red-500 text-sm font-['Poppins']">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Description
          </label>
          <textarea
            className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
            name="description"
            placeholder="Event description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p className="text-red-500 text-sm font-['Poppins']">
              {errors.description}
            </p>
          )}
        </div>

        {/* Start Date & Time */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.start_date}
              </p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              Start Time
            </label>
            <input
              type="time"
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.start_time}
              </p>
            )}
          </div>
        </div>

        {/* End Date & Time */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              End Date
            </label>
            <input
              type="date"
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.end_date}
              </p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              End Time
            </label>
            <input
              type="time"
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
            />
            {errors.end_time && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.end_time}
              </p>
            )}
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Event Type
          </label>
          <select
            className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
          >
            <option value="">Select event type</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          {errors.event_type && (
            <p className="text-red-500 text-sm font-['Poppins']">
              {errors.event_type}
            </p>
          )}
        </div>

        {/* Participation & Notify Container */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              Participation
            </label>
            <div className="relative">
              <div
                className="w-full h-10 border text-black border-gray-300 rounded-md p-2 pr-8 cursor-pointer font-['Poppins'] font-normal bg-white flex items-center"
                onClick={handleDrawerOpen}
              >
                {formData.participation.length > 0
                  ? `${formData.participation.length} employee(s) selected`
                  : "Select employees"}
              </div>
              <span
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 cursor-pointer"
                onClick={handleDrawerOpen}
              >
                &#9662;
              </span>
            </div>
            {errors.participation && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.participation}
              </p>
            )}
          </div>

          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={handleDrawerClose}
            PaperProps={{
              style: {
                backgroundColor: "white",
                width: "549px",
                borderRadius: "1rem",
              },
            }}
          >
            <EventEmployee
              onBack={handleDrawerClose}
              onClose={() => setDrawerOpen(false)}
              selectedEmployees={formData.participation} // Synchronized selection state
              onEmployeeToggle={handleEmployeeToggle} // Shared checkbox state engine
            />
          </Drawer>

          {/* Dropdown Reminder Selector */}
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              When to Notify
            </label>
            <select
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="when_to_notify"
              value={formData.when_to_notify}
              onChange={handleChange}
            >
              <option value="">Select reminder time</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="20">20 minutes before</option>
              <option value="30">30 minutes before</option>
            </select>
            {errors.when_to_notify && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.when_to_notify}
              </p>
            )}
          </div>
        </div>

        {/* Selected Employees Data Preview layout Chips view */}
        {formData.participation.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2 font-['Poppins']">
            <p className="text-sm font-medium text-gray-700 mb-2 font-['Poppins']">
              Selected Employees Data:
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.participation.map((uuid) => (
                <div
                  key={uuid}
                  className="flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-['Poppins'] font-normal"
                >
                  <span className="truncate max-w-[180px] font-['Poppins']">
                    {uuid}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmployee(uuid)}
                    className="ml-2 text-gray-500 hover:text-red-600 font-bold focus:outline-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditional Fields: Place/Link and Timezone Layout */}
        <div className="flex space-x-4">
          {formData.event_type === "offline" && (
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
                Place
              </label>
              <input
                className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
                name="place"
                placeholder="Event location"
                value={formData.place}
                onChange={handleChange}
              />
              {errors.place && (
                <p className="text-red-500 text-sm font-['Poppins']">
                  {errors.place}
                </p>
              )}
            </div>
          )}

          {formData.event_type === "online" && (
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
                Meeting Link
              </label>
              <input
                className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
                type="url"
                name="link"
                placeholder="https://example.com"
                value={formData.link}
                onChange={handleChange}
              />
              {errors.link && (
                <p className="text-red-500 text-sm font-['Poppins']">
                  {errors.link}
                </p>
              )}
            </div>
          )}

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
              Timezone
            </label>
            <select
              className="w-full border text-black border-gray-300 rounded-md p-2 font-['Poppins'] font-normal"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
            >
              <option value="">Select timezone</option>
              {timeZone.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.name}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="text-red-500 text-sm font-['Poppins']">
                {errors.timezone}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="bg-black text-white py-2 px-4 rounded font-['Poppins'] font-normal"
        >
          Create Event
        </button>
      </form>
      <Toaster />
    </div>
  );
};

export default EventCreate;
