import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";

// Import all steps
import BasicInformation from "../components/employeeOneboarding/basicinforamtion";
import BankInformation from "../components/employeeOneboarding/bankinformation";
import WorkInformation from "../components/employeeOneboarding/workinformation";
import HierarchyInformation from "../components/employeeOneboarding/hierarchyinformation";
import PersonalInformation from "../components/employeeOneboarding/personalinformation";
import IDInformation from "../components/employeeOneboarding/idinformation";
import ContactInformation from "../components/employeeOneboarding/contact";
import WorkExperience from "../components/employeeOneboarding/workexperience";
import EducationalDetails from "../components/employeeOneboarding/educational";
import DepartmentDetails from "../components/employeeOneboarding/department";
import AdditionalInformation from "../components/employeeOneboarding/additionalinformation";

const PROGRESS_KEY = "employeeOnboardingProgress";
const CURRENT_STEP_KEY = "employeeCurrentStep";

const EmployeeOnboarding = () => {
  const steps = [
    { title: "Basic Information", desc: "This step serves as the foundation for building a user profile", component: BasicInformation },
    { title: "Bank Information", desc: "Details about user’s financials for building user profile", component: BankInformation },
    { title: "Work Information", desc: "Useful for professional & HR purposes.", component: WorkInformation },
    { title: "Hierarchy Information", desc: "Helps in structuring workflows and reporting mechanisms.", component: HierarchyInformation },
    { title: "Personal Information", desc: "Captures personal details and expertise for onboarding.", component: PersonalInformation },
    { title: "ID Information", desc: "Collect official identification details for verification.", component: IDInformation },
    { title: "Contact Information", desc: "Collect contact details and addresses.", component: ContactInformation },
    { title: "Work Experience", desc: "Add professional experience details.", component: WorkExperience },
    { title: "Educational Details", desc: "Add educational qualifications and certifications.", component: EducationalDetails },
    { title: "Department Details", desc: "Add department-specific and dependent details.", component: DepartmentDetails },
    { title: "Additional Information", desc: "Add blood group and emergency contact details.", component: AdditionalInformation },
  ];

  // ✅ Initialize directly from localStorage (prevents flash reset)
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? JSON.parse(saved) : 0;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(CURRENT_STEP_KEY);
    return saved ? JSON.parse(saved) : 0;
  });

  // ✅ Always persist when changed
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(completedSteps));
    localStorage.setItem(CURRENT_STEP_KEY, JSON.stringify(currentStep));
  }, [completedSteps, currentStep]);

  // ✅ Listen for updates from other tabs (optional)
  useEffect(() => {
    const syncProgress = () => {
      const savedProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "0");
      const savedStep = JSON.parse(localStorage.getItem(CURRENT_STEP_KEY) || "0");
      setCompletedSteps(savedProgress);
      setCurrentStep(savedStep);
    };
    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  // ✅ Step complete logic
  const handleStepComplete = () => {
    setCompletedSteps((prev) => {
      const updated = Math.min(prev + 1, steps.length);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });

    setCurrentStep((prev) => {
      const updated = Math.min(prev + 1, steps.length - 1);
      localStorage.setItem(CURRENT_STEP_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Manual navigation
  const goNextStep = () => {
    setCurrentStep((prev) => {
      const updated = Math.min(prev + 1, steps.length - 1);
      localStorage.setItem(CURRENT_STEP_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const goPrevStep = () => {
    setCurrentStep((prev) => {
      const updated = Math.max(prev - 1, 0);
      localStorage.setItem(CURRENT_STEP_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const StepComponent = steps[currentStep].component;
  const progressPercent = ((completedSteps / steps.length) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f9fafb] text-[#111827]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h1 className="text-sm font-medium">Employee Onboarding</h1>
          <div className="flex items-center gap-4">
            <button className="border rounded-full px-3 py-1 text-sm hover:bg-gray-100">
              Settings
            </button>
            <img src="https://i.pravatar.cc/40?img=3" alt="profile" className="w-8 h-8 rounded-full" />
          </div>
        </div>

        {/* Main Section */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-[220px] bg-white p-3 ml-2 mt-2 flex flex-col rounded-lg relative">
            {/* Progress Header */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#F4F6F8] text-black">
              <div className="flex items-center gap-1 text-xs font-medium">
                <span>{progressPercent}%</span>
                <span>Progress</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem(PROGRESS_KEY);
                  localStorage.removeItem(CURRENT_STEP_KEY);
                  setCompletedSteps(0);
                  setCurrentStep(0);
                }}
                className="text-xs border-b-2 border-black"
              >
                Reset
              </button>
            </div>

            {/* Steps List */}
            <div className="flex flex-col mt-4 relative">
              {/* Background line */}
              <div className="absolute left-2.5 top-2.5 w-[2px] h-full bg-gray-200"></div>

              {/* Green progress line */}
              <div
                className="absolute left-2.5 top-2.5 w-[2px] bg-green-500 transition-all duration-500"
                style={{
                  height: `${(completedSteps / steps.length) * 100}%`,
                }}
              ></div>

              {steps.map((step, idx) => {
                const isCompleted = idx < completedSteps;
                const isActive = idx === currentStep;

                return (
                  <div key={idx} className="relative pl-6 mb-6">
                    <div
                      className={`absolute left-[3px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : isActive
                          ? "border-black bg-white"
                          : "border-gray-300 bg-gray-100"
                        }`}
                    >
                      {isCompleted ? (
                        <span className="text-[10px] font-bold">✓</span>
                      ) : isActive ? (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      ) : null}
                    </div>

                    <div
                      className={
                        isCompleted
                          ? "text-green-600"
                          : isActive
                          ? "text-black"
                          : "text-gray-400"
                      }
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: "15px",
                      }}
                    >
                      {step.title}
                    </div>

                    <p
                      className={
                        isCompleted
                          ? "text-green-500"
                          : isActive
                          ? "text-gray-500"
                          : "text-gray-300"
                      }
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: "10px",
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <StepComponent
            goNextStep={goNextStep}
            goPrevStep={goPrevStep}
            onStepComplete={handleStepComplete}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeOnboarding;
