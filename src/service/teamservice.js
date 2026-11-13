import axiosInstance from "./axiosinstance";
import {
  getAdminProjectsOverview,
  getAdminProjectsTaskStatus,
  getManagerProjectStatuses,
} from "../api/api";

/* ---------- mappers (API shape -> UI shape) ---------- */

const toAllocation = (a = {}) => ({
  allocation_id: a.allocation_id,
  employee_id: String(a.employee_id ?? ""),
  employee_name: a.employee_name ?? "",
  designation: a.designation ?? "",
  department: a.department ?? "",
  allocated_at: a.allocated_at ?? null,
});

// The API sends no task status yet. If it ever does, it is used as is;
// otherwise: someone allocated -> in_progress, nobody -> pending.
const toTask = (t = {}) => {
  const allocations = (t.allocations ?? []).map(toAllocation);
  return {
    task_id: t.task_id,
    task: t.task ?? "",
    status: t.status || (allocations.length ? "in_progress" : "pending"),
    created_at: t.created_at ?? null,
    updated_at: t.updated_at ?? null,
    allocations,
  };
};

// team: [{ employee_id, name, image, department, designation, roles, is_me }]
const toTeamMember = (m = {}) => ({
  employee_id: String(m.employee_id ?? ""),
  name: m.name ?? "",
  image: m.image ?? "",
  department: m.department ?? "",
  designation: m.designation ?? "",
  roles: Array.isArray(m.roles) ? m.roles : [],
  is_me: Boolean(m.is_me),
});

const toProject = (p = {}) => ({
  project_id: p.project_id,
  project: p.project ?? "",
  company_id: p.company_id,
  status: p.status ?? "",
  created_by: String(p.created_by ?? ""),
  created_by_name: p.created_by_name ?? "",
  designation: p.designation ?? "",
  department: p.department ?? "",
  created_at: p.created_at ?? null,
  updated_at: p.updated_at ?? null,
  tasks: (p.tasks ?? []).map(toTask),
  team: (p.team ?? []).map(toTeamMember),
});

/* ---------- task-status mappers (GET /admin/projects/task-status) ---------- */

// assignee: one person's work on one task. Fields besides id/name are
// optional in the API (a task can be allocated but not started yet).
const toAssignee = (a = {}) => ({
  employee_id: String(a.employee_id ?? ""),
  name: a.name ?? "",
  status_id: a.status_id ?? null,
  status: a.status ?? "",
  status_color: a.status_color ?? "",
  is_working: Boolean(a.is_working),
  start_time: a.start_time ?? null,
  work_date: a.work_date ?? null,
  time_taken_minutes: Number(a.time_taken_minutes ?? 0),
  days_worked: Number(a.days_worked ?? 0),
  remarks: a.remarks ?? "",
});

const toStatusTask = (t = {}) => ({
  task_id: t.task_id,
  task: t.task ?? "",
  assignees: (t.assignees ?? []).map(toAssignee),
});

const toStatusProject = (p = {}) => ({
  project_id: p.project_id,
  project: p.project ?? "",
  status: p.status ?? "",
  working_now: Number(p.working_now ?? 0),
  tasks: (p.tasks ?? []).map(toStatusTask),
});

const toTaskStatusSummary = (s = {}) => ({
  total_projects: Number(s.total_projects ?? 0),
  completed_projects: Number(s.completed_projects ?? 0),
  completion_rate: Number(s.completion_rate ?? 0),
  completion_label: s.completion_label ?? "",
  total_tasks: Number(s.total_tasks ?? 0),
  allocated_employees: Number(s.allocated_employees ?? 0),
});

// Only send params that have a value (all query params are optional)
const cleanParams = (params = {}) => {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      if (v.length) out[k] = v.join(","); // statuses: "active,on_hold"
      return;
    }
    out[k] = v;
  });
  return out;
};

const teamService = {
  // GET /manager/projects/statuses
  // -> { default: "active", statuses: [{ value, label }] }
  fetchProjectStatuses: async () => {
    try {
      const response = await axiosInstance.get(getManagerProjectStatuses);
      const d = response.data?.data ?? {};
      return {
        default: d.default ?? "",
        statuses: (d.statuses ?? []).map((s) => ({
          value: s.value,
          label: s.label ?? s.value,
        })),
      };
    } catch (error) {
      console.error(
        "Error fetching project statuses:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET /admin/projects/overview   (API 9, same params/response as API 5)
  // params (all optional):
  //   project, task            string   filter by project / task name
  //   statuses                 string | string[]  active,on_hold,completed,cancelled
  //   employee_id              string   projects involving this employee
  //   department_id            integer  projects involving this department
  //   created_by               string   filter by creator
  //   page (from 1), limit     integer
  fetchProjectsOverview: async (params = {}) => {
    try {
      const query = cleanParams(params);
      if (query.department_id !== undefined) {
        query.department_id = Number(query.department_id); // API expects integer
      }

      const response = await axiosInstance.get(getAdminProjectsOverview, {
        params: query,
      });

      const d = response.data?.data ?? {};
      return {
        total: Number(d.total ?? 0),
        page: Number(d.page ?? 1),
        limit: Number(d.limit ?? 50),
        projects: (d.projects ?? []).map(toProject),
      };
    } catch (error) {
      console.error(
        "Error fetching projects overview:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET /admin/projects/task-status
  // params (all optional):
  //   project_status           string | string[]  active,on_hold,...
  //   status                   string | string[]  task status, e.g. "In Progress,Blocked"
  //   employees                string | string[]  employee ids (uuid1,uuid2)
  //   period                   daily | weekly | monthly
  //   date                     YYYY-MM-DD         (period=daily)
  //   month, year              integer            (period=weekly | monthly)
  //   week                     integer            (period=weekly)
  fetchProjectsTaskStatus: async (params = {}) => {
    try {
      const query = cleanParams(params);

      const response = await axiosInstance.get(getAdminProjectsTaskStatus, {
        params: query,
      });

      const d = response.data?.data ?? {};
      return {
        summary: toTaskStatusSummary(d.summary),
        projects: (d.projects ?? []).map(toStatusProject),
      };
    } catch (error) {
      console.error(
        "Error fetching projects task status:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

teamService.toProject = toProject;
teamService.toTask = toTask;

export { toProject, toTask, toAllocation, toTeamMember };
export default teamService;
