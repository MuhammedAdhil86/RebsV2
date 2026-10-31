import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";

// Usage:
// <InfoTooltip sections={CALCULATE_CTC_INFO} />
// or a plain string: <InfoTooltip text="Some short help" />
export const CALCULATE_CTC_INFO = [
  {
    title: "What is Calculate CTC?",
    body: "Calculate CTC helps you determine how an employee's annual salary is distributed across the different salary components configured in your company.",
  },
  {
    title: "Why is it needed?",
    body: "It ensures that the salary structure is aligned with the employee's specified Annual CTC. The system uses the configured salary template, component rules, and applicable employer contributions to calculate the individual component amounts.",
  },
  {
    title: "How does it work?",
    body: "Enter the employee's Annual CTC and select the appropriate salary template. The system calculates the corresponding salary components based on the template configuration and displays the resulting breakdown for review.",
  },
  {
    body: "This helps establish a consistent and accurate salary structure for the employee from the beginning.",
  },
];

// Draft text for the Create Salary Template screen: replace with your exact wording
export const SALARY_TEMPLATE_INFO = [
  {
    title: "What is a Salary Template?",
    body: "A salary template is a reusable salary structure. It lists the salary components in a package and how each one is calculated.",
  },
  {
    title: "How does it work?",
    body: "Choose the components, then set each one's calculation type and value, such as a percentage of CTC, a percentage of basic, or a flat amount. Mark one component as the balancing component to take up the remaining amount.",
  },
  {
    body: "Once saved, the template can be selected when adding an employee to calculate their salary breakdown from the Annual CTC.",
  },
];

const InfoTooltip = ({ text, sections = [] }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  // Close when tapping/clicking outside (needed on touch devices, where there is no hover)
  useEffect(() => {
    if (!show) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [show]);

  return (
    <span
      ref={ref}
      className="relative inline-block ml-1 align-middle"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Info icon: opens on hover, keyboard focus, or tap */}
      <button
        type="button"
        onClick={() => setShow(true)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
        aria-expanded={show}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <Info size={14} />
      </button>

      {/* Tooltip */}
      {show && (
        <div
          role="tooltip"
          className="absolute z-10 w-80 p-3 -top-1 left-5 bg-black text-white text-[12px] font-normal normal-case tracking-normal text-left rounded-md shadow-lg"
        >
          {/* small triangle pointing at the icon */}
          <div className="absolute top-2 -left-1 w-2 h-2 rotate-45 bg-black" />

          {text && <p>{text}</p>}

          {sections.map((sec, i) => (
            <div key={i} className={i > 0 ? "mt-3" : ""}>
              {sec.title && <p className="text-gray-300 mb-1">{sec.title}</p>}
              <p>{sec.body}</p>
            </div>
          ))}
        </div>
      )}
    </span>
  );
};

export default InfoTooltip;
