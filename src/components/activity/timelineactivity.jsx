import React, { useState, useEffect } from "react";
import moment from "moment";
import { fetchTimeline } from "../../service/companyService";

const EmployeeTimeline = ({ month, year, employeeId }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getTimelineData = async () => {
      if (!month || !year || !employeeId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const timelineData = await fetchTimeline(month, year, employeeId);


        setActivities(timelineData || []);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
        setError("Failed to load timeline. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    getTimelineData();
  }, [month, year, employeeId]);

  // Dot color mapping
  const getDotColor = (type) => {
    const colors = {
      attendance: "bg-green-500",
      leave: "bg-purple-500",
      wfh: "bg-orange-500",
      "weekly off": "bg-gray-500",
      absent: "bg-red-500",
      default: "bg-black",
    };
    return colors[type?.toLowerCase()] || colors.default;
  };

  const formatTime = (t) => {
    if (!t || t.includes("0000-01-01")) return "N/A";
    return moment(t).format("hh:mm A");
  };

  const formatDate = (d) => {
    if (!d) return "";
    return moment(d).format("MMM D, YYYY");
  };

  const formatDateTime = (d) => {
    if (!d || d.includes("0000-01-01")) return "";
    return `${moment(d).format("MMM D, YYYY")} ${moment(d).format("hh:mm A")}`;
  };

  const formatDuration = (timeString) => {
    if (!timeString || timeString.includes("0000-01-01")) return "0h 0m";
    const duration = moment.duration(moment(timeString).diff(moment("0000-01-01")));
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
  };

  return (
    <div className=" h-96 rounded-lg overflow-y-auto bg-white">
      <h2 className="text-[14px]  text-black mb-4 text-center">
        Employee Activity{" "}
        {month && year ? `(${moment().month(month - 1).format("MMMM")} ${year})` : ""}
      </h2>

      {isLoading ? (
        <div className="h-64 flex justify-center items-center">
          <p className="text-gray-500">Loading activities...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex justify-center items-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="h-64 flex justify-center items-center">
          <p className="text-gray-500">No activities found</p>
        </div>
      ) : (
        <div className="relative border-l border-gray-300 ml-4">
          {activities.map((activity, index) => (
            <div key={index} className="mb-8 relative pl-6">
              {/* DOT */}
              <span
                className={`absolute -left-[10px] w-4 h-4 rounded-full border ${
                  activity.approval_status === "Rejected" ? "border-red-600" : "border-white"
                } ${getDotColor(activity.record_type)}`}
              ></span>

              {/* ROW LAYOUT */}
              <div className="grid grid-cols-2 gap-4">
                {/* LEFT COLUMN */}
                <div>
                  <p className="text-sm font-medium">
                    {activity.record_type || "Activity"}
                  </p>

                  <p className="text-xs text-gray-600">
                    Requested: {formatDateTime(activity.requested_date)}
                  </p>

                  <p className="text-xs text-gray-600">
                    For: {formatDate(activity.date)}
                  </p>

                  {activity.status && (
                    <p className="text-xs text-gray-600 mt-1">
                      {activity.status.length > 60
                        ? `${activity.status.substring(0, 60)}...`
                        : activity.status}
                    </p>
                  )}

                  {activity.in && (
                    <p className="text-xs text-gray-600">In: {formatTime(activity.in)}</p>
                  )}
                  {activity.out && (
                    <p className="text-xs text-gray-600">Out: {formatTime(activity.out)}</p>
                  )}
                </div>

                {/* RIGHT COLUMN */}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      activity.approval_status === "Rejected"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {activity.approval_status || "Pending"}
                  </p>

                  {activity.approval_date?.Valid && (
                    <p className="text-xs text-gray-600">
                      {activity.approval_status === "Rejected" ? "Rejected" : "Approved"}:{" "}
                      {formatDateTime(activity.approval_date.Time)}
                    </p>
                  )}

                  {activity.manager_approver && (
                    <p className="text-xs text-gray-600">
                      By: {activity.manager_approver}
                    </p>
                  )}

                  {activity.duration && (
                    <p className="text-xs text-gray-600">
                      Duration: {formatDuration(activity.duration)}
                    </p>
                  )}

                  {activity.approver_name && !activity.manager_approver && (
                    <p className="text-xs text-gray-600">
                      By: {activity.approver_name}
                    </p>
                  )}
                </div>
              </div>

              {/* CONNECTOR LINE */}
              {index < activities.length - 1 && (
                <div className="absolute left-[-2px] top-6 h-full w-[2px] bg-lime-500"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeline;

