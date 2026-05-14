import React from 'react'
import { useState, useEffect } from 'react';
import { X, MapPin, Wifi, Smartphone } from "lucide-react";
import moment from "moment";
import { fetchFullDetails } from '../../service/employeeService';
import { getGeolocation } from "../../utils/geolocation";

const formatTime = (timeString) => {
  if (!timeString || timeString === "0000-01-01T00:00:00Z") return "N/A";

  try {
    const [hours, minutes] = timeString.split("T")[1].split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  } catch {
    return "Invalid Time";
  }
};

const formatDuration = (timeString) => {
  if (!timeString || timeString === "0000-01-01T00:00:00Z") return "0 hrs";

  const duration = moment.duration(moment(timeString).diff(moment("0000-01-01T00:00:00Z")));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  return `${hours}h ${minutes}m`;
};

const ActivityFullDetails = ({ event, employeeId, onClose }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [locationAddresses, setLocationAddresses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadFullDetails = async () => {
      try {
        setIsLoading(true);
        // Format date as required by your API
        const formattedDate = moment(event.start).format("YYYY-MM-DD");
        const data = await fetchFullDetails(formattedDate, employeeId);
     
        
        if (Array.isArray(data) && data.length > 0) {
          setAttendanceRecords(data);
          
          // After setting records, fetch location data for records with coordinates
          fetchLocationAddresses(data);
        } else {
          setAttendanceRecords([]);
        }
      } catch (err) {
        console.error("Error loading full details:", err);
        setError("Failed to load employee details");
      } finally {
        setIsLoading(false);
      }
    };

    if (employeeId) {
      loadFullDetails();
    }
  }, [event, employeeId]);

  const fetchLocationAddresses = async (records) => {
    try {
      setIsLoadingLocations(true);
      const recordsWithCoordinates = records.filter(
        record => record.location_info?.latitude && record.location_info?.longitude
      );
      
      if (recordsWithCoordinates.length === 0) return;
      
      const addressMap = {};
      
      // Use Promise.all to fetch all addresses in parallel
      await Promise.all(recordsWithCoordinates.map(async (record) => {
        const { latitude, longitude } = record.location_info;
        const coordKey = `${latitude},${longitude}`;
        
        // Skip if we already have this location cached
        if (addressMap[coordKey]) return;
        
        try {
          const address = await getGeolocation(latitude, longitude);
          if (address) {
            addressMap[coordKey] = address;
          }
        } catch (err) {
          console.error(`Error fetching address for ${coordKey}:`, err);
        }
      }));
      
      setLocationAddresses(addressMap);
    } catch (err) {
      console.error("Error fetching location addresses:", err);
    } finally {
      setIsLoadingLocations(false);
    }
  };
  

  const getAddressForRecord = (record) => {
    if (!record.location_info?.latitude || !record.location_info?.longitude) {
      return null;
    }
    
    const coordKey = `${record.location_info.latitude},${record.location_info.longitude}`;
    return locationAddresses[coordKey];
  };

  if (isLoading) {
    return (
      <div className="bg-white h-full border-l rounded-lg border-gray-200 p-6 w-full flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white h-full border-l rounded-lg border-gray-200 p-6 w-full">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900">Error</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 text-red-600">
          {error}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white h-full border-l rounded-lg border-gray-200 p-6 w-full overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-base 4xl:text-xl font-semibold text-gray-900">
              Attendance Details
            </h3>
            <p className="text-gray-600 text-xs">
              {moment(event.start).format("MMMM D, YYYY")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No attendance records found for this date.</p>
            </div>
          ) : (
            attendanceRecords.map((record) => (
              <div 
                key={record.id} 
                className={`bg-gray-50 rounded-lg border ${
                  record.status === "IN" ? "border-green-200" : "border-blue-200"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md mr-2 ${
                        record.status === "IN" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {record.status}
                      </span>
                      <h5 className="font-medium text-gray-900">
                        {formatTime(record.time)}
                      </h5>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {record.status === "OUT" && record.elapsed_time && (
                        <div>
                          {/* Duration display removed as per original */}
                        </div>
                      )}
                      
                    
                      
                      <div className="flex items-start gap-1">
                        <Smartphone className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-500">Device:</span>
                          <p className="text-gray-900">{record.location_info?.device || "Not recorded"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {record.location_info?.latitude && record.location_info?.longitude && (
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-sm text-gray-500">Location:</span>
                            <p className="text-gray-900">
                              {getAddressForRecord(record) || (
                                isLoadingLocations 
                                  ? "Loading address..." 
                                  : `${record.location_info.latitude}, ${record.location_info.longitude}`
                              )}
                            </p>
                            {!getAddressForRecord(record) && !isLoadingLocations && (
                              <p className="text-gray-600 text-xs">
                                {record.location_info.latitude}, {record.location_info.longitude}
                              </p>
                            )}
                            <p className="text-xs text-gray-600">
                              Source: {record.location_info.source || "Unknown"}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {record.location_info?.network_info && (
                        <div className="flex items-start gap-1">
                          <Wifi className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-sm text-gray-500">Network:</span>
                            <p className="text-gray-900">
                              {record.location_info.network_info.wifi_name?.replace(/"/g, '') || "Not recorded"}
                            </p>
                            {record.location_info.network_info.wifi_ip && (
                              <p className="text-xs text-gray-600">
                                IP: {record.location_info.network_info.wifi_ip}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {attendanceRecords.length > 0 && attendanceRecords.some(r => r.status === "IN") && attendanceRecords.some(r => r.status === "OUT") && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">First Check-in:</span>
                  <p className="text-gray-900 font-medium">
                    {formatTime(attendanceRecords.find(r => r.status === "IN")?.time)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Check-out:</span>
                  <p className="text-gray-900 font-medium">
                    {formatTime(
                      [...attendanceRecords]
                        .filter(r => r.status === "OUT")
                        .sort((a, b) => new Date(b.time) - new Date(a.time))[0]?.time
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Records:</span>
                  <p className="text-gray-900 font-medium">
                    {attendanceRecords.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFullDetails;