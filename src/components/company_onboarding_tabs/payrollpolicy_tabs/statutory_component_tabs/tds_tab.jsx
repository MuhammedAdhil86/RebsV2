import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import payrollService from "../../../../service/payrollService";
import EmployeeDeclarationList from "./declaration_tab";
// Adjust this path to wherever your InfoTooltip component lives.
import InfoTooltip from "../../../../ui/infotooltip";

/* ================================================================== */
/* Constants & helpers                                                 */
/* ================================================================== */

// Official TAN format: 4 letters + 5 digits + 1 letter (e.g. DELA12345B).
// Your sample "ABCDE1234F" is PAN-shaped (5-4-1). If your backend accepts
// that shape, change this to /^[A-Z]{5}[0-9]{4}[A-Z]$/.
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const DESCRIPTION_MAX = 250;

const SAVED_PAGE_SIZE = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const REQUIRED_HEADERS = ["user_id", "tds_deducted"];
const TEMPLATE_CSV =
  "user_id,tds_deducted,note\n100340,15000.00,TDS deducted by previous employer\n";

// Content for the (i) tooltip on the opening balance screen.
export const TDS_OPENING_BALANCE_INFO = [
  {
    title: "Understanding TDS Opening Balance",
    body: "What is a TDS Opening Balance?\nA TDS Opening Balance is the total amount of Tax Deducted at Source (TDS) that has already been deducted from an employee's salary by a previous employer or through payroll processing outside REBS during the current financial year.\n\nIt helps REBS calculate the employee's remaining tax liability accurately without treating previously deducted TDS as zero.",
  },
  {
    title: "Why do you need to upload it?",
    body: "When a company starts using REBS Payroll in the middle of a financial year, employees may already have had TDS deducted by:\n• Their previous employer before joining the company.\n• The company's previous payroll software.\n• An external payroll provider before migrating to REBS.\n\nWithout importing these amounts, REBS may calculate TDS without considering deductions already made during the financial year, potentially resulting in incorrect tax deductions.",
  },
  {
    title: "When should HR upload a CSV?",
    body: "Upload a TDS Opening Balance CSV when:\n1. Your company is migrating to REBS Payroll in the middle of a financial year.\n2. You are onboarding employees whose previous employer has already deducted TDS during the same financial year.\n3. Your company has processed payroll using another system before switching to REBS.\n4. You need to carry forward verified TDS deductions from an external payroll system into REBS.",
  },
  {
    title: "How does it work?",
    body: "1. Download or prepare the CSV\nPrepare employee IDs, TDS already deducted and an optional note.\n\n2. Upload the CSV\nSelect the applicable financial year and upload the CSV file.\n\n3. REBS validates the records\nEmployee IDs, duplicate entries, TDS amounts and existing payroll TDS records are checked.\n\n4. Opening balances are imported\nSuccessfully validated records are saved against the respective employees and financial year.\n\n5. Payroll TDS calculation\nREBS considers the imported opening balances when calculating subsequent TDS deductions.",
  },
  {
    title: "Important things to remember",
    body: "Import only verified TDS amounts supported by previous payroll records, Form 16, payslips or other relevant documents.\n\nUpload amounts deducted during the current financial year only, not the employee's lifetime TDS or previous financial years' deductions.\n\nDo not upload amounts already processed through REBS Payroll. Existing processed TDS records will prevent the import.\n\nOpening balance import is intended for migration and carry-forward of externally processed TDS, not for routinely updating monthly TDS deductions.",
  },
];

const EMPTY_FORM = {
  tanNumber: "",
  tanCircle: "",
  defaultRegimeId: "",
  allowOverride: false,
  description: "",
};

const formFromData = (data) => ({
  tanNumber: data?.tan_number || "",
  tanCircle: data?.tan_circle || "",
  defaultRegimeId: data?.default_regime?.id
    ? String(data.default_regime.id)
    : "",
  allowOverride: Boolean(data?.allow_employee_regime_selection),
  description: data?.description || "",
});

const validate = (form) => {
  const errors = {};
  const tan = form.tanNumber.trim().toUpperCase();
  if (!tan) errors.tanNumber = "TAN number is required.";
  else if (!TAN_REGEX.test(tan))
    errors.tanNumber = "Use 4 letters, 5 digits, 1 letter (e.g. DELA12345B).";
  if (!form.tanCircle.trim()) errors.tanCircle = "TAN circle is required.";
  if (!form.defaultRegimeId)
    errors.defaultRegimeId = "Select a default regime.";
  if (form.description.length > DESCRIPTION_MAX)
    errors.description = `Keep it under ${DESCRIPTION_MAX} characters.`;
  return errors;
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );

const regimeLabel = (regime) =>
  regime?.name ||
  regime?.regime?.toUpperCase?.() ||
  regime?.code?.toUpperCase?.() ||
  null;

/* ---------- CSV parsing (handles quoted fields) ---------- */
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
};

/* Parse the CSV text returned by GET /opening-balance into records. */
const parseSavedCsv = (text) => {
  const trimmed = (text || "").trim();
  if (!trimmed) return [];
  const rows = parseCsv(trimmed);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const iUser = headers.indexOf("user_id");
  const iAmount = headers.indexOf("tds_deducted");
  const iNote = headers.indexOf("note");
  if (iUser < 0 || iAmount < 0) return [];
  return rows.slice(1).map((r) => ({
    userId: (r[iUser] || "").trim(),
    amount: Number((r[iAmount] || "").trim()) || 0,
    note: iNote >= 0 ? (r[iNote] || "").trim() : "",
  }));
};

const analyseCsv = (text) => {
  const rows = parseCsv(text);
  if (!rows.length) return { errors: ["The file is empty."], records: [] };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length)
    return {
      errors: [
        `Missing required column(s): ${missing.join(", ")}. Expected: user_id, tds_deducted, note.`,
      ],
      records: [],
    };

  const idx = {
    user: headers.indexOf("user_id"),
    amount: headers.indexOf("tds_deducted"),
    note: headers.indexOf("note"),
  };

  const errors = [];
  const records = [];
  const seen = new Map();

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const userId = (r[idx.user] || "").trim();
    const amountRaw = (r[idx.amount] || "").trim();
    const note = idx.note >= 0 ? (r[idx.note] || "").trim() : "";

    if (!userId) {
      errors.push(`Row ${line}: user_id is empty.`);
      return;
    }
    if (!/^\d+$/.test(userId))
      errors.push(`Row ${line}: user_id "${userId}" must be a number.`);
    if (amountRaw === "" || Number.isNaN(Number(amountRaw)))
      errors.push(
        `Row ${line}: tds_deducted "${amountRaw}" is not a valid amount.`,
      );
    else if (Number(amountRaw) < 0)
      errors.push(`Row ${line}: tds_deducted can't be negative.`);

    if (seen.has(userId))
      errors.push(
        `Row ${line}: user_id ${userId} is repeated (first seen on row ${seen.get(userId)}).`,
      );
    else seen.set(userId, line);

    records.push({ userId, amount: Number(amountRaw), note });
  });

  if (!records.length) errors.push("The file has headers but no data rows.");
  return { errors, records };
};

/* ================================================================== */
/* Small presentational pieces                                         */
/* ================================================================== */

const ChevronDown = () => (
  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
    <svg
      className="h-4 w-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
);

const Badge = ({ tone = "gray", children }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-700 border border-green-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Field = ({ id, label, hint, error, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs font-medium text-gray-700 mb-1.5"
    >
      {label}
    </label>
    {children}
    {error ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1 text-[11px] text-red-600"
      >
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
    ) : null}
  </div>
);

const inputClass = (hasError) =>
  `w-full rounded-md border px-3 py-2 text-sm bg-white outline-none transition-colors focus:ring-1 ${
    hasError
      ? "border-red-400 focus:ring-red-500"
      : "border-gray-300 focus:border-black focus:ring-black"
  } disabled:bg-gray-50 disabled:text-gray-400`;

const Toggle = ({ id, checked, onChange, disabled }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50 ${
      checked ? "bg-black" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-0.5"
      }`}
    />
  </button>
);

/* ================================================================== */
/* Opening balance view (upload + info)                                */
/* ================================================================== */

const OpeningBalanceView = ({ financialYearId, financialYearName, onBack }) => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  // Saved balances (GET) + tab state
  const [tab, setTab] = useState("saved"); // "saved" | "upload"
  const [saved, setSaved] = useState({ records: [], raw: "" });
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    setSavedError("");
    try {
      const text = await payrollService.getTdsOpeningBalance(financialYearId);
      setSaved({ records: parseSavedCsv(text), raw: text || "" });
    } catch (err) {
      setSavedError(err?.message || "Could not load opening balances.");
    } finally {
      setSavedLoading(false);
    }
  }, [financialYearId]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const filteredSaved = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return saved.records;
    return saved.records.filter(
      (r) =>
        r.userId.toLowerCase().includes(q) || r.note.toLowerCase().includes(q),
    );
  }, [saved.records, query]);

  const savedTotal = useMemo(
    () => saved.records.reduce((sum, r) => sum + r.amount, 0),
    [saved.records],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(filteredSaved.length / SAVED_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredSaved.slice(
    (currentPage - 1) * SAVED_PAGE_SIZE,
    currentPage * SAVED_PAGE_SIZE,
  );

  const downloadSaved = () => {
    const url = URL.createObjectURL(
      new Blob([saved.raw], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `tds_opening_balance_${financialYearName || financialYearId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = useCallback(async (selected) => {
    setFileError("");
    setAnalysis(null);
    setResult(null);
    if (!selected) return;

    if (!/\.csv$/i.test(selected.name)) {
      setFile(null);
      setFileError("Please choose a .csv file.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setFileError("The file is larger than 5 MB.");
      return;
    }
    setFile(selected);
    try {
      setAnalysis(analyseCsv(await selected.text()));
    } catch {
      setFile(null);
      setFileError("Couldn't read that file.");
    }
  }, []);

  const clearFile = () => {
    setFile(null);
    setAnalysis(null);
    setFileError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(
      new Blob([TEMPLATE_CSV], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "tds_opening_balance_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = useMemo(
    () =>
      (analysis?.records || []).reduce(
        (sum, r) => sum + (Number(r.amount) || 0),
        0,
      ),
    [analysis],
  );

  const canUpload =
    file && analysis && analysis.errors.length === 0 && !uploading && !result;

  const handleUpload = async () => {
    if (!canUpload) return;
    setUploading(true);
    try {
      const res = await payrollService.populateTdsOpeningBalance(
        financialYearId,
        file,
      );
      const count = res?.data?.count ?? res?.count ?? analysis.records.length;
      setResult({ count, message: res?.data?.message || res?.message });
      toast.success(
        `Opening balances saved for ${count} employee${count === 1 ? "" : "s"}.`,
      );
      loadSaved();
    } catch (err) {
      toast.error(err?.message || "Upload failed. Fix the file and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="flex items-center text-sm font-medium leading-none whitespace-nowrap">
            TDS opening balance
            <InfoTooltip sections={TDS_OPENING_BALANCE_INFO} />
          </h2>
          <span className="text-gray-300" aria-hidden="true">
            |
          </span>
          <span className="text-xs leading-none text-gray-500">
            For {financialYearName || "the selected year"}
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="shrink-0 rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-gray-200" role="tablist">
        {[
          {
            key: "saved",
            label: `Saved balances${saved.records.length ? ` (${saved.records.length})` : ""}`,
          },
          { key: "upload", label: "Upload CSV" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            disabled={uploading}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              tab === t.key
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Saved balances */}
      {tab === "saved" && (
        <div>
          {savedLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : savedError ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800"
            >
              <p className="font-medium">{savedError}</p>
              <button
                onClick={loadSaved}
                className="mt-2 font-medium underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : saved.records.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm font-medium text-gray-900">
                No opening balances yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Nothing has been imported for {financialYearName || "this year"}
                .
              </p>
              <button
                onClick={() => setTab("upload")}
                className="mt-4 rounded-md bg-black px-5 py-1.5 text-sm font-medium text-white"
              >
                Upload CSV
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-700">
                  <span>
                    <strong>{saved.records.length}</strong> employee
                    {saved.records.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    Total TDS: <strong>{formatINR(savedTotal)}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search user ID or note"
                    aria-label="Search saved opening balances"
                    className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                  <button
                    onClick={loadSaved}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={downloadSaved}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="w-12 px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">User ID</th>
                      <th className="px-3 py-2 text-right font-medium">
                        TDS deducted
                      </th>
                      <th className="px-3 py-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-gray-500"
                        >
                          No records match “{query}”.
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((r, i) => (
                        <tr
                          key={`${r.userId}-${i}`}
                          className="border-t border-gray-100"
                        >
                          <td className="px-3 py-2 text-gray-400">
                            {(currentPage - 1) * SAVED_PAGE_SIZE + i + 1}
                          </td>
                          <td className="px-3 py-2 font-mono">{r.userId}</td>
                          <td className="px-3 py-2 text-right">
                            {formatINR(r.amount)}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {r.note || "--"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Page {currentPage} of {pageCount} · {filteredSaved.length}{" "}
                    record
                    {filteredSaved.length === 1 ? "" : "s"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage(Math.min(pageCount, currentPage + 1))
                      }
                      disabled={currentPage === pageCount}
                      className="rounded-md border border-gray-300 px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload */}
      {tab === "upload" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Format hint + template */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <p>
                CSV columns:{" "}
                <code className="rounded bg-gray-100 px-1">user_id</code>,{" "}
                <code className="rounded bg-gray-100 px-1">tds_deducted</code>,{" "}
                <code className="rounded bg-gray-100 px-1">note</code>{" "}
                (optional)
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="font-medium text-black underline underline-offset-2"
              >
                Download template
              </button>
            </div>

            {/* Drop zone / selected file */}
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragging ? "border-black bg-gray-50" : "border-gray-300"
                }`}
              >
                <p className="text-sm text-gray-700">
                  Drag a CSV file here, or
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 rounded-md border border-black px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Choose file
                </button>
                <p className="mt-2 text-[11px] text-gray-500">
                  .csv only, up to 5 MB
                </p>
                {fileError && (
                  <p role="alert" className="mt-3 text-xs text-red-600">
                    {fileError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!uploading && !result && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs font-medium text-gray-600 hover:text-black"
                  >
                    Replace
                  </button>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Validation errors */}
            {analysis && analysis.errors.length > 0 && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <p className="mb-1 font-medium">
                  Fix {analysis.errors.length} issue
                  {analysis.errors.length === 1 ? "" : "s"} before uploading
                </p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {analysis.errors.slice(0, 8).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                {analysis.errors.length > 8 && (
                  <p className="mt-1">
                    …and {analysis.errors.length - 8} more.
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {analysis && analysis.errors.length === 0 && (
              <div>
                <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-700">
                  <span>
                    <strong>{analysis.records.length}</strong> employee
                    {analysis.records.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    Total TDS: <strong>{formatINR(total)}</strong>
                  </span>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">User ID</th>
                        <th className="px-3 py-2 text-right font-medium">
                          TDS deducted
                        </th>
                        <th className="px-3 py-2 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.records.slice(0, 5).map((r) => (
                        <tr key={r.userId} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono">{r.userId}</td>
                          <td className="px-3 py-2 text-right">
                            {formatINR(r.amount)}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {r.note || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analysis.records.length > 5 && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Showing the first 5 of {analysis.records.length} rows.
                  </p>
                )}
              </div>
            )}

            {/* Success */}
            {result && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                {result.message ||
                  "TDS opening balances populated successfully"}{" "}
                — {result.count} record
                {result.count === 1 ? "" : "s"} imported.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!canUpload}
                className="rounded-md bg-black px-5 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? "Uploading…" : "Upload opening balance"}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={() => setTab("saved")}
                  className="rounded-md border border-black px-5 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  View saved balances
                </button>
              )}
              {result && (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-md border border-black px-5 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Done
                </button>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="mb-1 font-medium">Important things to remember</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Import only verified TDS amounts supported by previous payroll
                  records, Form 16, payslips or other relevant documents.
                </li>
                <li>
                  Upload amounts deducted during the{" "}
                  <strong>current financial year only</strong>, not the
                  employee's lifetime TDS or previous financial years'
                  deductions.
                </li>
                <li>
                  Do not upload amounts already processed through REBS Payroll.
                  Existing processed TDS records will prevent the import.
                </li>
                <li>
                  Opening balance import is intended for migration and
                  carry-forward of externally processed TDS, not for routinely
                  updating monthly TDS deductions.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

/* ================================================================== */
/* Main component                                                      */
/* ================================================================== */

const TdsTab = ({ onUpdate }) => {
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [tdsData, setTdsData] = useState(null);
  const [regimesList, setRegimesList] = useState([]);

  // "TDS_CONFIG" | "DECLARATION_LIST" | "OPENING_BALANCE"
  const [activeView, setActiveView] = useState("TDS_CONFIG");
  const [isEditing, setIsEditing] = useState(false);

  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loadingRegimes, setLoadingRegimes] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Guards against out-of-order responses when the year changes quickly.
  const requestIdRef = useRef(0);

  /* ---------- Data loading ---------- */

  const init = useCallback(async () => {
    setInitLoading(true);
    setInitError(false);
    try {
      const activeYear = await payrollService.getActiveFinancialYear();
      if (!activeYear?.id) throw new Error("No active financial year");
      setFinancialYears([activeYear]);
      setSelectedYearId(String(activeYear.id));
    } catch (err) {
      setInitError(true);
      toast.error("Could not load financial settings.");
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const loadTdsData = useCallback(async (yearId) => {
    if (!yearId) return;
    const requestId = ++requestIdRef.current;
    setFetching(true);
    try {
      const response = await payrollService.getTDS(yearId);
      if (requestId === requestIdRef.current) setTdsData(response || null);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setTdsData(null);
        toast.error("Failed to load TDS details.");
      }
    } finally {
      if (requestId === requestIdRef.current) setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedYearId) loadTdsData(selectedYearId);
  }, [selectedYearId, loadTdsData]);

  // Reset edit state when the year changes so stale values never leak across years.
  useEffect(() => {
    setIsEditing(false);
  }, [selectedYearId]);

  /* ---------- Derived state ---------- */

  const selectedYear = useMemo(
    () => financialYears.find((fy) => String(fy.id) === String(selectedYearId)),
    [financialYears, selectedYearId],
  );

  const isConfigured = Boolean(tdsData?.tan_number);

  // Opening balance is only available once TDS is configured.
  useEffect(() => {
    if (!fetching && !isConfigured && activeView === "OPENING_BALANCE") {
      setActiveView("TDS_CONFIG");
    }
  }, [fetching, isConfigured, activeView]);
  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const isDirty = useMemo(() => {
    const original = formFromData(tdsData);
    return (
      form.tanNumber.trim().toUpperCase() !==
        original.tanNumber.toUpperCase() ||
      form.tanCircle.trim() !== original.tanCircle ||
      form.defaultRegimeId !== original.defaultRegimeId ||
      form.allowOverride !== original.allowOverride ||
      form.description.trim() !== original.description
    );
  }, [form, tdsData]);

  const showError = (name) =>
    touched[name] || submitAttempted ? errors[name] : undefined;

  /* ---------- Handlers ---------- */

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));
  const markTouched = (name) =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const handleStartEdit = async () => {
    setLoadingRegimes(true);
    try {
      let list = regimesList;
      if (!list.length) {
        const data = await payrollService.getTaxRegimes();
        list = (Array.isArray(data) ? data : []).filter(
          (r) => r.is_active !== false,
        );
        setRegimesList(list);
      }
      const initial = formFromData(tdsData);
      // First-time setup: default to the first active regime (the "new" regime).
      if (!initial.defaultRegimeId && list.length)
        initial.defaultRegimeId = String(list[0].id);
      setForm(initial);
      setTouched({});
      setSubmitAttempted(false);
      setIsEditing(true);
    } catch (err) {
      toast.error("Could not load tax regimes.");
    } finally {
      setLoadingRegimes(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("Discard your unsaved changes?")) return;
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors) return;
    if (!isDirty) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const success = await onUpdate({
        financial_year_id: Number(selectedYearId),
        tan_number: form.tanNumber.trim().toUpperCase(),
        tan_circle: form.tanCircle.trim(),
        allow_employee_regime_selection: form.allowOverride,
        default_regime: Number(form.defaultRegimeId),
        description: form.description.trim(),
      });
      if (success) {
        setIsEditing(false);
        await loadTdsData(selectedYearId);
      }
    } catch (err) {
      toast.error(
        err?.backendError ||
          err?.message ||
          "Could not save TDS settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Render: loading / error ---------- */

  if (initLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-900">
          We couldn't load the active financial year.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Check your connection and try again.
        </p>
        <button
          onClick={init}
          className="mt-4 rounded-md bg-black px-5 py-1.5 text-sm font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ---------- Render: main ---------- */

  const detailRows = [
    {
      label: "Financial year",
      value: tdsData?.financial_year?.name || selectedYear?.name,
    },
    {
      label: "Assessment year",
      value:
        tdsData?.financial_year?.assessment_year ||
        selectedYear?.assessment_year,
    },
    { label: "TAN number", value: tdsData?.tan_number, mono: true },
    { label: "TAN circle", value: tdsData?.tan_circle },
    { label: "Default regime", value: regimeLabel(tdsData?.default_regime) },
    {
      label: "Employee regime choice",
      value: tdsData?.allow_employee_regime_selection
        ? "Employees can choose their own regime"
        : "Employees use the default regime",
    },
    { label: "Notes", value: tdsData?.description },
  ];

  return (
    <div className="space-y-6">
      {/* Financial year bar (config view only) */}
      {activeView === "TDS_CONFIG" && (
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="w-full max-w-xs">
            <label
              htmlFor="fy-select"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Financial year
            </label>
            <div className="relative">
              <select
                id="fy-select"
                value={selectedYearId || ""}
                onChange={(e) => setSelectedYearId(e.target.value)}
                disabled={financialYears.length <= 1 || isEditing || saving}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white p-2 pr-10 text-xs outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500"
              >
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          {selectedYear && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {formatDate(selectedYear.financial_year_start)} –{" "}
                {formatDate(selectedYear.financial_year_end)}
              </span>
              {selectedYear.is_active && <Badge tone="green">Active</Badge>}
            </div>
          )}
        </div>
      )}

      {activeView === "DECLARATION_LIST" ? (
        <EmployeeDeclarationList
          financialYearId={selectedYearId}
          onBack={() => setActiveView("TDS_CONFIG")}
        />
      ) : activeView === "OPENING_BALANCE" && isConfigured ? (
        <OpeningBalanceView
          financialYearId={selectedYearId}
          financialYearName={selectedYear?.name}
          onBack={() => setActiveView("TDS_CONFIG")}
        />
      ) : fetching ? (
        <div
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
          aria-busy="true"
        >
          <Skeleton className="h-4 w-48" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : isEditing ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {isConfigured
                ? "Update TDS configuration"
                : "Set up TDS configuration"}
            </h2>
            {isDirty && <Badge tone="amber">Unsaved changes</Badge>}
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-xl space-y-5"
          >
            <Field
              id="tan-number"
              label="TAN number"
              hint="Tax Deduction Account Number issued by the Income Tax Department."
              error={showError("tanNumber")}
            >
              <input
                id="tan-number"
                value={form.tanNumber}
                onChange={(e) =>
                  setField(
                    "tanNumber",
                    e.target.value.toUpperCase().replace(/\s/g, ""),
                  )
                }
                onBlur={() => markTouched("tanNumber")}
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(showError("tanNumber"))}
                aria-describedby={
                  showError("tanNumber") ? "tan-number-error" : undefined
                }
                className={`${inputClass(showError("tanNumber"))} font-mono tracking-wider`}
                placeholder="DELA12345B"
                disabled={saving}
              />
            </Field>

            <Field
              id="tan-circle"
              label="TAN circle"
              error={showError("tanCircle")}
            >
              <input
                id="tan-circle"
                value={form.tanCircle}
                onChange={(e) => setField("tanCircle", e.target.value)}
                onBlur={() => markTouched("tanCircle")}
                aria-invalid={Boolean(showError("tanCircle"))}
                className={inputClass(showError("tanCircle"))}
                placeholder="e.g. Kochi"
                disabled={saving}
              />
            </Field>

            <Field
              id="default-regime"
              label="Default tax regime"
              hint="Applied to every employee who doesn't pick a regime."
              error={showError("defaultRegimeId")}
            >
              <div className="relative">
                <select
                  id="default-regime"
                  value={form.defaultRegimeId}
                  onChange={(e) => setField("defaultRegimeId", e.target.value)}
                  onBlur={() => markTouched("defaultRegimeId")}
                  className={`${inputClass(showError("defaultRegimeId"))} appearance-none pr-10`}
                  disabled={saving}
                >
                  <option value="" disabled>
                    Select a regime
                  </option>
                  {regimesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>

            <div className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-3">
              <div>
                <label
                  htmlFor="allow-override"
                  className="text-xs font-medium text-gray-800"
                >
                  Let employees choose their regime
                </label>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {form.allowOverride
                    ? "Employees can switch between old and new regime in their declaration."
                    : "All employees are taxed under the default regime."}
                </p>
              </div>
              <Toggle
                id="allow-override"
                checked={form.allowOverride}
                onChange={(v) => setField("allowOverride", v)}
                disabled={saving}
              />
            </div>

            <Field
              id="description"
              label="Notes (optional)"
              error={showError("description")}
            >
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                className={inputClass(showError("description"))}
                placeholder={`TDS settings for ${selectedYear?.name || "this year"}`}
                disabled={saving}
              />
              <div
                className={`mt-1 text-right text-[11px] ${
                  form.description.length > DESCRIPTION_MAX
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {form.description.length}/{DESCRIPTION_MAX}
              </div>
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || (submitAttempted && hasErrors)}
                className="rounded-md bg-black px-5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-md border border-black px-5 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Tax Deducted at Source (TDS)
            </h2>
            <Badge tone={isConfigured ? "green" : "amber"}>
              {isConfigured ? "Configured" : "Not configured"}
            </Badge>
          </div>

          {!isConfigured && (
            <div className="mb-6 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-600">
              TDS isn't set up for {selectedYear?.name || "this year"} yet. Add
              your TAN details and default regime so payroll can deduct tax
              correctly.
            </div>
          )}

          <dl className="space-y-3">
            {detailRows.map(({ label, value, mono }) => (
              <div
                key={label}
                className="flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:gap-3"
              >
                <dt className="text-sm text-gray-500 sm:w-[200px] sm:shrink-0">
                  {label}
                </dt>
                <dd
                  className={`text-sm font-medium text-black ${mono ? "font-mono tracking-wider" : ""}`}
                >
                  {value || "--"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleStartEdit}
              disabled={loadingRegimes}
              className="rounded-md border border-black px-5 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingRegimes
                ? "Loading…"
                : isConfigured
                  ? "Update"
                  : "Set up TDS"}
            </button>
            <button
              onClick={() => setActiveView("DECLARATION_LIST")}
              disabled={!isConfigured}
              title={
                !isConfigured ? "Set up TDS configuration first" : undefined
              }
              className="rounded-md bg-black px-5 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Employee declarations
            </button>
            {isConfigured && (
              <button
                onClick={() => setActiveView("OPENING_BALANCE")}
                className="rounded-md border border-gray-300 px-5 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                Opening balance
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TdsTab;
