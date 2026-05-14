import React, { useState } from "react";
import TabsSwitch from "../../ui/tabswitch";

import AddBranchForm from "./corganizational_structure_tab/addbranchform";
import AddDivisionForm from "./corganizational_structure_tab/adddivisionform";
import AddDepartmentForm from "./corganizational_structure_tab/adddepartmentform";
import AddDesignationForm from "./corganizational_structure_tab/adddesignationform";

import BranchView from "./viewdata/branchview";
import DepartmentView from "./viewdata/departmentview";
import DesignationView from "./viewdata/designationview";

const OrganizationalStructure = () => {
  const [showAdded, setShowAdded] = useState(false);

  const tabs = [
    { id: "branch", label: "Add Branch" },
    { id: "division", label: "Add Division" },
    { id: "department", label: "Add Department" },
    { id: "designation", label: "Add Designation" },
  ];

  const renderTabContent = (activeTab) => {
    return (
      <>
        {/* -------- BRANCH -------- */}
        {activeTab === "branch" && (
          <>
            <AddBranchForm />
            {showAdded && <BranchView />}
          </>
        )}

        {/* -------- DIVISION -------- */}
        {activeTab === "division" && (
          <>
            <AddDivisionForm />
            {showAdded && (
              <div className="text-gray-500 text-center py-10">
                Division Table Coming Soon...
              </div>
            )}
          </>
        )}

        {/* -------- DEPARTMENT -------- */}
        {activeTab === "department" && (
          <>
            <AddDepartmentForm />
            {showAdded && <DepartmentView />}
          </>
        )}

        {/* -------- DESIGNATION -------- */}
        {activeTab === "designation" && (
          <>
            <AddDesignationForm />
            {showAdded && <DesignationView />}
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <TabsSwitch
          tabs={tabs}
          initialTab="branch"
          renderTabContent={renderTabContent}
          extraButtons={(activeTab) => (
            <button
              onClick={() => setShowAdded((prev) => !prev)}
              className={`px-3 h-[30px] text-xs rounded-md border  transition-all flex items-center justify-center`}
            >
              {showAdded
                ? "Hide Added"
                : activeTab === "branch"
                  ? "Added Branches"
                  : activeTab === "division"
                    ? "Added Divisions"
                    : activeTab === "department"
                      ? "Added Departments"
                      : "Added Designations"}
            </button>
          )}
        />
      </div>
    </div>
  );
};

export default OrganizationalStructure;
