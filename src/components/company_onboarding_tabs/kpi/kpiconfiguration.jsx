import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import UniversalTable from "../../../ui/universal_table";
import DeleteConfirmationModal from "../../../ui/deletemodal";

import {
  fetchKpiCriteria,
  createKpiCriteria,
  updateKpiCriteria,
  removeKpiCriteria,
  fetchKpiSettings,
  saveKpiSettings,
} from "../../../service/kpiService";
import { getDepartmentData } from "../../../service/staffservice";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const VIEW = {
  LIST: "list",
  CONFIGURE: "configure",
  SETTINGS: "settings",
};

const ALL_DEPARTMENTS_OPTION = { label: "All Departments", value: "" };

const TABLE_ROWS_PER_PAGE = 10;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** "2026-10-23T06:19:30.874218Z" -> "23-10-2026" */
const formatDisplayDate = (isoString) => {
  if (!isoString) return "-";
  const [year, month, day] = isoString.split("T")[0].split("-");
  return `${day}-${month}-${year}`;
};

const extractErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong";

/* -------------------------------------------------------------------------- */
/*                              Reusable Fields                               */
/* -------------------------------------------------------------------------- */

/** Select whose width follows the length of the selected option's label. */
function FitSelect({ label, value, options, onChange, minWidth = 110 }) {
  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );
  const selectedText = (selectedOption?.label ?? "").toString();

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs whitespace-nowrap">{label}:</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="appearance-none border px-3 py-2 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
          style={{
            width: `calc(${selectedText.length}ch + 44px)`,
            minWidth: `${minWidth}px`,
            borderRadius: "6px",
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg
            className="w-3 h-3 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Date input with a custom calendar icon; the whole field opens the picker. */
function DateField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-500">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="relative w-full border border-gray-300 rounded px-3 py-2 pr-9 text-[12px] outline-none focus:border-black bg-white
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:inset-0
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
        <Icon
          icon="solar:calendar-outline"
          className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
    </div>
  );
}

/** Back button + title shown at the top of the Configure and Settings views. */
function SubViewHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-xs"
      >
        <Icon icon="solar:arrow-left-outline" className="w-4 h-4" />
        Back
      </button>
      <h3 className="text-base font-medium text-gray-800">{title}</h3>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Main Page                                  */
/* -------------------------------------------------------------------------- */

export default function KpiConfiguration() {
  /* ------------------------------- Navigation ------------------------------ */
  const [activeView, setActiveView] = useState(VIEW.LIST);

  /* -------------------------------- Departments ---------------------------- */
  const [departmentOptions, setDepartmentOptions] = useState([
    ALL_DEPARTMENTS_OPTION,
  ]);

  /* ------------------------------ Criteria list ---------------------------- */
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [criteriaList, setCriteriaList] = useState([]);
  const [isCriteriaLoading, setIsCriteriaLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /* ----------------------------- Configure form ---------------------------- */
  const [criteriaName, setCriteriaName] = useState("");
  const [criteriaDepartmentId, setCriteriaDepartmentId] = useState("");
  const [isCriteriaSaving, setIsCriteriaSaving] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState(null);

  /* ------------------------------ Row actions ------------------------------ */
  const [actionMenu, setActionMenu] = useState(null); // { id, top, right }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ------------------------------ Settings form ---------------------------- */
  const [trackingStart, setTrackingStart] = useState("");
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  const reloadCriteria = () => setReloadKey((key) => key + 1);

  /* ------------------------------ View handlers ---------------------------- */
  const openConfigureView = () => {
    setEditingCriteriaId(null);
    setCriteriaName("");
    setCriteriaDepartmentId(selectedDepartmentId);
    setActiveView(VIEW.CONFIGURE);
  };

  /** Department dropdown value for an existing criteria ("" = all departments). */
  const resolveDepartmentValue = (criteria) => {
    const id = criteria.original?.department_id;
    if (id !== null && id !== undefined && id !== "") return String(id);

    const match = departmentOptions.find(
      (option) =>
        option.value !== "" && option.label === criteria.department_name,
    );
    return match ? match.value : "";
  };

  const openEditView = (criteria) => {
    setEditingCriteriaId(criteria.id);
    setCriteriaName(criteria.name);
    setCriteriaDepartmentId(resolveDepartmentValue(criteria));
    setActiveView(VIEW.CONFIGURE);
  };

  /* ------------------------------ Row action menu -------------------------- */
  const toggleActionMenu = (event, criteriaId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenu((current) =>
      current?.id === criteriaId
        ? null
        : {
            id: criteriaId,
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
          },
    );
  };

  const menuCriteria = actionMenu
    ? criteriaList.find((criteria) => criteria.id === actionMenu.id)
    : null;

  const handleMenuUpdate = () => {
    if (!menuCriteria || menuCriteria.is_default) return;
    setActionMenu(null);
    openEditView(menuCriteria);
  };

  const handleMenuDelete = () => {
    if (!menuCriteria || menuCriteria.is_default) return;
    setActionMenu(null);
    setDeleteTarget(menuCriteria);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    try {
      setIsDeleting(true);
      await removeKpiCriteria(deleteTarget.id);
      toast.success("Criteria deleted successfully.");
      setDeleteTarget(null);
      reloadCriteria();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  /* Close the action menu on outside click, scroll or resize. */
  useEffect(() => {
    if (!actionMenu) return;

    const closeMenu = () => setActionMenu(null);
    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [actionMenu]);

  const openSettingsView = () => setActiveView(VIEW.SETTINGS);

  const returnToList = () => setActiveView(VIEW.LIST);

  /* ---------------------------- Load departments --------------------------- */
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const departments = await getDepartmentData();
        setDepartmentOptions([
          ALL_DEPARTMENTS_OPTION,
          ...departments.map((department) => ({
            label: department.name,
            value: String(department.id),
          })),
        ]);
      } catch (error) {
        console.error("Failed to load departments:", error);
        toast.error(extractErrorMessage(error));
      }
    };

    loadDepartments();
  }, []);

  /* ------------------- Load criteria (list view only) ---------------------- */
  useEffect(() => {
    if (activeView !== VIEW.LIST) return;

    let isOutdated = false;

    const loadCriteria = async () => {
      try {
        setIsCriteriaLoading(true);
        const data = await fetchKpiCriteria(selectedDepartmentId);
        if (!isOutdated) setCriteriaList(data);
      } catch (error) {
        console.error("KPI criteria fetch failed:", error);
        if (!isOutdated) {
          setCriteriaList([]);
          toast.error(extractErrorMessage(error));
        }
      } finally {
        if (!isOutdated) setIsCriteriaLoading(false);
      }
    };

    loadCriteria();

    return () => {
      isOutdated = true;
    };
  }, [selectedDepartmentId, reloadKey, activeView]);

  /* ------------------ Load settings (settings view only) ------------------- */
  useEffect(() => {
    if (activeView !== VIEW.SETTINGS) return;

    let isOutdated = false;

    const loadSettings = async () => {
      try {
        setIsSettingsLoading(true);
        const settings = await fetchKpiSettings();
        if (isOutdated) return;
        setTrackingStart(settings.tracking_start);
        setSettingsUpdatedAt(settings.updated_at);
      } catch (error) {
        console.error("KPI settings fetch failed:", error);
        if (!isOutdated) toast.error(extractErrorMessage(error));
      } finally {
        if (!isOutdated) setIsSettingsLoading(false);
      }
    };

    loadSettings();

    return () => {
      isOutdated = true;
    };
  }, [activeView]);

  /* ------------------------------ Save criteria ---------------------------- */
  const handleSaveCriteria = async () => {
    if (!criteriaName.trim()) {
      toast.error("Criteria name is required.");
      return;
    }

    try {
      setIsCriteriaSaving(true);

      if (editingCriteriaId) {
        await updateKpiCriteria({
          id: editingCriteriaId,
          name: criteriaName,
          department_id: criteriaDepartmentId,
        });
        toast.success("Criteria updated successfully.");
      } else {
        await createKpiCriteria({
          name: criteriaName,
          department_id: criteriaDepartmentId,
        });
        toast.success("Criteria saved successfully.");
      }

      setCriteriaName("");
      setEditingCriteriaId(null);
      reloadCriteria();
      returnToList();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsCriteriaSaving(false);
    }
  };

  /* ------------------------------ Save settings ---------------------------- */
  const handleSaveSettings = async () => {
    if (!trackingStart) {
      toast.error("Tracking start date is required.");
      return;
    }

    try {
      setIsSettingsSaving(true);

      const savedSettings = await saveKpiSettings({
        tracking_start: trackingStart,
      });

      setSettingsUpdatedAt(savedSettings?.updated_at || null);
      toast.success("KPI settings saved successfully.");
      returnToList();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSettingsSaving(false);
    }
  };

  /* -------------------------------- Table data ----------------------------- */
  const normalizedSearch = searchTerm.toLowerCase();

  const tableRows = criteriaList
    .filter(
      (criteria) =>
        criteria.name.toLowerCase().includes(normalizedSearch) ||
        criteria.department_name.toLowerCase().includes(normalizedSearch),
    )
    .map((criteria, index) => ({
      ...criteria,
      sl_no: index + 1,
      created_display: formatDisplayDate(criteria.created_at),
      updated_display: formatDisplayDate(criteria.updated_at),
    }));

  const tableColumns = [
    { label: "Sl No", key: "sl_no", align: "center", width: 80 },
    { label: "Criteria Name", key: "name", align: "center", width: 220 },
    {
      label: "Department",
      key: "department_name",
      align: "center",
      width: 160,
    },
    {
      label: "Type",
      key: "is_default",
      align: "center",
      width: 120,
      render: (isDefault) => (
        <span
          className={`px-3 py-1 rounded-full text-[12px] ${
            isDefault
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isDefault ? "Default" : "Custom"}
        </span>
      ),
    },
    {
      label: "Created On",
      key: "created_display",
      align: "center",
      width: 130,
    },
    {
      label: "Updated On",
      key: "updated_display",
      align: "center",
      width: 130,
    },
    {
      label: "Action",
      key: "id",
      align: "center",
      width: 90,
      render: (id) => (
        <button
          type="button"
          aria-label="Row actions"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => toggleActionMenu(event, id)}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
        >
          <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
        </button>
      ),
    },
  ];

  /* -------------------------------------------------------------------------- */
  /*                               Configure view                               */
  /* -------------------------------------------------------------------------- */
  if (activeView === VIEW.CONFIGURE) {
    return (
      <div className="p-1 rounded-xl font-poppins text-[12px]">
        <SubViewHeader
          title={
            editingCriteriaId ? "Update KPI Criteria" : "Configure KPI Criteria"
          }
          onBack={returnToList}
        />

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            {editingCriteriaId ? "Edit Criteria" : "Add Criteria"}
          </h4>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-gray-500">Criteria Name</label>
              <input
                type="text"
                placeholder="e.g. Technical Skills"
                value={criteriaName}
                onChange={(event) => setCriteriaName(event.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-black w-64"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-500">Department</label>
              <select
                value={criteriaDepartmentId}
                onChange={(event) =>
                  setCriteriaDepartmentId(event.target.value)
                }
                className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-black bg-white min-w-[180px]"
              >
                {departmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveCriteria}
              disabled={isCriteriaSaving}
              className="flex items-center gap-2 px-4 py-2 rounded border bg-black text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {isCriteriaSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCriteriaId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Settings view                               */
  /* -------------------------------------------------------------------------- */
  if (activeView === VIEW.SETTINGS) {
    return (
      <div className="p-1 rounded-xl font-poppins text-[12px]">
        <SubViewHeader title="KPI Settings" onBack={returnToList} />

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {isSettingsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 flex-wrap">
                <DateField
                  label="Tracking Start Date"
                  value={trackingStart}
                  onChange={(event) => setTrackingStart(event.target.value)}
                />

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSettingsSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded border bg-black text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSettingsSaving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Save
                </button>
              </div>

              <p className="text-gray-400 mt-3">
                Last updated:{" "}
                {settingsUpdatedAt
                  ? formatDisplayDate(settingsUpdatedAt)
                  : "Never"}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  List view                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="p-1 rounded-xl font-poppins text-[12px]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-base font-medium text-gray-800">KPI Criteria</h3>
          <FitSelect
            label="Department"
            value={selectedDepartmentId}
            onChange={setSelectedDepartmentId}
            options={departmentOptions}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openConfigureView}
            className="flex items-center gap-2 px-4 py-1.5 rounded border bg-black text-white hover:bg-gray-800 whitespace-nowrap text-xs"
          >
            <Icon icon="solar:tuning-2-outline" className="w-4 h-4" />
            Configure
          </button>

          <button
            type="button"
            onClick={openSettingsView}
            className="flex items-center gap-2 px-4 py-1.5 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 whitespace-nowrap text-xs"
          >
            <Icon icon="solar:settings-outline" className="w-4 h-4" />
            Settings
          </button>

          <div className="relative w-[220px]">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border px-3 py-1.5 rounded w-full outline-none text-xs"
            />
            <Icon
              icon="mynaui:search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {isCriteriaLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <UniversalTable
            columns={tableColumns}
            data={tableRows}
            rowsPerPage={TABLE_ROWS_PER_PAGE}
            className="rounded-lg shadow-sm"
          />
        )}
      </div>

      {/* Row action menu */}
      {actionMenu && (
        <div
          onMouseDown={(event) => event.stopPropagation()}
          style={{
            position: "fixed",
            top: actionMenu.top,
            right: actionMenu.right,
          }}
          className="z-50 w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1 text-xs"
        >
          <button
            type="button"
            onClick={handleMenuUpdate}
            disabled={menuCriteria?.is_default}
            title={
              menuCriteria?.is_default
                ? "Default criteria cannot be changed"
                : undefined
            }
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="solar:pen-outline" className="w-4 h-4" />
            Update
          </button>
          <button
            type="button"
            onClick={handleMenuDelete}
            disabled={menuCriteria?.is_default}
            title={
              menuCriteria?.is_default
                ? "Default criteria cannot be deleted"
                : undefined
            }
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="solar:trash-bin-trash-outline" className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.name}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
