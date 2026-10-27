import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchInsuranceProviders,
  fetchInsuranceTypes,
  fetchInsuranceCoverageTypes,
  submitUpsertInsuranceProvider,
  submitUpsertInsuranceType,
  submitUpsertCoverageType,
  removeInsuranceProvider,
  removeInsuranceType,
  removeCoverageType,
} from "../../service/insuranceservice";
import DeleteConfirmationModal from "../../ui/deletemodal";

// Always work with an array, whatever the API returns
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

// One config per settings section – the panel below is fully driven by it
const SECTIONS = {
  providers: {
    label: "Providers",
    title: "Insurance Providers",
    description:
      "Manage third-party insurance providers and partner companies.",
    singular: "Provider",
    nameKey: "provider_name",
    nameLabel: "Provider Name",
    hasDescription: false,
    showStatus: true,
    fetchList: fetchInsuranceProviders,
    save: submitUpsertInsuranceProvider,
    remove: removeInsuranceProvider,
  },
  types: {
    label: "Insurance Types",
    title: "Insurance Types",
    description: "Manage the insurance types available for employee policies.",
    singular: "Insurance Type",
    nameKey: "type_name",
    nameLabel: "Type Name",
    hasDescription: true,
    showStatus: false,
    fetchList: fetchInsuranceTypes,
    save: submitUpsertInsuranceType,
    remove: removeInsuranceType,
  },
  coverage: {
    label: "Coverage Types",
    title: "Coverage Types",
    description:
      "Manage the coverage options available for insurance policies.",
    singular: "Coverage Type",
    nameKey: "coverage_name",
    nameLabel: "Coverage Name",
    hasDescription: true,
    showStatus: false,
    fetchList: fetchInsuranceCoverageTypes,
    save: submitUpsertCoverageType,
    remove: removeCoverageType,
  },
};

const EMPTY_FORM = { name: "", description: "" };

function SettingsPanel({ config }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await config.fetchList();
      // Keep only rows that actually have data to show
      setItems(toArray(data).filter((item) => item?.[config.nameKey]));
    } catch (err) {
      console.error(`❌ Failed to load ${config.title}:`, err);
      setError(`Failed to load ${config.title.toLowerCase()}.`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item[config.nameKey] || "",
      description: item.description || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError(`${config.nameLabel} is required.`);
      return;
    }

    const payload = {
      id: editing?.id ?? 0,
      [config.nameKey]: form.name.trim(),
      ...(config.hasDescription
        ? { description: form.description.trim() }
        : {}),
    };

    try {
      setSaving(true);
      await config.save(payload);
      toast.success(
        `${config.singular} ${editing ? "updated" : "created"} successfully!`,
      );
      setModalOpen(false);
      await loadItems();
    } catch (err) {
      console.error(`❌ Failed to save ${config.singular}:`, err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          `Failed to save ${config.singular.toLowerCase()}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await config.remove(deleteTarget.id);
      toast.success(`${config.singular} deleted successfully!`);
      setDeleteTarget(null);
      await loadItems();
    } catch (err) {
      console.error(`❌ Failed to delete ${config.singular}:`, err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          `Failed to delete ${config.singular.toLowerCase()}.`,
      );
      setDeleteTarget(null);
    }
  };

  const colCount =
    1 + (config.hasDescription ? 1 : 0) + (config.showStatus ? 1 : 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg text-gray-800">{config.title}</h2>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 text-xs py-2 px-3 rounded-lg shadow-sm transition-all"
        >
          <Plus size={14} /> Add {config.singular}
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="p-3">{config.nameLabel}</th>
              {config.hasDescription && <th className="p-3">Description</th>}
              {config.showStatus && <th className="p-3">Status</th>}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="p-6 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="p-6 text-center text-gray-700"
                >
                  {error}{" "}
                  <button
                    type="button"
                    onClick={loadItems}
                    className="underline ml-1 text-black"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="p-6 text-center text-gray-500"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isActive =
                  item.is_active === true || item.is_active === "true";
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-900">
                      {item[config.nameKey]}
                    </td>
                    {config.hasDescription && (
                      <td className="p-3">{item.description}</td>
                    )}
                    {config.showStatus && (
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          ></span>{" "}
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="text-black hover:text-gray-600"
                        aria-label={`Edit ${item[config.nameKey]}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="text-black hover:text-gray-600"
                        aria-label={`Delete ${item[config.nameKey]}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            noValidate
            className="w-full max-w-md bg-white rounded-lg shadow-lg p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-[15px] text-gray-800">
                {editing ? "Edit" : "Add"} {config.singular}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-black hover:text-gray-600"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="settings-name" className="text-xs text-gray-700">
                {config.nameLabel}
              </label>
              <input
                id="settings-name"
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  setFormError("");
                }}
                autoFocus
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              {formError && (
                <p className="text-[11px] text-red-600" role="alert">
                  {formError}
                </p>
              )}
            </div>

            {config.hasDescription && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="settings-desc"
                  className="text-xs text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="settings-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] outline-none focus:border-black focus:ring-1 focus:ring-black resize-y"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-xs text-black hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-black px-4 py-2 text-xs text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.[config.nameKey] || ""}
      />
    </div>
  );
}

export default function InsuranceSettingsTab() {
  const [section, setSection] = useState("providers");

  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b border-gray-200 select-none">
        {Object.entries(SECTIONS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`pb-2 text-[13px] transition-all relative ${
              section === key
                ? "text-black after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <SettingsPanel key={section} config={SECTIONS[section]} />
    </div>
  );
}
