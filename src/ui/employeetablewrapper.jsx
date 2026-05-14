import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import EmployeeTable from "../components/tables/employeetable";
import useEmployeeStore from "../store/employeeStore";
import { fetchAllEmployees } from "../service/totalEmployeeService";

const EmployeeTableWrapper = () => {
  const { employees, selectedDay, setEmployees } = useEmployeeStore();

  // ✅ Updated to v5 object syntax
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", selectedDay],
    queryFn: () => fetchAllEmployees(selectedDay),
    enabled: !!selectedDay,
  });

  useEffect(() => {
    if (data) {

      setEmployees(data);
    }
  }, [data, setEmployees]);

  if (isLoading) return <div>Loading employees...</div>;
  if (isError) return <div>Error loading employees</div>;

  return <EmployeeTable employees={employees} />;
};

export default EmployeeTableWrapper;
