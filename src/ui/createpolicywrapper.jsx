import React, { useState } from "react";
import CreateAttendancePolicyTab from "./createattendancepolicy";

const CreateAttendancePolicyTabWrapper = () => {
  const [showPolicyTab, setShowPolicyTab] = useState(false);

  return (
    <div className="w-full">
      {/* Header */}
      {!showPolicyTab && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[16px] font-medium text-gray-900">
            Attendance Policies
          </h2>
          <button
            onClick={() => setShowPolicyTab(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs"
          >
            Create Policy
          </button>
        </div>
      )}

      {/* Tab Content */}
      {showPolicyTab ? (
        <div className="w-full min-h-screen bg-white p-6 rounded-md shadow-md">
          {/* Render your modal content inline */}
          <CreateAttendancePolicyTab
            isOpen={true} // always true to show content
            onClose={() => setShowPolicyTab(false)} // closes tab
          />
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center py-10">
          {/* Placeholder for policy list/table */}
          All policies will be displayed here.
        </div>
      )}
    </div>
  );
};

export default CreateAttendancePolicyTabWrapper;
