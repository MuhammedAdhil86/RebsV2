import {
    BASEURL,
    GetCallRecords,
    UpdateUser,
  } from "../api";
  import axios from "axios";
  
  const ApiServices = axios.create({
    baseURL: BASEURL,
  });

  export const GetAllCallRecords = async () => {
    try {
    //   let token = localStorage.getItem("authToken");
    //   console.log("current token", token);
    //   if (!token) {
    //     navigate("/");
    //     throw new Error("Authentication token not found");
    //   }
  
      const response = await ApiServices.post(GetCallRecords,{},{
          headers: {
            "Content-Type": "application/json"
            // Authorization: token,
          },
        }
      );
      
    //   console.log("All Available Headers:", response.headers);
    //   // Check if the Authorization header is present in the response
    //   const authorizationHeader = response.headers.get("Authorization");
    //   console.log("Updated Token:", authorizationHeader);
    //   console.log("All Headers:", response.headers);
    //   if (authorizationHeader) {
    //     // Save the token to local storage
    //     localStorage.setItem("authToken", authorizationHeader);
    //     console.log("Updated Token:", authorizationHeader);
    //   }
  
      if (response.status >= 200 && response.status < 300) {
        const userData = response.data;
        return userData; // Return success data
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  };