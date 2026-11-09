import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
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

const MARGIN = 16; // minimum gap from the viewport edges
const GAP = 8; // gap between the icon and the tooltip
const MAX_WIDTH = 500;
const MAX_HEIGHT = 420; // tooltip scrolls beyond this height

const InfoTooltip = ({ text, sections = [] }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
    width: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
  });

  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const tipRef = useRef(null);
  const closeTimer = useRef(null);

  const open = useCallback(() => {
    clearTimeout(closeTimer.current);
    setShow(true);
  }, []);

  // Small delay so the pointer can travel from the icon to the tooltip (rendered in a portal).
  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setShow(false), 150);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Work out where the tooltip fits inside the viewport.
  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(MAX_WIDTH, vw - MARGIN * 2);
    const maxHeight = Math.min(MAX_HEIGHT, vh - MARGIN * 2);

    // Prefer the right of the icon, then the left, then fall back to clamping.
    let left = rect.right + GAP;
    if (left + width > vw - MARGIN) {
      const leftSide = rect.left - width - GAP;
      left =
        leftSide >= MARGIN ? leftSide : Math.max(MARGIN, vw - width - MARGIN);
    }

    // Start level with the icon, then slide up if it would run past the bottom.
    const actualHeight = Math.min(
      tipRef.current?.offsetHeight || maxHeight,
      maxHeight,
    );
    let top = rect.top - 4;
    if (top + actualHeight > vh - MARGIN) top = vh - MARGIN - actualHeight;
    top = Math.max(MARGIN, top);

    setPos({ top, left, width, maxHeight });
  }, []);

  // Measure after render and before paint to avoid a visible jump.
  useLayoutEffect(() => {
    if (show) reposition();
  }, [show, reposition, sections, text]);

  useEffect(() => {
    if (!show) return;

    const onScrollOrResize = (e) => {
      // Scrolling inside the tooltip itself must not trigger a reposition.
      if (e?.target && tipRef.current && tipRef.current.contains(e.target))
        return;
      reposition();
    };
    const onDown = (e) => {
      const t = e.target;
      if (wrapRef.current?.contains(t) || tipRef.current?.contains(t)) return;
      setShow(false);
    };
    const onKey = (e) => e.key === "Escape" && setShow(false);

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [show, reposition]);

  // Close on blur only when focus leaves both the icon and the tooltip.
  const handleBlur = (e) => {
    const next = e.relatedTarget;
    if (
      next &&
      (btnRef.current?.contains(next) || tipRef.current?.contains(next))
    )
      return;
    setShow(false);
  };

  return (
    <span
      ref={wrapRef}
      className="relative inline-block ml-1 align-middle"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      {/* Info icon: opens on hover, keyboard focus, or tap */}
      <button
        ref={btnRef}
        type="button"
        onClick={open}
        onFocus={open}
        onBlur={handleBlur}
        aria-label="More information"
        aria-expanded={show}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <Info size={14} />
      </button>

      {/* Tooltip: portalled to <body> so no parent can clip it; fixed to the viewport */}
      {show &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            tabIndex={0}
            onMouseEnter={open}
            onMouseLeave={scheduleClose}
            onBlur={handleBlur}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              overscrollBehavior: "contain",
            }}
            className="z-[1000] overflow-y-auto p-3 bg-black text-white text-[12px] font-normal normal-case tracking-normal text-left rounded-md shadow-lg focus:outline-none"
          >
            {text && <p className="whitespace-pre-line">{text}</p>}

            {sections.map((sec, i) => (
              <div key={i} className={i > 0 ? "mt-3" : ""}>
                {sec.title && (
                  <p className="text-gray-300 font-medium mb-1">{sec.title}</p>
                )}
                <p className="whitespace-pre-line">{sec.body}</p>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
};

export default InfoTooltip;
