import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  fetchEmployeePolicy,
  allocateLeavePolicy,
} from "../../../service/policiesService";
import { fetchAllLeavePolicy } from "../../../service/companyService";
import toast from "react-hot-toast";

export default function LeavesSettings({ uuid }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [policyData, setPolicyData] = useState({
    firstName: "No Policy",
    extraCount: 0,
    allNames: [],
    annualLeave: 0,
  });

  const [allPolicies, setAllPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [empPolicyRes, allPoliciesRes] = await Promise.all([
          fetchEmployeePolicy(uuid),
          fetchAllLeavePolicy(),
        ]);

        if (empPolicyRes) {
          const count = empPolicyRes.count || 0;
          const mainPolicy = empPolicyRes.policy || {};
          const policiesList =
            empPolicyRes.policies || (mainPolicy.name ? [mainPolicy] : []);

          setPolicyData({
            firstName: mainPolicy.name || "No Policy",
            extraCount: count > 1 ? count - 1 : 0,
            allNames: policiesList.map((p) => p.name),
            annualLeave: mainPolicy.annual_leave || 0,
          });

          if (mainPolicy.id) {
            setSelectedPolicyId(String(mainPolicy.id));
          }
        }

        setAllPolicies(allPoliciesRes || []);
      } catch (error) {
        console.error("Error loading leave data:", error);
        toast.error("Failed to load leave settings");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) loadData();
  }, [uuid]);

  const handleSave = async () => {
    if (!selectedPolicyId) return;
    setSaving(true);
    try {
      const payload = {
        leave_policy_id: Number(selectedPolicyId),
        staff_ids: [String(uuid)],
      };

      await allocateLeavePolicy(payload);
      toast.success("Policy updated successfully");

      const updated = await fetchEmployeePolicy(uuid);
      if (updated) {
        const main = updated.policy || {};
        setPolicyData((prev) => ({
          ...prev,
          firstName: main.name || prev.firstName,
          extraCount: (updated.count || 1) - 1,
          annualLeave: main.annual_leave || 0,
        }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Backend 400 Detail:", error.response?.data);
      toast.error("Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-5 animate-pulse bg-white rounded-xl border h-32 w-full" />
    );

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 w-full font-poppins">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-gray-900 text-[14px]">
          Leaves and Vacation
        </h3>
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="text-[12px] font-normal text-gray-400"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[12px] font-normal text-blue-600"
            >
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 hover:bg-gray-50 rounded-md"
          >
            <Icon icon="basil:edit-outline" className="w-5 h-5 text-gray-800" />
          </button>
        )}
      </div>

      <div className="space-y-0 text-[12px] font-normal">
        <div className="flex justify-between items-center py-4 border-b border-gray-50">
          <span className="text-gray-500 font-normal">Leave Policy</span>

          {isEditing ? (
            <select
              className="border rounded px-2 py-1 text-[12px] font-normal bg-white outline-none"
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
            >
              <option value="">Select a Policy</option>
              {allPolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative group flex items-center gap-1">
              <span className="text-gray-900 font-normal">
                {policyData.firstName}
              </span>

              {policyData.extraCount > 0 && (
                <div className="relative">
                  <span className="text-blue-600 font-normal cursor-help bg-blue-50 px-1.5 py-0.5 rounded text-[12px]">
                    +{policyData.extraCount}
                  </span>

                  {/* Tooltip on Hover */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-[12px] font-normal rounded p-2 shadow-lg min-w-[140px]">
                      <p className="border-b border-gray-700 pb-1 mb-1 font-normal text-blue-400">
                        Other Policies
                      </p>
                      {policyData.allNames.length > 1 ? (
                        policyData.allNames.slice(1).map((name, i) => (
                          <div key={i} className="py-0.5 opacity-90">
                            • {name}
                          </div>
                        ))
                      ) : (
                        <div className="py-0.5 opacity-90">
                          View details in policy manager
                        </div>
                      )}
                      <div className="absolute top-full right-4 border-8 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center py-4">
          <span className="text-gray-500 font-normal">Vacation</span>
          <span className="text-gray-900 font-normal">
            {policyData.annualLeave} days
          </span>
        </div>
      </div>
    </div>
  );
}
