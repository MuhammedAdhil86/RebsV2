import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchEmployeeInsuranceDetails,
  fetchInsuranceProviders,
  fetchInsuranceTypes,
  fetchInsuranceCoverageTypes, // 👈 Imported coverage types service
} from "../../service/insuranceservice";

// Import modular sections
import EmployeeInfoCard from "./sections/employeeunfocard";
import InsuanceDetailsForm from "./sections/insurancedetailsform";
import BeneficiaryDetailsCard from "./sections/beneficiarydetailscard";
import DependensCovearedCard from "./sections/dependentscoveredcard";
import InsuranceDocumentCard from "./sections/insurancedocumentcard";
import ClaimInformationCard from "./sections/claimInformationcard";
import AuditInformationCard from "./sections/auditinformationcard";
import GlowButton from "../ui/glowbutton";

export default function EmployeeInsuranceTab({
  uuid: propUuid,
  employeeImage,
}) {
  const params = useParams();
  const uuid = propUuid || params.uuid || params.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [claims, setClaims] = useState([]);
  const [providers, setProviders] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [coverageTypes, setCoverageTypes] = useState([]); // 🛡️ State to store coverage types

  const [formData, setFormData] = useState({
    insuranceProvider: "",
    policyNumber: "",
    insuranceType: "",
    coverageType: "",
    sumInsured: "",
    premiumAmount: "",
    premiumPaidBy: "",
    companyContribution: "",
    employeeContribution: "",
    policyStartDate: "",
    policyEndDate: "",
    coverageDuration: "365 Days",
    renewalReminder: "",
    policyStatus: "",
    notes: "",
    beneficiaryName: "",
    relationship: "",
    contactNumber: "",
    email: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!uuid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // Fetch employee details, providers, types, and coverage types concurrently
        const [insuranceData, providersData, typesData, coverageData] =
          await Promise.all([
            fetchEmployeeInsuranceDetails(uuid),
            fetchInsuranceProviders().catch(() => []),
            fetchInsuranceTypes().catch(() => []),
            fetchInsuranceCoverageTypes().catch(() => []), // 🛡️ Fallback array if coverage types fail
          ]);

        if (providersData) {
          setProviders(providersData);
        }

        if (typesData) {
          setInsuranceTypes(typesData);
        }

        if (coverageData) {
          setCoverageTypes(coverageData); // 🛡️ Set coverage types state
        }

        if (insuranceData) {
          setEmployeeInfo(insuranceData.employee);
          setDependents(insuranceData.dependents || []);
          setClaims(insuranceData.claims || []);

          const ins = insuranceData.insurance || {};
          const primaryBeneficiary = insuranceData.beneficiaries?.[0] || {};

          setFormData({
            insuranceProvider: ins.provider_name || "",
            policyNumber: ins.policy_number || "",
            insuranceType: ins.insurance_type || "",
            coverageType: ins.coverage_type || "",
            sumInsured: ins.sum_insured ? `₹ ${ins.sum_insured}` : "",
            premiumAmount: ins.premium_amount ? `₹ ${ins.premium_amount}` : "",
            premiumPaidBy: ins.premium_paid_by || "",
            companyContribution: ins.company_contribution
              ? `₹ ${ins.company_contribution}`
              : "",
            employeeContribution: ins.employee_contribution
              ? `₹ ${ins.employee_contribution}`
              : "",
            policyStartDate: ins.policy_start_date
              ? ins.policy_start_date.split("T")[0]
              : "",
            policyEndDate: ins.policy_end_date
              ? ins.policy_end_date.split("T")[0]
              : "",
            coverageDuration: "365 Days",
            renewalReminder: ins.renewal_reminder_days
              ? `${ins.renewal_reminder_days} Days`
              : "",
            policyStatus: ins.policy_status || "",
            notes: ins.notes || "",
            beneficiaryName: primaryBeneficiary.beneficiary_name || "",
            relationship: primaryBeneficiary.relationship || "",
            contactNumber: primaryBeneficiary.contact_number || "",
            email: primaryBeneficiary.email || "",
          });
        }
      } catch (error) {
        console.error("❌ Failed to load employee insurance data:", error);
        toast.error("Failed to fetch employee insurance details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [uuid]);

  const backendBaseUrl = "https://rebs.blr1.digitaloceanspaces.com/";
  const rawImage = employeeImage || employeeInfo?.image;
  const finalImageSrc = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${backendBaseUrl}${rawImage.startsWith("/") ? rawImage.slice(1) : rawImage}`
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success("Insurance details saved successfully!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 text-sm">
        Loading insurance data...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Employee Info Section */}
      <EmployeeInfoCard
        uuid={uuid}
        employeeInfo={employeeInfo}
        finalImageSrc={finalImageSrc}
      />

      {/* Main Grid: Left Form Details & Right Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Column (Span 2): Insurance Details Form */}
        <div className="lg:col-span-2 space-y-2">
          <InsuranceDetailsForm
            formData={formData}
            handleChange={handleChange}
            providers={providers}
            insuranceTypes={insuranceTypes}
            coverageTypes={coverageTypes} // 🛡️ Passed coverage types array here
          />
        </div>

        {/* Right Column (Span 1): Beneficiary, Dependents & Insurance Document */}
        <div className="space-y-2">
          <BeneficiaryDetailsCard
            formData={formData}
            handleChange={handleChange}
          />
          <DependentsCoveredCard dependents={dependents} />
          <InsuranceDocumentCard />
        </div>
      </div>

      {/* Bottom Section: Claim Information (span 2) & Audit Information (span 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2 space-y-2">
          <ClaimInformationCard claims={claims} />
        </div>
        <div className="space-y-2">
          <AuditInformationCard />
        </div>
      </div>

      {/* Bottom Right Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg shadow-sm">
        {/* Cancel Button: White BG with Black Border */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-white border border-black text-black rounded-lg text-xs font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        {/* Save Insurance Button: GlowButton Component */}
        <GlowButton onClick={handleSave}>Save Insurance</GlowButton>
      </div>
    </div>
  );
}
