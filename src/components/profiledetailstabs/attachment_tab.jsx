import React, { useEffect, useState } from "react";
import { FileText, Plus, X, Download } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import useEmployeeStore from "../../store/employeeStore"; // update path if different
import {
  fetchCategory,
  fetchAttachments,
  attachmentUpload,
} from "../../service/mainServices"; // update path if different

export default function AttachmentsTab({
  attachments: initialAttachments = [],
  employeeUUID: propEmployeeUUID = null,
  onUploadSuccess = null, // optional callback to parent
}) {
  // employee uuid resolution: prefer prop, fallback to store
  const { selectedEmployee } = useEmployeeStore();
  const employeeUUID = propEmployeeUUID || selectedEmployee?.uuid;

  // Local state (keeps and updates the attachments shown)
  const [attachments, setAttachments] = useState(initialAttachments || []);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal state & form fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);

  // Insurance/Baladiya/Driving fields
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [dlNumber, setDLNumber] = useState("");
  const [baladiyaNumber, setBaladiyaNumber] = useState("");
  const [country, setCountry] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // get user's company country (same as old logic)
  const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;
  const userCountry = userData?.company?.country || "";

  // Fetch categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories");
      }
    };
    loadCategories();
  }, []);

  // Fetch attachments for this employee when modal opens or on mount (if employeeUUID exists)
  useEffect(() => {
    const loadAttachments = async () => {
      if (!employeeUUID) return;
      setIsLoading(true);
      try {
        const resp = await fetchAttachments(employeeUUID);
        setAttachments(resp || []);
      } catch (err) {
        console.error("Failed to fetch attachments:", err);
        toast.error("Failed to load attachments");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch at mount and when modal closes (to refresh after upload) or when employeeUUID changes
    loadAttachments();
  }, [employeeUUID]);

  // Reset conditional fields when category changes
  useEffect(() => {
    const selected = categories.find((c) => `${c.id}` === `${category}`);
    if (!selected || selected.name !== "Insurance") {
      setInsuranceCompany("");
      setInsuranceNumber("");
    }
    // Baladiya / Driving default country to user's company country
    if (!selected || (selected.name !== "Baladiya Card (Labour card)" && selected.name !== "Driving Licence")) {
      setCountry("");
    } else {
      setCountry(userCountry || "");
    }
    if (!selected || selected.name !== "Baladiya Card (Labour card)") {
      setBaladiyaNumber("");
    }
    if (!selected || selected.name !== "Driving Licence") {
      setDLNumber("");
    }
    // Do not clear dates here — keep user input until submit or modal close
  }, [category, categories, userCountry]);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const validateForCategory = (selectedCategory) => {
    if (!title || !category || !file) {
      toast.error("Please fill all fields and upload a file.");
      return false;
    }

    if (selectedCategory?.name === "Insurance") {
      if (!insuranceCompany || !insuranceNumber || !issueDate || !expiryDate) {
        toast.error("Please fill all insurance-related fields.");
        return false;
      }
    }

    if (selectedCategory?.name === "Baladiya Card (Labour card)") {
      if (!country || !baladiyaNumber || !issueDate || !expiryDate) {
        toast.error("Please fill all Baladiya Card fields.");
        return false;
      }
    }

    if (selectedCategory?.name === "Driving Licence") {
      if (!country || !dlNumber || !issueDate || !expiryDate) {
        toast.error("Please fill all Driving Licence fields.");
        return false;
      }
    }

    return true;
  };

  const clearForm = () => {
    setTitle("");
    setCategory("");
    setFile(null);
    setInsuranceCompany("");
    setInsuranceNumber("");
    setDLNumber("");
    setBaladiyaNumber("");
    setCountry("");
    setIssueDate("");
    setExpiryDate("");
  };

  const handleSubmit = async () => {
    if (!employeeUUID) {
      toast.error("No employee selected.");
      return;
    }

    const selectedCategory = categories.find((c) => `${c.id}` === `${category}`);

    if (!validateForCategory(selectedCategory)) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("document", file);

    if (selectedCategory?.name === "Insurance") {
      formData.append("insurance_company", insuranceCompany);
      formData.append("insurance_number", insuranceNumber);
      formData.append("issue_date", issueDate);
      formData.append("expiry_date", expiryDate);
    }

    if (selectedCategory?.name === "Baladiya Card (Labour card)") {
      formData.append("issued_country", country);
      formData.append("id_num", baladiyaNumber);
      formData.append("issue_date", issueDate);
      formData.append("expiry_date", expiryDate);
    }

    if (selectedCategory?.name === "Driving Licence") {
      formData.append("issued_country", country);
      formData.append("id_num", dlNumber);
      formData.append("issue_date", issueDate);
      formData.append("expiry_date", expiryDate);
    }

    try {
      setIsLoading(true);
      await attachmentUpload(employeeUUID, formData);
      toast.success("Attachment uploaded successfully!");
      // refresh attachments list
      const refreshed = await fetchAttachments(employeeUUID);
      setAttachments(refreshed || []);
      if (typeof onUploadSuccess === "function") onUploadSuccess(refreshed || []);
      clearForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error("Error uploading attachment.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilePreview = (f) => {
    if (!f) return null;
    // if f is a File object show local preview; if it's an object from server, show icon (handled in list)
    const fileType = f.type ? f.type.split("/")[0] : null;
    if (fileType === "image") {
      return (
        <img
          src={URL.createObjectURL(f)}
          alt="Preview"
          className="w-full h-40 object-cover rounded-md border"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-40 border rounded-md bg-gray-50 p-3">
        <FileText size={32} className="text-gray-400" />
        <p className="mt-2 text-[12px] text-gray-600">{f.name}</p>
        <p className="text-[12px] text-gray-400">{(f.size / 1024).toFixed(2)} KB</p>
      </div>
    );
  };

  // render server attachment preview (image/pdf/other)
  const renderAttachmentPreview = (attachment) => {
    // attachment.document could be URL or path
    const url = attachment.document || attachment.url || attachment.path || "";
    const extension = url.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif"].includes(extension);
    const isPDF = extension === "pdf";

    if (isImage) {
      return (
        <div className="relative group">
          <img src={url} alt={attachment.title} className="w-full h-40 object-cover rounded-md border" />
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity"
          >
            <Download className="text-white" />
          </a>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="flex flex-col items-center">
          <div className="w-full h-40 bg-gray-50 rounded-md border flex items-center justify-center p-4">
            <FileText size={36} className="text-gray-400" />
          </div>
          <a href={url} target="_blank" rel="noreferrer noopener" className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <Download size={14} /> View PDF
          </a>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className="w-full h-40 bg-gray-50 rounded-md border flex items-center justify-center p-4">
          <FileText size={36} className="text-gray-400" />
        </div>
        <a href={url} target="_blank" rel="noreferrer noopener" className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <Download size={14} /> Download
        </a>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <Toaster position="top-right" />

      <div className="flex items-start justify-between mb-4">
        <h2 className="text-[16px] text-gray-800" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}>
          All Attachments
        </h2>

        {/* Add Button (always visible, but the user wanted it when no docs — we also show it when docs exist) */}
        <button
          onClick={() => {
            // when opening modal, ensure categories are loaded and some defaults set
            setIsModalOpen(true);
            // default country if available for certain categories will be handled by useEffect on category change
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white text-[12px] rounded-md hover:bg-gray-900"
        >
          <Plus size={14} />
          Add Attachment
        </button>
      </div>

      {/* Empty state */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No attachments available.</p>

        </div>
      ) : (
        <div className="space-y-4">
          {attachments.map((file, idx) => (
            <div
              key={file.id || idx}
              className="flex items-center justify-between border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-stretch gap-4">
                <div className="flex items-center justify-center bg-gray-100 px-3 rounded-md">
                  <FileText size={24} className="text-gray-500" />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <p className="text-sm text-gray-800" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
                    {file.title || file.name || "Untitled Document"}
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
                    Category: {file.category || file.category_name || "Uncategorized"}
                  </p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
                    Added: {file.created_at ? new Date(file.created_at).toLocaleDateString() : file.addedOn ? new Date(file.addedOn).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={file.document || file.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-black text-white text-xs rounded-md hover:bg-gray-800"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                >
                  View pdf
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----- Modal for adding attachment ----- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl p-6 relative shadow-lg">
            <button
              onClick={() => {
                setIsModalOpen(false);
                clearForm();
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X />
            </button>

            <h3 className="text-lg font-medium mb-4">Add Attachment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional fields based on category name */}
              {categories.find((c) => `${c.id}` === `${category}`)?.name === "Insurance" && (
                <>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Insurance Company</label>
                    <input value={insuranceCompany} onChange={(e) => setInsuranceCompany(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Insurance company" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Insurance Number</label>
                    <input value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Insurance number" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Issue Date</label>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Expiry Date</label>
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>
                </>
              )}

              {categories.find((c) => `${c.id}` === `${category}`)?.name === "Baladiya Card (Labour card)" && (
                <>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Issued Country</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Country" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">ID Card Number</label>
                    <input value={baladiyaNumber} onChange={(e) => setBaladiyaNumber(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Baladiya number" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Issue Date</label>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Expiry Date</label>
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>
                </>
              )}

              {categories.find((c) => `${c.id}` === `${category}`)?.name === "Driving Licence" && (
                <>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Issued Country</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Country" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">DL Number</label>
                    <input value={dlNumber} onChange={(e) => setDLNumber(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="DL number" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Issue Date</label>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Expiry Date</label>
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
                  </div>
                </>
              )}

              {/* File upload */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700 mb-1 block">Upload File</label>
                <input type="file" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" className="w-full" />
              </div>

              {/* preview */}
              {file && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  {getFilePreview(file)}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  clearForm();
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
              >
                {isLoading ? "Uploading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
