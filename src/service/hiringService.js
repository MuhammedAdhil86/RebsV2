import axiosInstance from "./axiosinstance";
import { 
  addVacancies, 
  getPlatforms, 
  getJobEnquiries, 
  reviewApplication, 
  updateApplicationStatus,
  sendInvitationOnHire, // New Import
  sendRejectionMail     // New Import
} from "../api/api";

/**
 * Fetch dynamic platforms from /admin/platform/get
 */
export const fetchPlatforms = async () => {
  try {
    const response = await axiosInstance.get(getPlatforms);
    return response.data?.data || []; 
  } catch (error) {
    console.error("Error fetching platforms:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch Job Applications list
 */
export const fetchJobEnquiries = async () => {
  try {
    const response = await axiosInstance.get(getJobEnquiries);
    return response.data?.data || []; 
  } catch (error) {
    console.error("Error fetching enquiries:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Move a job application to 'under_review' status
 * Uses query parameter ?id={id}
 */
export const moveToReview = async (id) => {
  try {
    const response = await axiosInstance.patch(`${reviewApplication}?id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Error moving to review:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update the status of a job application (Shortlisted, Rejected, etc.)
 * Path: PUT /job-applications/update-status
 */
export const changeApplicationStatus = async (payload) => {
  try {
    const cleanPayload = {
      id: parseInt(payload.id),
      status: payload.status
    };

    const response = await axiosInstance.put(updateApplicationStatus, cleanPayload);
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    
    // Graceful handling for strict backend (already set status)
    if (errorData?.data?.includes("already")) {
      return {
        status_code: 200, 
        message: "Status was already set to " + payload.status,
        already_set: true
      };
    }

    console.error("Error updating application status:", errorData || error.message);
    throw error;
  }
};

/**
 * NEW: Send hiring invitation email to candidate
 * Path: PUT /company/jobApplications/send/invitation-on-hire/{id}
 */
export const sendHiringInvitation = async (id) => {
  try {
    const response = await axiosInstance.put(`${sendInvitationOnHire}${id}`);
    return response.data;
  } catch (error) {
    console.error("Error sending invitation:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * NEW: Send rejection email to candidate
 * Path: PUT /company/jobApplications/send/rejection/{id}
 */
export const sendRejectionEmail = async (id) => {
  try {
    const response = await axiosInstance.put(`${sendRejectionMail}${id}`);
    return response.data;
  } catch (error) {
    console.error("Error sending rejection:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Add a new vacancy
 */
export const createVacancy = async (data) => {
  try {
    const formData = new FormData();
    formData.append("poster", data.poster); 
    formData.append("title", data.title);
    formData.append("position", data.position);
    formData.append("expiry_date", data.expiry_date);
    formData.append("description", data.description);
    formData.append("salary", data.salary);
    formData.append("salary_period", data.salary_period);
    formData.append("job_type", data.job_type);
    formData.append("area_of_work", data.area_of_work);
    formData.append("year_of_experience", data.year_of_experience);
    formData.append("work_location", data.work_location);

    const platformValue = typeof data.platform === "string" 
      ? data.platform 
      : JSON.stringify(data.platform);
    formData.append("platform", platformValue);

    const response = await axiosInstance.post(addVacancies, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating vacancy:", error.response?.data || error.message);
    throw error;
  }
};