// utils.jsx
import { format } from 'date-fns';
import axios from 'axios';

export function dateConvertor(date) {
  const apiDate = date;
  const parsedDate = new Date(apiDate);
  const formattedDate = format(parsedDate, "dd/MM/yyyy h:mm a");
  console.log(formattedDate);
  return formattedDate;
}

export const formatDate = (dateString) => {
  const [date, time] = dateString.split("");
  return [date];
};

export const formatCallStatus = (callStatus) => {
  if (callStatus.Valid) {
    return callStatus.String;
  } else {
    return "Not Called";
  }
};

export const formatStaffName = (staff) => {
  if (staff.Valid) {
    return staff.String;
  } else {
    return "Unassigned";
  }
};

export const formatedCountry = (countryObj) => {
  if (countryObj.Valid) {
    return countryObj.String;
  }
};

export const formatedPossibility = (possibility) => {
  if (possibility.Valid) {
    return possibility.String;
  } else {
    return "Cold";
  }
};

export const formatedFollowupCount = (followupcount) => {
  if (followupcount.Valid) {
    return followupcount.String;
  } else {
    return "0";
  }
};

export const formatedLeadstatus = (leadstatus) => {
  if (leadstatus.Valid) {
    return leadstatus.String;
  } else {
    return "Unknown";
  }
};

export const formatDesignation = (designation) => {
  if (designation.Valid) {
    return designation.String;
  } else {
    return "Unassigned";
  }
};

export function DateTimeFormatter(datetime) {
  const [dateString, timeString] = datetime.split(' ');
  const [day, month, year] = dateString.split('/');
  const [hour, minute, second] = timeString.split(':');

  const parsedDate = new Date(year, month - 1, day, hour, minute, second);

  if (isToday(parsedDate)) {
    const timeAgo = calculateTimeAgo(parsedDate);
    return [dateString, timeAgo];
  } else {
    return [dateString, formatTime(parsedDate)];
  }
}

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

const calculateTimeAgo = (parsedDate) => {
  const now = new Date();
  const difference = now - parsedDate;
  let agoString = "";

  const seconds = Math.floor(difference / 1000);
  if (seconds < 60) {
    agoString = seconds + " seconds ago";
  } else {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      agoString = minutes === 1 ? "1 min ago" : minutes + " min ago";
    } else {
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        agoString = hours === 1 ? "1 hour ago" : hours + " hours ago";
      } else {
        const days = Math.floor(hours / 24);
        agoString = days === 1 ? "1 day ago" : days + " days ago";
      }
    }
  }
  return agoString;
};

const formatTime = (parsedDate) => {
  let hours = parsedDate.getHours();
  let minutes = parsedDate.getMinutes();
  let amOrPm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return hours + ":" + minutes + " " + amOrPm;
};

export const inputTextDateFormat = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

export const getGeolocation = async (latitude, longitude) => {
  const API_KEY = "**************";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      return response.data.results[0].formatted_address;
    } else {
      throw new Error("Geocode failed: " + response.data.status);
    }
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
};

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
