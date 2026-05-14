import React, { useState } from "react";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiCalendar,
  FiInfo,
  FiBriefcase,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiZap,
  FiSend,
  FiGlobe,
  FiLink,
} from "react-icons/fi";
import { Icon } from "@iconify/react";
import {
  changeApplicationStatus,
  sendHiringInvitation,
  sendRejectionEmail,
} from "../service/hiringService";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const ApplicationDetail = ({ application, onBack }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectMailBtn, setShowRejectMailBtn] = useState(
    application.status === "rejected",
  );
  const [showInviteBtn, setShowInviteBtn] = useState(
    application.status === "process_completed" ||
      application.status === "completion_mail_sent",
  );

  if (!application) return null;

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true);
    const loadingToast = toast.loading(`Updating status...`);
    try {
      const result = await changeApplicationStatus({
        id: application.id,
        status: newStatus,
      });
      if (result.status_code === 200) {
        toast.success("Status Updated", { id: loadingToast });
        application.status = newStatus;
        if (newStatus === "process_completed") {
          setShowInviteBtn(true);
        } else {
          setTimeout(() => onBack(), 1000);
        }
      }
    } catch (err) {
      toast.error("Update failed: Status move not allowed", {
        id: loadingToast,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectStatusUpdate = () => {
    Swal.fire({
      title: "Confirm Rejection?",
      text: "This will update the candidate status to Rejected in the database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#f1f5f9",
      confirmButtonText: "Yes, Reject",
      customClass: {
        popup: "font-poppins rounded-3xl p-6 text-[12px]",
        title: "font-poppins font-bold",
        confirmButton:
          "font-poppins px-6 py-2 rounded-lg font-bold shadow-none",
        cancelButton:
          "font-poppins px-6 py-2 rounded-lg font-bold text-slate-600 shadow-none",
      },
    }).then(async (res) => {
      if (res.isConfirmed) {
        const t = toast.loading("Updating status...");
        try {
          const result = await changeApplicationStatus({
            id: application.id,
            status: "rejected",
          });
          if (result.status_code === 200) {
            toast.success("Status: Rejected", { id: t });
            application.status = "rejected";
            setShowRejectMailBtn(true);
          }
        } catch (e) {
          toast.error("Update failed", { id: t });
        }
      }
    });
  };

  const handleTriggerRejectionMail = async () => {
    const t = toast.loading("Sending rejection email...");
    try {
      const res = await sendRejectionEmail(application.id);
      if (res.status_code === 200) {
        toast.success("Rejection Mail Sent", { id: t });
        setTimeout(() => onBack(), 1200);
      }
    } catch (e) {
      toast.error("Failed to send mail", { id: t });
    }
  };

  const handleSendInvitationMail = async () => {
    const t = toast.loading("Sending invitation...");
    try {
      const res = await sendHiringInvitation(application.id);
      if (res.status_code === 200) {
        toast.success("Invitation Sent!", { id: t });
        application.status = "completion_mail_sent";
      }
    } catch (e) {
      toast.error("Failed to send invitation", { id: t });
    }
  };

  return (
    <div className="font-poppins text-[12px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 bg-[#fbfcfd] p-6 min-h-screen">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8 px-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-medium group"
        >
          <FiArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="uppercase tracking-widest text-[10px] font-bold">
            Back to Enquiries
          </span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 uppercase tracking-[0.2em] text-[9px] font-bold italic">
            Ref ID
          </span>
          <div className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-mono font-bold shadow-lg">
            #{application.id}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Candidate Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12"></div>
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-xl transform rotate-3 italic">
                {application.first_name?.[0]}
                {application.last_name?.[0]}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
                {application.first_name} {application.last_name}
              </h2>
              <div className="inline-block px-3 py-1 bg-blue-50/50 rounded-full">
                <p className="text-blue-600 font-bold uppercase tracking-widest text-[8px]">
                  {application.position_applied}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 space-y-5 text-left">
              {[
                { icon: <FiMail />, value: application.email },
                {
                  icon: <FiPhone />,
                  value: application.mobile || "Not Provided",
                },
                {
                  icon: <FiCalendar />,
                  value: `Applied ${new Date(application.applied_date).toLocaleDateString()}`,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 text-slate-600 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    {React.cloneElement(item.icon, { size: 14 })}
                  </div>
                  <span className="truncate font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Center */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-slate-900 font-extrabold mb-8 flex items-center gap-3 uppercase tracking-tighter text-[11px]">
              <div className="w-1 h-4 bg-amber-400 rounded-full"></div>
              Management Control Center
            </h3>

            <div className="flex flex-wrap gap-4 items-center">
              {application.status === "under_review" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus("shortlisted")}
                    className="flex items-center gap-3 px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95"
                  >
                    <FiCheckCircle size={16} /> Shortlist
                  </button>
                  <button
                    onClick={handleRejectStatusUpdate}
                    className="flex items-center gap-3 px-8 py-3 bg-white border border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all active:scale-95"
                  >
                    <FiXCircle size={16} /> Reject
                  </button>
                </>
              )}

              {application.status === "shortlisted" && (
                <>
                  <button
                    onClick={handleRejectStatusUpdate}
                    className="flex items-center gap-3 px-8 py-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    <FiXCircle size={16} /> Reject Candidate
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("process_completed")}
                    className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-xl transition-all active:scale-95"
                  >
                    <FiZap size={16} /> Move to Complete
                  </button>
                </>
              )}

              {showRejectMailBtn && (
                <button
                  onClick={handleTriggerRejectionMail}
                  className="flex items-center gap-4 px-10 py-4 bg-red-600 text-white rounded-[1.25rem] font-bold shadow-2xl animate-in zoom-in hover:bg-red-700 transition-all"
                >
                  <FiSend size={18} className="transform -rotate-12" /> Send
                  Rejection Mail
                </button>
              )}

              {showInviteBtn && (
                <button
                  disabled={application.status === "completion_mail_sent"}
                  onClick={handleSendInvitationMail}
                  className={`flex items-center gap-4 px-10 py-4 rounded-[1.25rem] font-bold shadow-2xl transition-all ${
                    application.status === "completion_mail_sent"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#0088cc] text-white hover:bg-[#0077b3] animate-in zoom-in"
                  }`}
                >
                  <FiSend size={18} className="transform -rotate-12" />
                  {application.status === "completion_mail_sent"
                    ? "Invitation Delivered"
                    : "Send Hiring Invitation"}
                </button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-slate-900 font-extrabold mb-8 flex items-center gap-3 uppercase tracking-tighter text-[11px]">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Data Integrity & Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  label: "Job Category",
                  value: application.area_of_work,
                  icon: <FiBriefcase />,
                },
                {
                  label: "Engagement Type",
                  value: application.job_type,
                  icon: <FiClock />,
                },
                {
                  label: "Source identity",
                  value: application.source,
                  icon: <FiGlobe />,
                },
                {
                  label: "lifecycle Status",
                  value: application.status?.replace("_", " "),
                  icon: <FiZap />,
                  highlight: true,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-50 bg-slate-50/40 flex items-center justify-between group"
                >
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest mb-1.5 font-poppins">
                      {item.label}
                    </p>
                    <p
                      className={`font-bold text-[12px] ${item.highlight ? "text-blue-600 italic" : "text-slate-700"}`}
                    >
                      {item.value}
                    </p>
                  </div>
                  <div className="text-slate-200 group-hover:text-blue-500 transition-colors">
                    {/* FIXED: Check if icon exists before cloning */}
                    {item.icon && React.cloneElement(item.icon, { size: 18 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <div className="flex items-center gap-2 mb-3">
                <FiInfo className="text-slate-400" size={12} />
                <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest font-poppins">
                  Candidate narrative
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 text-slate-600 italic font-medium border-l-4 border-l-slate-300">
                "{application.description || "No descriptive notes available."}"
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={application.resume_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl group"
              >
                <Icon
                  icon="ph:file-pdf-duotone"
                  className="text-xl group-hover:scale-110 transition-transform"
                />
                <span className="uppercase tracking-widest text-[9px]">
                  Open Resume attachment
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
