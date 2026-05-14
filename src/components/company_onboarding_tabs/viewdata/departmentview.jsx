import React, { useEffect, useState } from "react";
import UniversalTable from "../../../ui/universal_table";
import { getDepartmentData } from "../../../service/companyService";

const DepartmentView = () => {
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Columns definition
  const columns = [
    {
      key: "name",
      label: "Department Name",
      render: (value) => (
        <div title={value}>
          {value ? (value.length > 30 ? value.slice(0, 30) + "..." : value) : "Not Available"}
        </div>
      ),
    },
    {
      key: "parent",
      label: "Parent Department",
      render: (value) => <div>{value || "Not Available"}</div>,
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <div>{value || "Not Available"}</div>,
    },
    {
      key: "createdon",
      label: "Created On",
      render: (value) =>
        value ? new Date(value).toLocaleString() : "Not Available",
    },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const data = await getDepartmentData();


        // Keep only name, parent, email, createdon and replace null/empty with "Not Available"
        const cleanedData = data.map(
          ({ name, parent, email, createdon }) => ({
            name: name || "Not Available",
            parent: parent || "Not Available",
            email: email || "Not Available",
            createdon: createdon || "Not Available",
          })
        );

        setDepartmentData(cleanedData);
      } catch (error) {
        console.error("Error fetching department data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        Departments
      </h2>

      {loading ? (
        <div className="text-gray-500 text-center py-10">Loading...</div>
      ) : (
        <UniversalTable
          columns={columns}
          data={departmentData}
          rowsPerPage={6}
      
        />
      )}
    </div>
  );
};

export default DepartmentView;
