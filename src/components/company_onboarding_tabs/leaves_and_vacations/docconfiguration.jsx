import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react";

import PayrollTable from "../../../ui/payrolltable";
import DeleteConfirmationModal from "../../../ui/deletemodal";
import documentService from "../../../service/documentservice";
import { showApiSuccess, showApiError } from "../../../utils/apiToast";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const VIEW = {
  LIST: "list",
  CONFIGURE: "configure",
};

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

/** API sends updatedAt as { Time, Valid } */
const getUpdatedValue = (doc) =>
  doc?.updatedAt?.Valid ? doc.updatedAt.Time : null;

const toArray = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : [];
};

/* -------------------------------------------------------------------------- */
/*                              Reusable Fields                               */
/* -------------------------------------------------------------------------- */

/** Back button + title shown at the top of the Configure view. */
function SubViewHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-black text-[12px] font-light hover:bg-gray-50 transition-colors"
      >
        <Icon icon="solar:arrow-left-outline" className="w-3.5 h-3.5" />
        Back
      </button>

      <h3 className="text-base font-medium text-gray-800">{title}</h3>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Main Page                                  */
/* -------------------------------------------------------------------------- */

export default function DocConfiguration() {
  /* ------------------------------- Navigation ------------------------------ */
  const [activeView, setActiveView] = useState(VIEW.LIST);

  /* ------------------------------ Document list ---------------------------- */
  const [documentList, setDocumentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /* ----------------------------- Configure form ---------------------------- */
  const [documentName, setDocumentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState(null);

  /* ------------------------------ Row actions ------------------------------ */
  const [actionMenu, setActionMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadDocuments = () => setReloadKey((key) => key + 1);

  /* ------------------------------ View handlers ---------------------------- */
  const openConfigureView = () => {
    setEditingDocumentId(null);
    setDocumentName("");
    setActiveView(VIEW.CONFIGURE);
  };

  const openEditView = (doc) => {
    setEditingDocumentId(doc.id);
    setDocumentName(doc.name);
    setActiveView(VIEW.CONFIGURE);
  };

  const returnToList = () => setActiveView(VIEW.LIST);

  /* ------------------------------ Row action menu -------------------------- */
  const toggleActionMenu = (event, documentId) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionMenu((current) =>
      current?.id === documentId
        ? null
        : {
            id: documentId,
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
          },
    );
  };

  const menuDocument = actionMenu
    ? documentList.find((doc) => doc.id === actionMenu.id)
    : null;

  const handleMenuDelete = () => {
    if (!menuDocument) return;

    setActionMenu(null);
    setDeleteTarget(menuDocument);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    try {
      setIsDeleting(true);

      const response = await documentService.deleteDocument(deleteTarget.id);

      showApiSuccess(response, "Document deleted successfully.");
      setDeleteTarget(null);
      reloadDocuments();
    } catch (error) {
      showApiError(error, "Failed to delete document.");
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

  /* ------------------- Load documents (list view only) --------------------- */
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await documentService.getDocumentList();

      setDocumentList(toArray(response));
    } catch (error) {
      console.error("Document list fetch failed:", error);
      setDocumentList([]);
      showApiError(error, "Failed to load document list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView !== VIEW.LIST) return;

    loadDocuments();
  }, [activeView, reloadKey, loadDocuments]);

  /* ------------------------------ Save document ---------------------------- */
  const handleSaveDocument = async () => {
    const trimmed = documentName.trim();

    if (!trimmed) {
      showApiError(null, "Document name is required.");
      return;
    }

    const isDuplicate = documentList.some(
      (doc) =>
        doc.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        String(doc.id) !== String(editingDocumentId),
    );

    if (isDuplicate) {
      showApiError(null, "This document already exists.");
      return;
    }

    try {
      setIsSaving(true);

      const response = editingDocumentId
        ? await documentService.updateDocument(editingDocumentId, trimmed)
        : await documentService.addDocument(trimmed);

      showApiSuccess(
        response,
        editingDocumentId
          ? "Document updated successfully."
          : "Document saved successfully.",
      );

      setDocumentName("");
      setEditingDocumentId(null);
      reloadDocuments();
      returnToList();
    } catch (error) {
      showApiError(error, "Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------- Table data ----------------------------- */
  const normalizedSearch = searchTerm.toLowerCase();

  const tableRows = documentList
    .filter((doc) => doc.name.toLowerCase().includes(normalizedSearch))
    .map((doc) => ({
      ...doc,
      created_display: formatDisplayDate(doc.createdOn),
      updated_display: formatDisplayDate(getUpdatedValue(doc)),
    }));

  const tableColumns = [
    {
      label: "Document Name",
      key: "name",
      align: "left",
      width: 260,
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
      key: "actions",
      align: "center",
      width: 90,
      render: (_, row) => (
        <button
          type="button"
          aria-label="Row actions"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation(); // don't trigger the row click
            toggleActionMenu(event, row.id);
          }}
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
          title={editingDocumentId ? "Update Document" : "Add Document"}
          onBack={returnToList}
        />

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            {editingDocumentId ? "Edit Document" : "Add Document"}
          </h4>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-gray-500">Document Name</label>

              <input
                type="text"
                placeholder="e.g. Offer Letter"
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-black w-64"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg text-white text-[12px] font-light hover:bg-zinc-800 transition-colors disabled:opacity-60"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}

              {editingDocumentId ? "Update" : "Save"}
            </button>
          </div>
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
        <h3 className="text-base font-medium text-gray-800">Documents</h3>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openConfigureView}
            className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg text-white text-[12px] font-light hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            <Icon icon="solar:add-circle-outline" className="w-3.5 h-3.5" />
            Add Document
          </button>

          <div className="relative w-[220px]">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg w-full outline-none text-[12px]"
            />

            <Icon
              icon="mynaui:search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <PayrollTable
            columns={tableColumns}
            data={tableRows}
            rowsPerPage={TABLE_ROWS_PER_PAGE}
            rowClickHandler={(row) => openEditView(row)}
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
            onClick={handleMenuDelete}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
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
