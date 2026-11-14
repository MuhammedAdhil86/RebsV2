import axiosInstance from "./axiosinstance";
import {
  updateExitInitialStep,
  updateExitChecklist,
  getExitProcessList,
  getExitProcessById,
} from "../api/api"; // or "../api/exitApi" if you keep the endpoints in their own file

/* ---------- helpers ---------- */

// The backend example uses the IST offset for plain dates
// ("2026-12-01T00:00:00+05:30"). A date-only value from <input type="date">
// is sent that way; anything that already has a time part is sent unchanged.
const IST_OFFSET = "+05:30";

const toApiDateTime = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  const v = String(value);
  return v.includes("T") ? v : `${v}T00:00:00${IST_OFFSET}`;
};

const pct = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

// Revoked or completed processes cannot be changed (the API answers 409)
const isLockedStatus = (status) =>
  ["revoked", "completed"].includes(String(status ?? "").toLowerCase());

/* ---------- mappers (API shape -> UI shape) ---------- */

// GET list-all item
const toExitProcess = (e = {}) => ({
  id: String(e.id ?? ""),
  employeeId: String(e.employee_id ?? ""),
  employeeName: e.employee_name ?? "",
  department: e.department ?? "",
  employmentType: e.employment_type ?? "",
  reasonForLeaving: e.reason_for_leaving ?? "",
  appliedOn: e.applied_on ?? null,
  noticePeriodStart: e.notice_period_start ?? null,
  status: e.status ?? "",
  isLocked: isLockedStatus(e.status),
  completion: pct(e.completion_percentage),
});

// GET get/{id}: full detail with the three steps
const toExitProcessDetail = (e = {}) => ({
  ...toExitProcess(e),

  interviewerId: String(e.interviewer_id ?? ""),
  interviewerName: e.interviewer_name ?? "",
  separationDate: e.separation_date ?? null,
  attachment: e.attachment ?? "",

  // step 1: initial step
  initial: {
    status: e.initial_status ?? "",
    completion: pct(e.initial_completion_percentage),
  },

  // step 2: questionnaire
  questionnaire: {
    status: e.questionaire_status ?? "", // (sic) spelled this way by the API
    completion: pct(e.questionaire_completion_percentage),
    workAgain: Boolean(e.question_working_again),
    improvementSuggestion: e.improvement_suggestion ?? "",
    mostLiked: e.most_liked ?? "",
    additionalFeedback: e.additional_feedback ?? "",
  },

  // step 3: clearance checklist
  checklist: {
    status: e.checklist_status ?? "",
    completion: pct(e.checklist_completion_percentage),
    assetHanded: Boolean(e.asset_handed),
    digitalAssetHanded: Boolean(e.digital_asset_handed),
    resignationLetter: Boolean(e.resignation_letter),
    security: Boolean(e.security),
    noticePeriodFollowed: Boolean(e.notice_period_followed),
    managerClearance: Boolean(e.manager_clearance),
  },
});

const exitService = {
  // GET /admin/exit-process/list-all
  fetchExitProcesses: async () => {
    try {
      const response = await axiosInstance.get(getExitProcessList);
      const list = response.data?.data ?? [];
      return Array.isArray(list) ? list.map(toExitProcess) : [];
    } catch (error) {
      console.error(
        "Error fetching exit processes:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET /admin/exit-process/get/{id}
  fetchExitProcess: async (id) => {
    try {
      const response = await axiosInstance.get(getExitProcessById(id));
      return toExitProcessDetail(response.data?.data ?? {});
    } catch (error) {
      console.error(
        `Error fetching exit process #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // PUT /admin/exit-process/update/initial-step
  // body: { id, interviewer_id, separation_date, notice_period_start }
  // Completing this step marks the initial step as 100% complete.
  updateInitialStep: async ({
    id,
    interviewerId,
    separationDate,
    noticePeriodStart,
  }) => {
    try {
      const response = await axiosInstance.put(
        updateExitInitialStep,
        {
          id: String(id),
          interviewer_id: String(interviewerId),
          separation_date: toApiDateTime(separationDate),
          notice_period_start: toApiDateTime(noticePeriodStart),
        },
        { silent: true },
      );
      return { message: response.data?.message ?? "" }; // data is null
    } catch (error) {
      console.error(
        `Error updating initial step of exit process #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // PUT /admin/exit-process/update/checklist
  // body: { id, asset_handed, digital_asset_handed, resignation_letter,
  //         security, notice_period_followed, manager_clearance }
  // 409 = the process is revoked or completed and cannot be updated.
  updateChecklist: async ({
    id,
    assetHanded,
    digitalAssetHanded,
    resignationLetter,
    security,
    noticePeriodFollowed,
    managerClearance,
  }) => {
    try {
      const response = await axiosInstance.put(
        updateExitChecklist,
        {
          id: String(id),
          asset_handed: Boolean(assetHanded),
          digital_asset_handed: Boolean(digitalAssetHanded),
          resignation_letter: Boolean(resignationLetter),
          security: Boolean(security),
          notice_period_followed: Boolean(noticePeriodFollowed),
          manager_clearance: Boolean(managerClearance),
        },
        { silent: true },
      );
      return { message: response.data?.message ?? "" };
    } catch (error) {
      console.error(
        `Error updating checklist of exit process #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

// true when the API rejected an update because the process is revoked/completed
exitService.isConflict = (error) => error?.response?.status === 409;

exitService.toExitProcess = toExitProcess;
exitService.toExitProcessDetail = toExitProcessDetail;

export { toExitProcess, toExitProcessDetail };
export default exitService;
