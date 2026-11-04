import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  fetchEmployeeInsuranceDetails,
  fetchInsuranceProviders,
  fetchInsuranceTypes,
  fetchInsuranceCoverageTypes,
} from "../../service/insuranceservice";
import {
  saveEmployeeInsuranceUpdate,
  cancelEmployeeInsurance,
} from "../../service/insurance";
import { getActiveUsersLight } from "../../service/employeeService";

import EmployeeInfoCard from "./sections/employeeunfocard";
import InsuranceDetailsForm from "./sections/insurancedetailsform";
import BeneficiaryDetailsCard from "./sections/beneficiarydetailscard";
import DependentsCoveredCard from "./sections/dependentscoveredcard";
import InsuranceDocumentCard from "./sections/insurancedocumentcard";
import ClaimInformationCard from "./sections/claimInformation_card";
import AuditInformationCard from "./sections/auditInformation_card";
import GlowButton from "../../components/helpers/glowbutton";

/**
 * Normalizes an API response into a plain array.
 * Handles: [..], { data: [..] }, { results: [..] }, { providers: [..] },
 * { items: [..] }, { data: { results: [..] } }, null, undefined.
 */
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const candidates = [value.data, value.results, value.providers, value.items];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object") {
      const nested = toArray(c);
      if (nested.length) return nested;
    }
  }
  return [];
};

// Pulls the message the backend sent, in the common response shapes
const getBackendError = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (
    data?.message ||
    data?.error ||
    (Array.isArray(data?.errors) ? data.errors.join(", ") : data?.errors) ||
    error?.message ||
    "Something went wrong."
  );
};

export default function EmployeeInsuranceTab({
  uuid: propUuid,
  employeeImage,
  listEmployee: listEmployeeProp,
}) {
  const params = useParams();
  const uuid = propUuid || params.uuid || params.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Employee record from the light API (router state first, API lookup as fallback)
  const [listEmployee, setListEmployee] = useState(listEmployeeProp || null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [claims, setClaims] = useState([]);
  const [providers, setProviders] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [coverageTypes, setCoverageTypes] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [policyRecordId, setPolicyRecordId] = useState(0);

  const [formData, setFormData] = useState({
    id: "",
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
      // Always store arrays so child components can safely .map()
      setProviders(toArray(providersData));
      setInsuranceTypes(toArray(typesData));
      setCoverageTypes(toArray(coverageData));
    } catch (error) {
      console.error(
        "❌ Failed to refresh insurance system configurations details:",
        error,
      );
    }
  };

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

      // Always store arrays so child components can safely .map()
      setProviders(toArray(providersData));
      setInsuranceTypes(toArray(typesData));
      setCoverageTypes(toArray(coverageData));

      if (insuranceData) {
        setEmployeeInfo(insuranceData.employee);
        setBeneficiaries(insuranceData.beneficiaries || []);
        setDependents(insuranceData.dependents || []);
        setClaims(insuranceData.claims || []);
        setAuditData(insuranceData.audit_information || []);
        setDocuments(insuranceData.documents || []);

        const ins = insuranceData.insurance || {};
        const activePolicyId = ins.id || 0;
        setPolicyRecordId(activePolicyId);

        setFormData({
          id: activePolicyId,
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
      toast.error(getBackendError(error));
    } finally {
      setLoading(false);
    }
  };

  // Employee info: use router state if present, otherwise look it up in the light API
  useEffect(() => {
    if (listEmployeeProp) {
      setListEmployee(listEmployeeProp);
      return;
    }
    if (!uuid) return;

    let cancelled = false;
    (async () => {
      try {
        const list = await getActiveUsersLight();
        const found = (Array.isArray(list) ? list : []).find(
          (u) =>
            String(u.uuid) === String(uuid) || String(u.id) === String(uuid),
        );
        if (!cancelled) setListEmployee(found || null);
      } catch (err) {
        console.error("❌ Failed to load employee from light API:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uuid, listEmployeeProp]);

  useEffect(() => {
    loadData();
  }, [uuid]);

  // Handler for PATCH cancellation endpoint
  const handleCancelPolicy = async (insuranceId) => {
    const targetId = insuranceId || policyRecordId;
    if (!targetId || targetId === 0) {
      toast.error("Invalid insurance policy ID.");
      return;
    }

    try {
      setSaving(true);
      await cancelEmployeeInsurance(targetId);
      toast.success("Insurance policy cancelled successfully!");

      // Update status badge UI dynamically
      setFormData((prev) => ({
        ...prev,
        policyStatus: "Cancelled",
      }));

      // Reload fresh state from backend
      await loadData();
    } catch (error) {
      console.error("❌ Cancellation Failure:", error);
      toast.error(getBackendError(error));
    } finally {
      setSaving(false);
    }
  };

  // Photo from the light list first, then the details API.
  // Empty string -> EmployeeInfoCard shows the first-letter avatar.
  const backendBaseUrl = "https://rebs.blr1.digitaloceanspaces.com/";
  const rawImage = employeeImage || listEmployee?.image || employeeInfo?.image;
  const finalImageSrc = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${backendBaseUrl}${rawImage.startsWith("/") ? rawImage.slice(1) : rawImage}`
    : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cleanNumericString = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/[₹\s,]/g, "");
    return Number(cleanStr) || 0;
  };

  // The card sends the full list; each new/replaced doc carries its own File
  const handleDocumentChange = (updatedDocs) => {
    setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const premium = cleanNumericString(formData.premiumAmount);
      let companyShare = cleanNumericString(formData.companyContribution);
      let employeeShare = cleanNumericString(formData.employeeContribution);

      // Auto-fill shares (calculation only, no front-end validation)
      if (formData.premiumPaidBy === "Company") {
        companyShare = premium;
        employeeShare = 0;
      } else if (formData.premiumPaidBy === "Employee") {
        companyShare = 0;
        employeeShare = premium;
      }

      // Files are taken straight from the documents list (same order as payload)
      const filesToUpload = documents
        .filter((doc) => doc.file instanceof File)
        .map((doc) => doc.file);

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

        // No filter: new uploads (id 0, no file_url) must be included too
        documents: documents.map((doc) => ({
          ...(doc.id && doc.id !== 0 ? { id: doc.id } : {}),
          document_name: doc.document_name,
          file_url: doc.file_url || "",
        })),
      };

      await saveEmployeeInsuranceUpdate(insurancePayload, filesToUpload);
      toast.success("Insurance configurations synchronized successfully!");

      // Quietly refresh documents so File objects are replaced by saved records
      // (prevents re-uploading the same files on the next save)
      try {
        const fresh = await fetchEmployeeInsuranceDetails(uuid);
        setDocuments(fresh?.documents || []);
      } catch (refreshError) {
        console.error(
          "❌ Failed to refresh documents after save:",
          refreshError,
        );
      }

      return true;
    } catch (error) {
      console.error("❌ Submission Sync Failure:", error);
      // Show only what the backend says
      toast.error(getBackendError(error));
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
        listEmployee={listEmployee}
        finalImageSrc={finalImageSrc}
      />

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
            onCancelPolicy={handleCancelPolicy}
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
