import React, { useEffect, useState } from "react";
import UniversalTable from "../../../ui/universal_table";
import { getDesignationData } from "../../../service/companyService";

const DesignationView = () => {
  const [designationData, setDesignationData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Columns definition
  const columns = [
    {
      key: "name",
      label: "Designation Name",
      render: (value) => (
        <div title={value}>
          {value ? (value.length > 25 ? value.slice(0, 25) + "..." : value) : "N/A"}
        </div>
      ),
    },
    {
      key: "code",
      label: "Designation Code",
      render: (value) => <div>{value || "N/A"}</div>,
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <div>{value || "N/A"}</div>,
    },
    {
      key: "createdon",
      label: "Created On",
      render: (value) =>
        value ? new Date(value).toLocaleString() : "N/A",
    },
  ];

  useEffect(() => {
    const fetchDesignations = async () => {
      setLoading(true);
      try {
        const response = await getDesignationData();


        const data = response.map(
          ({ name, code, email, createdon }) => ({
            name: name || "N/A",
            code: code || "N/A",
            email: email || "N/A",
            createdon: createdon || "N/A",
          })
        );

        setDesignationData(data);
      } catch (error) {
        console.error("Error fetching designation data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesignations();
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        Designations
      </h2>

      {loading ? (
        <div className="text-gray-500 text-center py-10">Loading...</div>
      ) : (
        <UniversalTable
          columns={columns}
          data={designationData}
          rowsPerPage={6}
          rowClickHandler={(row) =>
            console.log("Clicked Designation:", row)
          }
        />
      )}
    </div>
  );
};

export default DesignationView;
