import React from "react";
import { Icon } from "@iconify/react";

const WorkExperienceSection = ({ employee }) => {
  const workData = employee?.work_experience || [];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Work Experience</h3>
        <Icon
          icon="basil:edit-outline"
          className="w-5 h-5 text-gray-400 cursor-pointer"
        />
      </div>

      <div className="space-y-6">
        {workData.length === 0 ? (
          <div className="text-gray-500 text-sm">No work experience available</div>
        ) : (
          workData.map((exp, index) => (
            <div key={index} className="bg-white rounded-lg">
              {workData.length > 1 && (
                <div className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  Experience {index + 1}
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">Company Name</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.company_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">Job Title</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.job_title}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">From Date</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.from_date}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">To Date</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.to_date}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">Is Relevant</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.is_relavant}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[13px] font-medium text-gray-700">Job Description</span>
                <span className="text-[13px] text-gray-900 font-medium">{exp.job_description}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkExperienceSection;
