import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchEmployeeInsuranceDetails } from "../../service/insuranceservice";

// Import modular sections
import EmployeeInfoCard from "./sections/employeeunfocard";
import InsuranceDetailsForm from "./sections/InsuranceDetailsForm";
import BeneficiaryDetailsCard from "./sections/BeneficiaryDetailsCard";
import DependentsCoveredCard from "./sections/DependentsCoveredCard";
import InsuranceDocumentCard from "./sections/insurancedocumentcard";
import ClaimInformationCard from "./sections/claiminformationcard";
import AuditInformationCard from "./sections/auditinformationcard";
import InsuranceFormActions from "./sections/insuranceformactions";

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
    const loadInsuranceData = async () => {
      if (!uuid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchEmployeeInsuranceDetails(uuid);
        if (data) {
          setEmployeeInfo(data.employee);
          setDependents(data.dependents || []);
          setClaims(data.claims || []);

          const ins = data.insurance || {};
          const primaryBeneficiary = data.beneficiaries?.[0] || {};

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
        console.error("❌ Failed to load employee insurance details:", error);
        toast.error("Failed to fetch employee insurance details.");
      } finally {
        setLoading(false);
      }
    };

    loadInsuranceData();
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

      {/* Bottom Section: Claim Information matching Insurance Details width (span 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2 space-y-2">
          <ClaimInformationCard claims={claims} />
        </div>
        <div className="space-y-2">
          <AuditInformationCard />
        </div>
      </div>
    </div>
  );
}
