import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";

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

const steps = [
  {
    title: "Basic Information",
    desc: "This step serves as the foundation for building a user profile",
    component: BasicInformation,
  },
  {
    title: "Bank Information",
    desc: "Details about user’s financials for building user profile",
    component: BankInformation,
  },
  {
    title: "Work Information",
    desc: "Useful for professional & HR purposes.",
    component: WorkInformation,
  },
  {
    title: "Hierarchy Information",
    desc: "Helps in structuring workflows and reporting mechanisms.",
    component: HierarchyInformation,
  },
  {
    title: "Personal Information",
    desc: "Captures personal details and expertise for onboarding.",
    component: PersonalInformation,
  },
  {
    title: "ID Information",
    desc: "Collect official identification details for verification.",
    component: IDInformation,
  },
  {
    title: "Contact Information",
    desc: "Collect contact details and addresses.",
    component: ContactInformation,
  },
  {
    title: "Work Experience",
    desc: "Add professional experience details.",
    component: WorkExperience,
  },
  {
    title: "Educational Details",
    desc: "Add educational qualifications and certifications.",
    component: EducationalDetails,
  },
  {
    title: "Department Details",
    desc: "Add department-specific and dependent details.",
    component: DepartmentDetails,
  },
  {
    title: "Additional Information",
    desc: "Add blood group and emergency contact details.",
    component: AdditionalInformation,
  },
];

const LAST_STEP = steps.length - 1;

/* ---------- SAFE STORAGE HELPERS ---------- */
// Reads a number from localStorage and clamps it into [min, max] so a bad or
// stale saved value can never make `steps[currentStep]` undefined (blank page).
const readSavedNumber = (key, min, max) => {
  try {
    const value = Number(JSON.parse(localStorage.getItem(key) || "0"));
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(Math.trunc(value), min), max);
  } catch {
    return min;
  }
};

const EmployeeOnboarding = () => {
  // ✅ Initialize directly from localStorage (prevents flash reset)
  const [completedSteps, setCompletedSteps] = useState(() =>
    readSavedNumber(PROGRESS_KEY, 0, steps.length),
  );

  const [currentStep, setCurrentStep] = useState(() =>
    readSavedNumber(CURRENT_STEP_KEY, 0, LAST_STEP),
  );

  // ✅ Always persist when changed (single place; no side effects inside setters)
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(completedSteps));
    localStorage.setItem(CURRENT_STEP_KEY, JSON.stringify(currentStep));
  }, [completedSteps, currentStep]);

  // ✅ Listen for updates from other tabs (optional)
  useEffect(() => {
    const syncProgress = () => {
      setCompletedSteps(readSavedNumber(PROGRESS_KEY, 0, steps.length));
      setCurrentStep(readSavedNumber(CURRENT_STEP_KEY, 0, LAST_STEP));
    };
    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  // ✅ Step complete logic
  // Idempotent: calling it twice for the same step (e.g. a step that saves
  // several entries, or calls onStepComplete AND goNextStep) can no longer skip
  // ahead or inflate the progress. Progress = "this step is done", not "+1".
  const handleStepComplete = () => {
    const next = Math.min(currentStep + 1, LAST_STEP);
    setCompletedSteps((prev) =>
      Math.min(Math.max(prev, currentStep + 1), steps.length),
    );
    setCurrentStep(next);
  };

  // ✅ Manual navigation (uses the rendered step, so duplicate calls land on the
  // same step instead of jumping two)
  const goNextStep = () => {
    setCurrentStep(Math.min(currentStep + 1, LAST_STEP));
  };

  const goPrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleReset = () => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    setCompletedSteps(0);
    setCurrentStep(0);
  };

  const StepComponent = steps[currentStep].component;
  const progressPercent = ((completedSteps / steps.length) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f9fafb] text-[#111827] px-4 gap-6 overflow-y-auto">
        {/* Global Shared Header Integration */}
        <HeaderGlobal userName="Admin" />

        {/* Section Context Label */}
        <div className="border-b border-gray-200 pb-2 -mt-2">
          <h1 className="text-xl font-medium text-gray-800">
            Employee Onboarding
          </h1>
        </div>

        {/* Main Section */}
        <div className="flex flex-1 gap-4 items-start">
          {/* Sidebar */}
          <div className="w-[220px] bg-white p-3 flex flex-col rounded-lg relative border border-gray-100 shadow-sm flex-shrink-0">
            {/* Progress Header */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#F4F6F8] text-black">
              <div className="flex items-center gap-1 text-xs font-medium">
                <span>{progressPercent}%</span>
                <span>Progress</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs border-b-2 border-black"
              >
                Reset
              </button>
            </div>

            {/* Steps List */}
            <div className="flex flex-col mt-4 relative">
              {/* Background line */}
              <div className="absolute left-2.5 top-2.5 w-[2px] h-[calc(100%-24px)] bg-gray-200"></div>

              {/* Green progress line */}
              <div
                className="absolute left-2.5 top-2.5 w-[2px] bg-green-500 transition-all duration-500"
                style={{
                  height: `${Math.min((completedSteps / LAST_STEP) * 100, 100)}%`,
                  maxHeight: "calc(100% - 24px)",
                }}
              ></div>

              {steps.map((step, idx) => {
                const isCompleted = idx < completedSteps;
                const isActive = idx === currentStep;

                return (
                  <div key={idx} className="relative pl-6 mb-6 last:mb-0">
                    <div
                      className={`absolute left-[3px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10
                        ${
                          isCompleted
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
          <div className="flex-1 bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            {/* key forces a clean remount per step so no state leaks between steps */}
            <StepComponent
              key={currentStep}
              goNextStep={goNextStep}
              goPrevStep={goPrevStep}
              onStepComplete={handleStepComplete}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeOnboarding;
