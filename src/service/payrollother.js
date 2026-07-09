import axiosInstance from "./axiosinstance";
import { getFinancialYears, getTdsDeductionSections,getEmployeeUserProfile,overrideTaxProofile,DeleteDeclaration } from "../api/api";

export const getTdsActiveFinancialYear = async () => {
  try {
    const res = await axiosInstance.get(getFinancialYears);
    
    // DEBUG LOG: See the full response object
    console.log("Full Response - Financial Year:", res);
    // DEBUG LOG: See the data structure
    console.log("Data - Financial Year:", res.data?.data);

    return res.data?.data; 
  } catch (err) {
    console.error("Error in getActiveFinancialYear:", err);
    throw err;
  }
};

export const getPayrollTdsDeductionSections = async () => {
  try {
    const res = await axiosInstance.get(getTdsDeductionSections);
    
    // DEBUG LOG: See the full response object
    console.log("Full Response - Deduction Sections:", res);
    // DEBUG LOG: See the data structure
    console.log("Data - Deduction Sections:", res.data?.data);

    return res.data?.data || []; 
  } catch (err) {
    console.error("Error in getTdsDeductionSections:", err);
    throw err;
  }
};

export const fetchEmployeeProfile = async (userId) => {
  try {
    // Ensure getEmployeeUserProfile is the correct URL string
    console.log("Fetching profile for ID:", userId);
    
    const res = await axiosInstance.post(getEmployeeUserProfile, {
      user_id: userId
    });

    // Check if the response exists and has the expected structure
    if (res.data && res.data.ok) {
      return res.data.data;
    } else {
      throw new Error("API returned an error or unsuccessful status");
    }
  } catch (err) {
    console.error("Error in getEmployeeProfile:", err.response?.data || err.message);
    throw err; // Re-throw to handle it in your component
  }
};
export const deleteDeclaration = async (userId, payload) => {
  try {
    // We append userId as a query param and pass payload via 'data'
    const res = await axiosInstance.delete(`${DeleteDeclaration}?user_id=${userId}`, {
      data: payload
    });

    console.log("Delete Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Error in deleteDeclaration:", err.response?.data || err.message);
    throw err;
  }
};

export const overrideTaxProfile = async (userId, manualAnnualTax) => {
  try {
    // Standard payload structure
    const payload = {
      user_id: String(userId),
      // We pass the number as-is. If the backend fails, 
      // try changing this to String(manualAnnualTax)
      manual_annual_tax: parseFloat(manualAnnualTax) 
    };

    // Use query param OR body based on your backend logs. 
    // Most Go backends prefer the ID in the body for PUT/POST requests.
    const res = await axiosInstance.put(overrideTaxProofile, payload);

    return res.data;
  } catch (err) {
    console.error("Error in overrideTaxProfile:", err.response?.data || err.message);
    throw err;
  }
};