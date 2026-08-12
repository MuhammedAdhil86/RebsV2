import React, { useState } from "react";
import {
  fetchEmployeeReferenceNo,
  editEmployeeReferenceNo,
  createEmployeeReferenceNo,
} from "../../../service/employeeService";
import ConfigView from "../../employeereferenceview";
import CreateConfig from "../../../ui/createemployeereference";

const EmployeeCodeConfig = () => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="w-full font-poppins font-normal">
      {isCreating ? (
        <CreateConfig
          createApi={createEmployeeReferenceNo}
          onSuccess={() => setIsCreating(false)}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <ConfigView
          fetchApi={fetchEmployeeReferenceNo}
          updateApi={editEmployeeReferenceNo}
          onCreateClick={() => setIsCreating(true)}
        />
      )}
    </div>
  );
};

export default EmployeeCodeConfig;
