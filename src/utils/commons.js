import { format } from 'date-fns';
import axios from 'axios';

export function dateConvertor(date) {
  const apiDate = date //"Mon Dec 11 10:22:09 UTC 2023";

  // Parse the API date string to a Date object
  const parsedDate = new Date(apiDate);

  // Format the date using date-fns
  const formattedDate = format(parsedDate, "dd/MM/yyyy h:mm a");

  console.log(formattedDate); // Output: 11/12/2023 10:22 AM
  return formattedDate;
}


export const formatDate = (dateString) => {
  const[date, time] = dateString.split("")

    // const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
    // return new Date(date).toLocaleDateString('en-US', options);
    return [date];
  };

  export const formatCallStatus = (callStatus) => {
    if(callStatus.Valid){
      return callStatus.String
    }else{
      return "Not Called"
    }
    
  };

  export const formatStaffName = (staff) => {
    if(staff.Valid){
      return staff.String
    }else{
      return "Unassigned"
    }
  };

  export const formatedCountry = (countryObj)=>{
    if(countryObj.Valid){
      return countryObj.String
    }
  }

  export const formatedPossibility = (possibility)=>{
    if(possibility.Valid){
      return possibility.String
    }else{
      return "Cold"
    }
  }

  export const formatedFollowupCount = (followupcount)=>{
    if(followupcount.Valid){
      return followupcount.String
    }else{
      return "0"
    }
  }

  export const formatedLeadstatus = (leadstatus)=>{
    if(leadstatus.Valid){
      return leadstatus.String
    }else{
      return "Unknown"
    }
  }

  export const formatDesignation = (designation) => {
    if(designation.Valid){
      return designation.String
    }else{
      return "Unassigned"
    }
  };

  export function DateTimeFormatter(datetime) {
    var [dateString, timeString] = datetime.split(' ');
    var [day, month, year] = dateString.split('/');
    var [hour, minute, second] = timeString.split(':');
  
    // Parse the datetime into a Date object
    var parsedDate = new Date(year, month - 1, day, hour, minute, second);
  
    // Check if the date is today
    if (isToday(parsedDate)) {
      // Calculate time ago if date is today
      var timeAgo = calculateTimeAgo(parsedDate);
      return [dateString, timeAgo];
    } else {
      // Format time for other dates
      return [dateString, formatTime(parsedDate)];
    }
  }
  
  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };
  
  const calculateTimeAgo = (parsedDate) => {
    const now = new Date();
    const difference = now - parsedDate;
    let agoString = '';
  
    // Calculate time difference in seconds
    const seconds = Math.floor(difference / 1000);
    if (seconds < 60) {
      agoString = seconds + ' seconds ago';
    } else {
      // Calculate time difference in minutes
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) {
        agoString = minutes === 1 ? '1 min ago' : minutes + ' min ago';
      } else {
        // Calculate time difference in hours
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          agoString = hours === 1 ? '1 hour ago' : hours + ' hours ago';
        } else {
          // Calculate time difference in days
          const days = Math.floor(hours / 24);
          agoString = days === 1 ? '1 day ago' : days + ' days ago';
        }
      }
    }
    return agoString;
  };
  
  const formatTime = (parsedDate) => {
    let hours = parsedDate.getHours();
    let minutes = parsedDate.getMinutes();
    let amOrPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert hour to 12-hour format
    minutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if minutes < 10
    return hours + ':' + minutes + ' ' + amOrPm;
  };

  export const inputTextDateFormat = (dateString)=>{
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }

export const getGeolocation = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;

  const API_KEY = 'YOUR_API_KEY'; // Replace with your API key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  try {
    const { data } = await axios.get(url);

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address; // e.g., "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA"
    } else {
      console.warn('Geocoding API returned no results or error:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
};



  export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }
  
  // Helper function to convert degrees to radians
  function toRad(degrees) {
    return degrees * (Math.PI / 180);
  }