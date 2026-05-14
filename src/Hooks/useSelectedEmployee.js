import useEmployeeStore from "../store/employeeStore";

export const useSelectedEmployee = () => {
  const selectedEmployee = useEmployeeStore((state) => state.selectedEmployee);
  const setSelectedEmployee = useEmployeeStore((state) => state.setSelectedEmployee);
  return { selectedEmployee, setSelectedEmployee };
};
