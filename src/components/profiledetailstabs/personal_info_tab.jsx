import React from "react";
import BasicInfoSection from "../employee_details/basicdetails";
import BankInfoSection from "../employee_details/bankInfopage";
import PersonalInfoSection from "../employee_details/idInformationsection";
import ContactInfoSection from "../employee_details/Contactdetailssection";
import WorkInfoSection from "../employee_details/workInfosection";
import HierarchyInfoSection from "../employee_details/hierarchyInfosection";
import EducationalDetailsSection from "../employee_details/educationaldetailssection";
import DependantDetailsSection from "../employee_details/dependantdetailssection";

export default function PersonalInfoTab({ employee }) {
  return (
    <div className="columns-1 sm:columns-2 gap-4 w-full">
      <div className="break-inside-avoid mb-4">
        <BasicInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <WorkInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <BankInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <PersonalInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <ContactInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <HierarchyInfoSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <EducationalDetailsSection employee={employee} />
      </div>

      <div className="break-inside-avoid mb-4">
        <DependantDetailsSection employee={employee} />
      </div>
    </div>
  );
}
