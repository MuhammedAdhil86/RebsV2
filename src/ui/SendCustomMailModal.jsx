import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, Send, ChevronDown, Paperclip } from "lucide-react";
import {
  fetchManualPurposes,
  fetchPurposePlaceholders,
  sendCustomEmailByPurposeService,
} from "../service/mainServices";
import GmailComposeWindow from "../ui/GmailComposeWindow";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "ApplicantName" / "applicant_name" -> "Applicant Name"
const humanizeKey = (key) =>
  String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------- Chip input for email addresses ---------- */
const EmailChipInput = ({ label, value, onChange, disabled, required }) => {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const commit = (raw) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const valid = [];
    let hasInvalid = false;
    parts.forEach((p) => {
      if (!EMAIL_REGEX.test(p)) hasInvalid = true;
      else if (!value.includes(p) && !valid.includes(p)) valid.push(p);
    });

    if (valid.length) onChange([...value, ...valid]);
    setError(hasInvalid ? "Enter a valid email address" : "");
    setDraft(
      hasInvalid ? parts.filter((p) => !EMAIL_REGEX.test(p)).join(" ") : "",
    );
  };

  const handleKeyDown = (e) => {
    if (["Enter", ",", ";", " "].includes(e.key)) {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      } else if (e.key === "Enter") {
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  /* ----- Default boxed field ----- */
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        className={`flex flex-wrap items-center gap-1.5 w-full px-3 py-2.5 bg-white rounded-xl border transition-all min-h-[46px] ${
          disabled
            ? "border-zinc-100 bg-zinc-50 opacity-60"
            : error
              ? "border-red-400"
              : "border-zinc-200 focus-within:border-black"
        }`}
      >
        {value.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 bg-zinc-100 text-black rounded-full pl-3 pr-1.5 py-1 text-[11px]"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== email))}
                className="p-0.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-black cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          disabled={disabled}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? "name@company.com" : ""}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-[12px] font-normal disabled:cursor-not-allowed"
        />
      </div>
      {error && <p className="text-[10px] text-red-500 ml-1">{error}</p>}
    </div>
  );
};

/* ---------- Modal ---------- */
const SendCustomMailModal = ({
  isOpen,
  onClose,
  loading = false,
  // Receives:
  //  toggle ON  -> { continue_with_custom_mail: true,  purpose, to, cc, bcc }
  //  toggle OFF -> { continue_with_custom_mail: false, purpose, to, cc, bcc, subject, body_html, attachments (File[]), scheduled_at }
  onSubmit,
  // Optional prefill for placeholder values, e.g. { ApplicantName: "Ravi Kumar" }
  placeholderData = {},
  // Called after the email is sent successfully (toggle ON)
  onSuccess,
}) => {
  // Placeholders for the selected purpose (GET /admin/templates/by-purpose/{purpose}/placeholders)
  const [placeholders, setPlaceholders] = useState([]);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [placeholdersLoading, setPlaceholdersLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [step, setStep] = useState(1); // 1 = form, 2 = Gmail-style compose
  const [continueCustom, setContinueCustom] = useState(true);
  const [purpose, setPurpose] = useState("");
  const [to, setTo] = useState([]);
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);

  // Manual mail purposes (from /admin/manual-purposes)
  const [manualPurposes, setManualPurposes] = useState([]);
  const [purposesLoading, setPurposesLoading] = useState(false);

  // Reset form and load purposes every time the modal opens
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setSendError("");
    setSending(false);
    setPlaceholders([]);
    setPlaceholderValues({});
    setAttachment(null);
    setContinueCustom(true);
    setPurpose("");
    setTo([]);
    setCc([]);
    setBcc([]);

    let isMounted = true;

    const loadPurposes = async () => {
      setPurposesLoading(true);
      try {
        const purposesData = await fetchManualPurposes();

        if (isMounted) {
          const rawPurposes = Array.isArray(purposesData)
            ? purposesData
            : purposesData?.data || [];
          setManualPurposes(rawPurposes);

          if (rawPurposes.length > 0) {
            setPurpose((prev) => prev || rawPurposes[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load manual mail purposes:", error);
      } finally {
        if (isMounted) setPurposesLoading(false);
      }
    };

    loadPurposes();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load the placeholders for the selected purpose
  useEffect(() => {
    if (!isOpen || !purpose) return;

    let isMounted = true;

    const loadPlaceholders = async () => {
      setPlaceholdersLoading(true);
      try {
        const list = await fetchPurposePlaceholders(purpose);
        if (!isMounted) return;

        setPlaceholders(list);
        // One empty input per placeholder, prefilled from placeholderData if given
        setPlaceholderValues(
          list.reduce((acc, key) => {
            acc[key] = placeholderData?.[key] ?? "";
            return acc;
          }, {}),
        );
      } catch (error) {
        console.error("Failed to load placeholders:", error);
        if (isMounted) {
          setPlaceholders([]);
          setPlaceholderValues({});
        }
      } finally {
        if (isMounted) setPlaceholdersLoading(false);
      }
    };

    loadPlaceholders();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, purpose]);

  if (!isOpen) return null;

  // Toggle ON: needs purpose + at least one To address on this screen.
  // Toggle OFF: Continue is always enabled; recipients are entered in the Gmail view.
  const filledCount = placeholders.filter((key) =>
    String(placeholderValues[key] ?? "").trim(),
  ).length;
  const allDataFilled =
    !placeholdersLoading && filledCount === placeholders.length;

  const isFormValid = continueCustom
    ? Boolean(purpose) && to.length > 0 && allDataFilled
    : true;

  const isBusy = loading || sending;

  const handleContinue = async () => {
    if (!isFormValid || isBusy) return;

    if (continueCustom) {
      // Toggle ON -> POST /admin/send/custom-email/by-purpose/{purpose}
      try {
        setSending(true);
        setSendError("");

        const res = await sendCustomEmailByPurposeService({
          purpose,
          use_manual_templates: true,
          to,
          cc,
          bcc,
          data: Object.fromEntries(
            placeholders.map((key) => [
              key,
              String(placeholderValues[key] ?? "").trim(),
            ]),
          ),
          attachment,
        });

        onSuccess?.(res);
        onClose?.();
      } catch (err) {
        setSendError(err?.message || "Failed to send email");
      } finally {
        setSending(false);
      }
    } else {
      // Toggle OFF -> open Gmail-style compose
      setStep(2);
    }
  };

  /* ================= STEP 2: Gmail style compose ================= */
  if (step === 2) {
    return (
      <GmailComposeWindow
        loading={loading}
        onClose={onClose}
        initialTo={to}
        initialCc={cc}
        initialBcc={bcc}
        onSend={(data) =>
          onSubmit?.({
            continue_with_custom_mail: false,
            purpose,
            ...data,
          })
        }
      />
    );
  }

  /* ================= STEP 1: Options form ================= */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-poppins font-normal text-[12px] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200">
        {/* --- Header --- */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-2xl text-white">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-[16px] text-black leading-tight font-normal">
                Send Custom Mail
              </h2>
              <p className="text-zinc-400 text-[10px] mt-1 font-normal">
                Choose a purpose and add recipients
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-black cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Content --- */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Continue with custom mail toggle (default ON) */}
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4">
            <div>
              <div className="text-[13px] text-black font-normal">
                Continue with custom mail
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Turn off to compose a new message (Gmail style)
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={continueCustom}
              onClick={() => setContinueCustom((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                continueCustom ? "bg-black" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${
                  continueCustom ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Purpose */}
          <div className={`space-y-1.5 ${continueCustom ? "" : "hidden"}`}>
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
              Purpose<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={loading || purposesLoading}
                className="w-full p-3 pr-10 bg-white rounded-xl border border-zinc-200 outline-none focus:border-black transition-all appearance-none cursor-pointer font-mono disabled:opacity-60 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              >
                {purposesLoading ? (
                  <option value="">Loading purposes...</option>
                ) : manualPurposes.length === 0 ? (
                  <option value="">No purposes available</option>
                ) : (
                  manualPurposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                {purposesLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </div>
          </div>

          {/* Placeholder values + attachment (toggle ON only) */}
          {continueCustom && (
            <>
              {/* ===== DATA AREA: template variables (required) ===== */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] text-black font-normal">
                      Template Data
                      <span className="text-red-500 ml-0.5">*</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Fill in the values that replace the placeholders in this
                      email template.
                    </p>
                  </div>
                  {placeholders.length > 0 && !placeholdersLoading && (
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] ${
                        allDataFilled
                          ? "bg-green-50 text-green-600"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {filledCount}/{placeholders.length} filled
                    </span>
                  )}
                </div>

                {placeholdersLoading ? (
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <Loader2 size={14} className="animate-spin" /> Loading
                    template data fields...
                  </div>
                ) : placeholders.length === 0 ? (
                  <p className="text-[11px] text-zinc-400">
                    {purpose
                      ? "This purpose has no placeholders to fill."
                      : "Select a purpose to load its data fields."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {placeholders.map((key) => (
                      <div key={key} className="space-y-1.5">
                        <label
                          className="flex items-baseline justify-between ml-1 text-[11px] text-zinc-600 font-normal"
                          title={key}
                        >
                          <span>
                            {humanizeKey(key)}
                            <span className="text-red-500 ml-0.5">*</span>
                          </span>
                          <span className="font-mono text-[9px] text-zinc-400">
                            {`{{${key}}}`}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter ${humanizeKey(key).toLowerCase()}`}
                          value={placeholderValues[key] ?? ""}
                          disabled={isBusy}
                          onChange={(e) =>
                            setPlaceholderValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full p-3 bg-white rounded-xl border border-zinc-200 outline-none focus:border-black transition-all text-[12px] font-normal disabled:opacity-60 disabled:bg-zinc-50"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachment */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
                  Attachment
                  <span className="normal-case tracking-normal text-zinc-400 ml-1">
                    (optional)
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl hover:border-black transition-all cursor-pointer">
                    <Paperclip size={14} />
                    <span>{attachment ? "Change file" : "Choose file"}</span>
                    <input
                      type="file"
                      disabled={isBusy}
                      className="hidden"
                      onChange={(e) =>
                        setAttachment(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                  {attachment && (
                    <span className="flex items-center gap-1 bg-zinc-100 rounded-full pl-3 pr-1.5 py-1 text-[11px] max-w-[260px]">
                      <span className="truncate">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="p-0.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-black cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* To / CC / BCC */}
          {/* Only when the toggle is ON; with it OFF these live in the Gmail view */}
          {continueCustom && (
            <>
              <EmailChipInput label="To" required value={to} onChange={setTo} />
              <EmailChipInput label="CC" value={cc} onChange={setCc} />
              <EmailChipInput label="BCC" value={bcc} onChange={setBcc} />
            </>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end items-center gap-4 shrink-0">
          {sendError && (
            <p className="mr-auto text-[11px] text-red-500">{sendError}</p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-6 py-3 text-zinc-500 hover:text-black transition-colors font-normal cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isFormValid || isBusy}
            onClick={handleContinue}
            className="px-10 py-3 bg-black text-white rounded-2xl hover:bg-zinc-800 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-20 shadow-lg font-normal cursor-pointer disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Send size={15} /> {continueCustom ? "Send" : "Continue"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCustomMailModal;
