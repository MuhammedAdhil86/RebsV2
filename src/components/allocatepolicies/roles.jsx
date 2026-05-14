import React, { useEffect, useState } from "react";
import { fetchRoles, allocateRolesData } from "../../service/companyService";
import toast, { Toaster } from "react-hot-toast";

const Roles = ({ employeeUuid, employees }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  console.log("roles of employee", employees.user_type);

  useEffect(() => {
    const getRoles = async () => {
      try {
        const roleData = await fetchRoles();
        setRoles(roleData); // Assuming `roleData` is an array of roles
        setLoading(false);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setLoading(false);
      }
    };
    getRoles();
  }, []);

  const handleSelectRole = (e) => {
    const roleName = e.target.value;
    if (roleName !== "Select Role") {
      const role = roles.find((role) => role.name === roleName);
      setSelectedRole(role);
    } else {
      setSelectedRole(null);
    }
  };

  const handleRemoveRole = () => {
    setSelectedRole(null);
  };

  const handleAllocateRole = async () => {
    if (!selectedRole || !employeeUuid) return;

    setAllocating(true);
    try {
      const rolesData = { user_type: selectedRole.id };
      await allocateRolesData(employeeUuid, rolesData);
      toast.success("Role allocated successfully");
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to allocate role.");
      console.error("Error allocating role:", error);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2 text-black">
        Allocate a Role
      </label>
      <div className="flex">
        {loading ? (
          <p>Loading roles...</p>
        ) : (
          <select
            id="roles"
            className="w-full text-black bg-gray-200 p-2 rounded-lg focus:outline-none"
            onChange={handleSelectRole}
            value={selectedRole?.name || "Select Role"}
          >
            <option>Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedRole && (
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="bg-gray-200 text-black p-2 rounded flex items-center gap-2">
            <span>{selectedRole.name}</span>
            <button onClick={handleRemoveRole} className="text-red-500">
              &#10005;
            </button>
          </div>
        </div>
      )}

      <button
        className="bg-black text-white px-4 py-2 mt-2 w-[25%] rounded-lg"
        onClick={handleAllocateRole}
        disabled={!selectedRole || allocating}
      >
        {allocating ? "Allocating..." : "Allocate"}
      </button>

      <div className="mt-4 text-black bg-slate-200 p-3 rounded">
      <strong>  Allocated Role:</strong>
  {employees?.user_type ? (
    <ul className="list-disc list-inside text-black">
      <li>{employees.user_type}</li>
    </ul>
  ) : (
    <p className="text-gray-600">No roles allocated yet.</p>
  )}
</div>



      <Toaster />
    </div>
  );
};

export default Roles;
