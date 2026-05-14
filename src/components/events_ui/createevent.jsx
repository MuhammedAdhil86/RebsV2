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
    participation: [],
    place: "",
    link: "",
    when_to_notify: "", // Assume this is in minutes
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
    const hrs = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hrs}:${mins}:00`;
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
    // if (formData.participation.length === 0)
    //   newErrors.participation = "At least one participant is required";
    if (!formData.place) newErrors.place = "Place is required";
    if (formData.event_type === "online" && !formData.link) {
      newErrors.link = "Meeting link is required for online events";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const startDateTime = new Date(
        `${formData.start_date}T${formData.start_time}`,
      ).toISOString();
      const endDateTime = new Date(
        `${formData.end_date}T${formData.end_time}`,
      ).toISOString();

      // Convert participation array to an array of objects with `uuid` keys
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
        place: formData.place,
        meeting_url: formData.link || "",
        reminder_before: formatTime(parseInt(formData.when_to_notify, 10)), // Convert to HH:MM:SS
        time_zone: formData.timezone,
      };

      try {
        const response = await createEvent(eventPayload);
        toast.success("Event created successfully");
        console.log("Event created successfully:", response);
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
        toast.error("Error creating event.Please Try Again");
        console.error("Error creating event:", error);
      }
    }
  };

  const handleEmployeeSelection = (uuid) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      participation: [...prevFormData.participation, uuid],
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
    <div className=" h-[800px] p-8">
      <h1 className="text-3xl text-black font-semibold mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {successMessage && (
          <div style={{ color: "green", marginBottom: "10px" }}>
            {successMessage}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            className="w-full border text-black border-gray-300 rounded-md p-2"
            name="title"
            placeholder="Event title"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title}</p>
          )}
        </div>

        <div className="h-16">
          <label className="block text-sm  -mt-4 font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="w-full border  text-black border-gray-300 rounded-md p-2"
            name="description"
            placeholder="Event description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>

        <div className="flex space-x-4 ">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              className="w-full  border text-black border-gray-300 rounded-md p-2"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm">{errors.start_date}</p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              className="w-full border text-black border-gray-300 rounded-md p-2"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm">{errors.start_time}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              className="w-full  border text-black border-gray-300 rounded-md p-2"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm">{errors.end_date}</p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              className="w-full border text-black border-gray-300 rounded-md p-2"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
            />
            {errors.end_time && (
              <p className="text-red-500 text-sm">{errors.end_time}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm -mt-4 font-medium text-gray-700">
            Event Type
          </label>
          <select
            className="w-full border text-black border-gray-300 rounded-md p-2"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
          >
            <option value="">Select event type</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          {errors.event_type && (
            <p className="text-red-500 text-sm">{errors.event_type}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm -mt-4 font-medium text-gray-700">
              Participation
            </label>
            <div className="relative">
              <div
                className="w-full h-10 border text-black border-gray-300 rounded-md p-2 pr-8 cursor-pointer"
                onClick={handleDrawerOpen}
              >
                {"Select employees"}
              </div>
              <span
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 cursor-pointer"
                onClick={handleDrawerOpen}
              >
                &#9662;
              </span>
            </div>
            {errors.participation && (
              <p className="text-red-500 text-sm">{errors.participation}</p>
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
              onEmployeeSelect={handleEmployeeSelection}
            />
          </Drawer>

          <div className="w-1/2">
            <label className="block text-sm -mt-4 font-medium text-gray-700">
              When to Notify
            </label>
            <input
              type="time" // Changed to time input
              className="w-full border text-black border-gray-300 rounded-md p-2"
              name="when_to_notify"
              value={formData.when_to_notify}
              onChange={handleChange}
              required // Ensures a valid time is entered
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Place
            </label>
            <input
              className="w-full border text-black border-gray-300 rounded-md p-2"
              name="place"
              placeholder="Event location"
              value={formData.place}
              onChange={handleChange}
            />
            {errors.place && (
              <p className="text-red-500 text-sm">{errors.place}</p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              className="w-full border text-black border-gray-300 rounded-md p-2"
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
              <p className="text-red-500 text-sm">{errors.timezone}</p>
            )}
          </div>
        </div>

        {formData.event_type === "online" && (
          <div>
            <label className="block text-sm -mt-4 font-medium text-gray-700">
              Link (Optional)
            </label>
            <input
              className="w-full border text-black border-gray-300 rounded-md p-2"
              type="url"
              name="link"
              placeholder="https://example.com"
              value={formData.link}
              onChange={handleChange}
            />
            {errors.link && (
              <p className="text-red-500 text-sm">{errors.link}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="bg-black text-white font-semibold py-2 px-4 rounded"
        >
          Create Event
        </button>
      </form>
      <Toaster />
    </div>
  );
};

export default EventCreate;
