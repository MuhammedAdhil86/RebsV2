//leaveService

export const getLeave = "/admin/leave/get"
export const AddUser = "/user/createstaff"
export const postLeaveBulkAllocation = "/leave-policy/allocate/staffs"
//AnnouncementService

export const postAnnouncement = "/admin/announcement/add"
export const Login = "/staff/login"
export const getAnnouncement = "/admin/announcement/get"
//Employeelist

export const getTotalEmployee = "/admin/staffstatus/list"
export const putStatusUpdate = "/admin/attendance/status/update"

export const postEmployeeListbyMonth ="/admin/attendance/listbymonth"

//leaveapproval

export const putLeaveApproval = "/admin/leave/change-status/:leave_id"

//staffstatus

export const getDashboard = "/admin/dashboard/list"

//LOG

export const getLog = "/admin/stafflog/list"

//GetDepartment 

export const getDept = "/user/getdept"

//GetStaffs

export const getStaff = "/master/staff"

//manageEmployee
export const getEmployeeDetails = "/staff/get"

//assetManager

export const getAssetstype = "/master/asset-type"
export const getAssetDashboard = "/admin/asset/dashboard"
export const postCreateAsset = "/admin/asset/add"
export const getAssetType = "/master/asset-type"
export const getAssetAllocatebyId =(id)=> `/admin/assetallocation/timeline/get/${id}`
export const postAssetAllocation = "/admin/assetallocation/add"
export const postReturnAsset = "/admin/assetallocation/return"
export const addAssetType = "/admin/asset-type/add"
export const FetchAssets = "/admin/asset/get "
export const deleteAsset = (id) => `/admin/asset/delete/${id}`;

//report

export const getReport = "/admin/staffreport/:month"
export const getReportIndia = "/admin/staff/fullreport"

export const getLeaveReport = "/admin/leave/employee/leave/report";
export  const attendanceFullReport = (month, year) => `/admin/staff/fullreport/${month}/${year}`;

//Events and Leave Calendar

export const getLeavebyDate = "/admin/leave/getbydate"
export const getEventbyDate = "/admin/event/getbydate"
export const getEvents = "/admin/event/get"
export const postEvents = "/admin/event/add"
export const getTimezone = "/master/timezone"
export const deleteEvent = "/admin/event/delete/:id"
export const cancelEvent = "/admin/event/cancel/:id"


//Digital Assets

export const getDigitalDashboard = "/admin/digital-asset/dashboard"
export const getDigitalAsset = "/admin/digital-asset/get"
export const postCreateDigitalAsset = "/admin/digital-asset/add"
export const getAccountType = "/master/account-type"
export const getAuthenticator = "/master/authenticators"
export const postAllocateDigital = "/admin/digital-assetallocation/add"
export const getDigitalAssetById =(id)=> `/admin/digital-assetallocation/timeline/get/${id}`
export const postReturnDigital = "/admin/digital-assetallocation/return"
export const deleteDigitalAsset = (id) => `/admin/digital-asset/delete/${id}`;
export const updateDigitalAsset = (id) => `/admin/digital-asset/update/${id}`;

//Company Onboarding

export const getCompanyDetails =(id)=> `/company/get/${id}`
export const updateCompanyDet = "/company/update"
export const getOrgType ="/admin/organization-type/get"
export const getCountry = "/master/country"
export const updateCompany = "/company/update";

//Company Structure

export const getBranch = "/branch/get"
export const postBranch = "/branch/add"
export const postDivision =(id)=> `/division/add/${id}`
export const postDepartment = "/admin/department/add"
export const postDesignation = "/admin/designation/add"
export const getDepartment = "/admin/department/get"
export const deleteDepartment = "/admin/department/delete/:id"

//Timeline api

export const getwithDivision = "/branch/getwithdivision"
export const getDesignations = "/admin/designation/get"
export const deleteDesignation = "/admin/designation/delete/:id"

// Organisational Policy

export const postAddAllowance = "/allowance/add"
export const getAllowanceData = "/allowance/get"
export const postAddCompliance = "/compliance/add"
export const getCompliances = "/compliance/get"
export const postCreatePolicy = "/attendance-policy/add"
export const getPolicies = "/attendance-policy/get"
export const getLeavePolicy = "/leave-policy/get"
export const getPresetAttendanceTemplate = "/attendance-policy/defaults"

export const getRoles = "/master/role"
export const deletePolicy = "/attendance-policy/delete/:id"
export const getCompanyPreview = "/company/get"
export const updatePresetAttendanceTemplate = (id) => `/attendance-policy/update/defaults/${id}`;
export const deleteAttendancePolicyUrl = (id) => `/attendance-policy/delete/${id}`;
// Holiday

export const getHoliday = "/admin/holiday/get/default"
export const postAddHoliday = "/admin/holiday/add"
export const postAddCSV = "/admin/holiday/addcsv"
// Add this to your api.js




export const updateHoliday = (id) => `/admin/holiday/update/${id}`; // PUT form-data
export const deleteHoliday = (id) => `/admin/holiday/delete/${id}`; // DELETE

// Holiday Fetching
export const getAllHolidays = "/admin/holiday/get/all";

export const getFetchAllHolidays = "/admin/holiday/get";

export const getHolidayByMonthYear = (month, year) => `/admin/holiday/get/${month}/${year}`;
export const getHolidayByBranch = (branchId) => `/holiday/getbybranch/${branchId}`;
export const getStaffHolidays = "/staff/holiday/get";

//Leave Policy

export const postLeavePolicy = "/leave-policy/add"
export const getApplicabilityCat = "/admin/applicability-category/get"
export const getGender = "/admin/gender/get" 
export const getMaritalStatus = "/admin/marital-status/get"
export const getEmploymentType = "/admin/applicability-category/get"
export const getClubbingPolicy = "/master/leavetype"
export const getAllLeavePolicy = "/leave-policy/fetch-all"


//Week Off

export const postAddWeekOff = "/admin/weekly-off/add"
// constants/apiEndpoints.js (or similar)
export const getWeeklyOffShifts = "/shifts/fetch/weekly-off";

//Employee Onboard 

export const postBasicInformation = "/staff/add"
export const postAddBankInformation = "/staff/addbankinfo"
export const updateWorkInformation = "/staff/updateworkinfo"
export const updateHierarchyInfo = "/staff/updatehierarchyinfo"
export const updatePersonalInfo = "/staff/updatepersonalinfo"
export const updateIDInfo = "/staff/updateidinfo"
export const updateContactInfo = "/staff/updatecontactinfo"
export const updateWorkExperience = "/staff/addworkexperience"
export const updateEducationalDetails = "/staff/addeducation"
export const updateDependantDetails = "/staff/updatedependantinfo"
export const updateAdditionalInformation = "/staff/addadditionalinfo"
export const getAllDetailsStaff = "/staff/get"
export const putUserActivation = "/staff/toggle-activate"
export const getWeekOff = "/admin/weekly-off/get/:year"

export const getWeeklyOffBranch = "/admin/weekly-off/getbybranch/:year/:branchId";

export const getWeeklyOffDefault = "/admin/weekly-off/default/get/:year";
//Allocating Policies 
export const allocateLeavePolicy = "/leave-policy/allocate"
export const getPrivilegeLeavePolicy = "/leave-policy/allocated/get"
export const allocateAttendancePolicy = "/attendance-policy/allocate"
export const getAttendancePolicy = "/attendance-policy/allocated/get"
export const allocateAllowance = "/allowance/allocate"
export const getPrivilegeAllowance = "/allowance/allocated/get"
export const getPrivilegeCompliance = "/compliance/allocated/get"
export const allocateCompliance = "/compliance/allocate"
export const allocateRoles = "/staff/updateusertype"
export const editWorkHourPolicy = "/attendance-policy/update"
export const  getShifts = "/shifts/fetch"
export const getEmployeeShifts = "/shifts/filtered"
export const deleteShiftUrl = (id) => `/shifts/delete/${id}`;

export const deleteLeavePolicy = (id) => `/leave-policy/delete/${id}`;
export const deleteAllowance = "/allowance/delete/:id"
export const deleteCompliance = "/compliance/delete/:id"
export const deleteBranch = "/branch/delete/:id"
export const deleteDivision = "/division/delete/:id"

export const postBulkUpload = "/staff/bulkupload"
export const AddStudentApi = "/leads/addstudent"
export const employeeDelete = "/staff/delete/:id"
export const getEmployeeType = "/master/employment-type"
export const getEmployeeStatus = "/master/employment-status"
export const companyPreview = "/company/preview/get"
export const getDepartmentTimeline = "/admin/department/heirarchy/get"

//Advance Salary
export const postCreateAdvanceSalary = "/advance-salary/add"
export const getAdvanceSalary = "/advance-salary/get"


//Travel

export const postAddTravel = "/travel/add"
export const getTravelData = "/travel/get"

//Salary policy

export const getSalaryPolicy = "/salary-policy/get"
export const postSalaryPolicy = "/salary-policy/add"
export const deleteSalaryPolicy = "/salary-policy/delete/:id"

//Reset Password

export const postResetPassword = "/staff/reset-password"
export const sendResetPasswordEmail = "/staff/forgot-password"
export const forgotPassword = "/staff/forgot-otpverify"
export const confirmForgotPassword = "/staff/forgot-confirm"

//Work from home
export const getWorkFromHome = "/admin/wfh/get"
export const updateStatus = "/admin/wfh/update"

//Exit Process
export const getTableData = "/exit-process/get"
export const updateQuestionnaire = "/exit-process/update/questionaire"
export const postSeparation = "/exit-process/update/initialstep"
export const getByIdSeparation = "/exit-process/get/:id"
export const updateCheckList = "/exit-process/update/checklist"

//Employee Calendar
export const getEmployeeCalendar = "/admin/staff/workhours/{month}"
export const postEmployeeCalendar = "/admin/attendance/listbymonth"

//File Upload for written Policy
export const writtenFileUpload = "/company/policy-document/add"

//Attachments
export const uploadAttachment = "/staff/admin/document/upload/{uuid}"
export const getCategory = "/admin/document-category/get"
export const getAttachments = "/staff/admin/document/get/{uuid}"

//Hiring
export const getPlatforms = "/admin/platform/get"
export const getVacancies = "/company/vaccancy/get"
export const addVacancies = "/company/vaccancy/add"
export const getJobEnquiries = "/company/jobApplications/list"
export const updateApplicationStatus = "/job-applications/update-status";
export const sendInvitationOnHire = "/company/jobApplications/send/invitation-on-hire/";
export const sendRejectionMail = "/company/jobApplications/send/rejection/";

// src/api/api.js
export const reviewApplication = "/job-applications/move-to/under-review";

// Employee Basic Info
export const updateBasicInfo = (id) => `/staff/updatebasicinfo/${id}`;

// Employee Work Info
export const getWorkInformations = (id) => `/staff/workinfo/${id}`;
export const updateWorkInformations = (id) => `/staff/updateworkinfo/${id}`;


// Attendance
export const getDailyAttendance = "/admin/attendance/musterroll";

// Consolidated Data
export const getConsolidatedData = "/admin/staff/consolidated";

export const postShiftcreate = "/shifts/add";
export const getAttendancepolicy ="attendance-policy/get"
export const getEmailPlaceholders = "/admin/email/placeholders"; // ✅ add this

export const getEmailPurposes = "admin/available-purposes";
export const postCreateEmailTemplate = "admin/create/templates";
export const deleteEmailTemplate = (id) => `admin/templates/${id}`;
export const getEmailTemplates = "admin/templates";

export const updateEmailTemplate = "admin/notification-templates/{purpose}";

export const uploadEmailTemplateFile ="admin/upload/templates";

export const getDefulatEmailTemplate = "/admin/defaults";

export const postCloneEmailTemplate = "/admin/clone-default";
export const postAllocatePayarollTemplate = "/api/payroll/template-allocations";

export const postGenerateLetter = "/letter/generate";
export const postSendLetter = "/letter/send";
// FIXED
export const getUserPayrollTemplateAllocations = (userId) =>
  `/api/payroll/template-allocations/user?user_id=${userId}`;


export const postPayrollAttendance = "/api/payroll/calculate/attendance";

export const getEmployeeBankInfo = "/staff/employees/bank-info";

export const getPayrollAnalyticsRun = "/api/payroll/analytics/run";
export const getPayrollAnalyticsResult = " /api/payroll/analytics/list/all-runs";
export const postBulkAllocatePayroll= "/api/payroll/template-allocations";
export const getPayrollDataAnalyticsList = (month, year, status) => 
  `/api/payroll/analytics/list/all-runs?month=${month}&year=${year}&status=${status}`;
export const updatePayrollAnalytics = "/api/payroll/analytics/update";
// Attendance Policy
export const postAttendancePolicyAdd = "/attendance-policy/add";

export const getShiftAttendanceUserType = (uuid) =>
  `/master/shift-attendance-user-type/${uuid}`;


export const putToggleUserActivate = (uuid, activate) =>
  `/staff/toggle-activate/${uuid}?activate=${activate}`;

export const deleteStaffUser = (uuid) =>
  `/staff/delete/${uuid}`;

export const getpolicyLookup = "/staff/get-by/single-filter";

export const updatePolicyStatus = "/leave-policy/status";

export const getEmployeePolicy = (uuid) => `/leave-policy/employees/${uuid}`;

// Shift & Privilege Endpoints
export const fetchShiftsUrl = "/shifts/fetch";
export const allocateShiftUrl = "/shifts/allocate";
export const userShiftDetailsUrl = (uuid) => `/master/shift-attendance-user-type/${uuid}`;
export const userLocationDeviceUrl = (uuid) => `/master/location-device/${uuid}`;
export const getEmployeeLeavePolicy = (uuid) => `/leave-policy/employees/${uuid}`;

export const allocateEmployeePolicy = "/leave-policy/allocate/staffs";

export const getDifaultleavePolicy = "/leave-policy/fetch-default";
export const postCloneLeavePolicy = "/leave-policy/clone-defaults";
export const getReimbursementList = "/api/payroll/reimbursements/list";
export const updateReimbursementStatus = "/api/payroll/reimbursements/status";
export const updateSalaryPayrollComponent = (id) => `/api/payroll/components/${id}`;

// Change this:
// export const updatePayrollSalaryTemplate = (id) => `/api/payroll/templates${id}`;

// To THIS (Notice the "/" before the ID):
export const updatePayrollSalaryTemplate = (id) => `/api/payroll/templates/${id}`;

export const getPayrollcomponents = "api/payroll/components";
export const deletePayrollComponent = "/api/payroll/components"; 
export const deletePayrollTemplate = "/api/payroll/templates";
export const deleteTemplateAllocation = "/api/payroll/template-allocations";


export const updateAttendancePolicy = (id) => `/attendance-policy/update/${id}`;

export const updateLeavePolicy = (id) => `/leave-policy/update/${id}`;


export const regularizeAttendanceApproval = "/admin/attendance/regularize/approval";