import React, { useState } from "react";

function SettingsProfile({ formData, handleChange, handleUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await handleUpdate(e);
      setIsEditing(false); // Lock fields after successful API call
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* HEADER BAR WITH TOGGLE EDIT BUTTON */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-normal text-gray-800">
            Personal Details
          </h3>
          <p className="text-xs font-normal text-gray-500">
            {isEditing
              ? "Modify your information below and click Update to save changes."
              : "Click Edit to update your personal details."}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-black text-white px-5 py-1.5 rounded-md text-xs font-normal hover:bg-gray-800 transition-all"
          >
            Edit
          </button>
        )}
      </div>

      {/* INPUT FIELDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            First name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Last name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Email ID
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Phone number
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        {/* READ ONLY COMPANY */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Company
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            disabled
            className="w-full border border-gray-200 bg-gray-100 rounded-md px-3 py-2 text-sm font-normal text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* READ ONLY JOB TITLE */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Job Title
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            disabled
            className="w-full border border-gray-200 bg-gray-100 rounded-md px-3 py-2 text-sm font-normal text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Aadhaar Number
          </label>
          <input
            type="text"
            name="aadhar"
            value={formData.aadhar}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            PAN Card
          </label>
          <input
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            UAN
          </label>
          <input
            type="text"
            name="uan"
            value={formData.uan}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="N/A"
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            EPF Number
          </label>
          <input
            type="text"
            name="epfNumber"
            value={formData.epfNumber}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="N/A"
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            ESI Number
          </label>
          <input
            type="text"
            name="esiNumber"
            value={formData.esiNumber}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="N/A"
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        {/* MARITAL STATUS SELECT BOX */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Marital Status
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          >
            <option value="">Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        {/* BLOOD GROUP SELECT BOX */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Blood Group
          </label>
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Present Address
          </label>
          <input
            type="text"
            name="presentAddress"
            value={formData.presentAddress}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-normal">
            Permanent Address
          </label>
          <input
            type="text"
            name="permanentAddress"
            value={formData.permanentAddress}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border rounded-md px-3 py-2 text-sm font-normal focus:outline-none ${
              isEditing
                ? "border-gray-300 bg-white text-gray-800 focus:border-black"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          />
        </div>

        {/* ACTION BUTTONS */}
        {isEditing && (
          <div className="md:col-span-2 flex justify-end gap-3 mt-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-5 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-100 transition-all font-normal text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800 transition-all font-normal disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

export default SettingsProfile;
