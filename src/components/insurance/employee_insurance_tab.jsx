import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  fetchEmployeeInsuranceDetails,
  fetchInsuranceProviders,
  fetchInsuranceTypes,
  fetchInsuranceCoverageTypes,
} from "../../service/insuranceservice";

import { saveEmployeeInsuranceUpdate } from "../../service/insurance";

import EmployeeInfoCard from "./sections/employeeunfocard";
import InsuranceDetailsForm from "./sections/insurancedetailsform";
import BeneficiaryDetailsCard from "./sections/beneficiarydetailscard";
import DependentsCoveredCard from "./sections/dependentscoveredcard";
import InsuranceDocumentCard from "./sections/insurancedocumentcard";
import ClaimInformationCard from "./sections/claimInformation_card";
import AuditInformationCard from "./sections/auditInformation_card";
import GlowButton from "../../components/helpers/glowbutton";

export default function EmployeeInsuranceTab({
  uuid: propUuid,
  employeeImage,
}) {
  const params = useParams();
  const uuid = propUuid || params.uuid || params.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);

  const [claims, setClaims] = useState([]);
  const [providers, setProviders] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [coverageTypes, setCoverageTypes] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [policyRecordId, setPolicyRecordId] = useState(0);

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
  });

  const handleRefreshDropdowns = async () => {
    try {
      const [providersData, typesData, coverageData] = await Promise.all([
        fetchInsuranceProviders().catch(() => []),
        fetchInsuranceTypes().catch(() => []),
        fetchInsuranceCoverageTypes().catch(() => []),
      ]);
      if (providersData) setProviders(providersData);
      if (typesData) setInsuranceTypes(typesData);
      if (coverageData) setCoverageTypes(coverageData);
    } catch (error) {
      console.error(
        "❌ Failed to refresh insurance system configurations details:",
        error,
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!uuid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const [insuranceData, providersData, typesData, coverageData] =
          await Promise.all([
            fetchEmployeeInsuranceDetails(uuid),
            fetchInsuranceProviders().catch(() => []),
            fetchInsuranceTypes().catch(() => []),
            fetchInsuranceCoverageTypes().catch(() => []),
          ]);

        if (providersData) setProviders(providersData);
        if (typesData) setInsuranceTypes(typesData);
        if (coverageData) setCoverageTypes(coverageData);

        if (insuranceData) {
          setEmployeeInfo(insuranceData.employee);
          setBeneficiaries(insuranceData.beneficiaries || []);
          setDependents(insuranceData.dependents || []);
          setClaims(insuranceData.claims || []);
          setAuditData(insuranceData.audit_information || []);
          setDocuments(insuranceData.documents || []);

          const ins = insuranceData.insurance || {};
          setPolicyRecordId(ins.id || 0);

          setFormData({
            insuranceProvider: ins.provider_id || "",
            policyNumber: ins.policy_number || "",
            insuranceType: ins.insurance_type_id || "",
            coverageType: ins.coverage_type_id || "",
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
              ? `${ins.renewal_reminder_days}`
              : "",
            policyStatus: ins.policy_status || "",
            notes: ins.notes || "",
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

  const cleanNumericString = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/[₹\s,]/g, "");
    return Number(cleanStr) || 0;
  };

  const handleDocumentChange = (updatedDocs, freshlySelectedFiles = []) => {
    setDocuments(updatedDocs);
    if (freshlySelectedFiles.length > 0) {
      setRawFiles((prev) => [...prev, ...freshlySelectedFiles]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const premium = cleanNumericString(formData.premiumAmount);
      let companyShare = cleanNumericString(formData.companyContribution);
      let employeeShare = cleanNumericString(formData.employeeContribution);

      if (formData.premiumPaidBy === "Company") {
        companyShare = premium;
        employeeShare = 0;
      } else if (formData.premiumPaidBy === "Employee") {
        companyShare = 0;
        employeeShare = premium;
      }

      if (premium > 0 && companyShare + employeeShare !== premium) {
        toast.error(
          `Premium allocation fault! Company Share (${companyShare}) + Employee Share (${employeeShare}) must equal Total Premium (${premium}).`,
        );
        setSaving(false);
        return false;
      }

      if (beneficiaries.length > 0) {
        const totalAllocation = beneficiaries.reduce(
          (sum, b) => sum + (Number(b.allocation_percentage) || 0),
          0,
        );
        if (totalAllocation !== 100) {
          toast.error(
            `Invalid beneficiary configurations! Total shares equal ${totalAllocation}%, but must sum up to exactly 100%.`,
          );
          setSaving(false);
          return false;
        }
      }

      const insurancePayload = {
        ...(policyRecordId && policyRecordId !== 0
          ? { id: policyRecordId }
          : {}),
        staff_id: employeeInfo?.staff_id || uuid,

        ...(formData.insuranceProvider && !isNaN(formData.insuranceProvider)
          ? { provider_id: Number(formData.insuranceProvider) }
          : {}),
        ...(formData.insuranceType && !isNaN(formData.insuranceType)
          ? { insurance_type_id: Number(formData.insuranceType) }
          : {}),
        ...(formData.coverageType && !isNaN(formData.coverageType)
          ? { coverage_type_id: Number(formData.coverageType) }
          : {}),

        policy_number: formData.policyNumber,
        sum_insured: cleanNumericString(formData.sumInsured),
        premium_amount: premium,
        premium_paid_by: formData.premiumPaidBy,
        company_contribution: companyShare,
        employee_contribution: employeeShare,
        policy_start_date: formData.policyStartDate
          ? `${formData.policyStartDate}T00:00:00Z`
          : null,
        policy_end_date: formData.policyEndDate
          ? `${formData.policyEndDate}T00:00:00Z`
          : null,
        renewal_reminder_days: parseInt(formData.renewalReminder) || 30,
        notes: formData.notes,

        beneficiaries: beneficiaries.map((b) => ({
          ...(b.id && b.id !== 0 ? { id: b.id } : {}),
          beneficiary_name: b.beneficiary_name,
          relationship: b.relationship,
          contact_number: b.contact_number,
          email: b.email,
          allocation_percentage: Number(b.allocation_percentage) || 0,
          is_primary: !!b.is_primary,
        })),

        dependents: dependents.map((d) => ({
          ...(d.id && d.id !== 0 ? { id: d.id } : {}),
          dependent_name: d.dependent_name,
          relationship: d.relationship,
          date_of_birth: d.date_of_birth
            ? d.date_of_birth.includes("T")
              ? d.date_of_birth
              : `${d.date_of_birth}T00:00:00Z`
            : null,
          is_covered: !!d.is_covered,
        })),

        documents: documents
          .filter((doc) => doc.file_url || (doc.id && doc.id !== 0))
          .map((doc) => ({
            ...(doc.id && doc.id !== 0 ? { id: doc.id } : {}),
            document_name: doc.document_name,
            file_url: doc.file_url || "",
          })),
      };

      await saveEmployeeInsuranceUpdate(insurancePayload, rawFiles);
      toast.success("Insurance configurations synchronized successfully!");
      setRawFiles([]);
      return true;
    } catch (error) {
      console.error("❌ Submission Sync Failure:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to finalize updates.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 text-sm">
        Loading insurance data...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 font-poppins">
      <EmployeeInfoCard
        uuid={uuid}
        employeeInfo={employeeInfo}
        finalImageSrc={finalImageSrc}
      />

      {/* Primary Section: Flexbox Height Matching Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
        <div className="lg:col-span-2 flex flex-col h-full">
          <InsuranceDetailsForm
            formData={formData}
            handleChange={handleChange}
            providers={providers}
            insuranceTypes={insuranceTypes}
            coverageTypes={coverageTypes}
            onRefreshDropdowns={handleRefreshDropdowns}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        <div className="flex flex-col gap-3 justify-between h-full">
          <BeneficiaryDetailsCard
            beneficiaries={beneficiaries}
            setBeneficiaries={setBeneficiaries}
            onSave={handleSave}
            saving={saving}
          />
          <DependentsCoveredCard
            dependents={dependents}
            setDependents={setDependents}
            onSave={handleSave}
            saving={saving}
          />
          <InsuranceDocumentCard
            documentData={documents}
            onDocumentChange={handleDocumentChange}
            onSave={handleSave}
            saving={saving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <ClaimInformationCard claims={claims} />
        </div>
        <div className="flex flex-col justify-between">
          <AuditInformationCard auditData={auditData} />

          <div className="flex justify-end pt-4">
            <GlowButton onClick={handleSave} disabled={saving}>
              {saving ? "Synchronizing Data..." : "Save Adjustments"}
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
