import React, { useState, useEffect } from 'react'
import { changeAttendanceReq } from '../../service/companyService'
import {toast,Toaster } from 'react-hot-toast'

const AttendanceReq = ({ employeeUuid, employees }) => {
  const [isRequired, setIsRequired] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Initialize state based on employee data when component mounts or when employees prop changes
  useEffect(() => {
    if (employees && employees.is_attendence_required !== undefined) {
      setIsRequired(employees.is_attendence_required === true || employees.is_attendence_required === "true")
    }
  }, [employees])

  const handleToggle = async () => {
    const newStatus = !isRequired
    setIsUpdating(true)
    
    try {
      // Call the API with the correctly structured payload
      await changeAttendanceReq(employeeUuid, {
        is_attendence_required: newStatus.toString()
      })
      
      // Update local state after successful API call
      setIsRequired(newStatus)
      toast.success("Attendance updated successfully")
    } catch (error) {
      // Revert the change if API call fails
      console.error("Failed to update attendance requirement:", error)
      toast.error("Failed to update attendance requirement")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mb-5">
      <Toaster/>
      <h3 className="block text-base font-medium mb-2 text-black">Is attendance required?</h3>
      
      <div className="flex items-center">
        <button 
          className={`relative text-black inline-flex h-6 w-11 items-center rounded-full ${isRequired ? 'bg-lime-500' : 'bg-gray-200'}`}
          onClick={handleToggle}
          role="switch"
          aria-checked={isRequired}
          disabled={isUpdating}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isRequired ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className="ml-3 text-sm text-black">
          {isRequired ? 'Yes' : 'No'}
          {isUpdating && <span className="ml-2 text-gray-500">(Updating...)</span>}
        </span>
      </div>
    </div>
  )
}

export default AttendanceReq