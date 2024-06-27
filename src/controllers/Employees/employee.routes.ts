import express from "express";
import EmployeeModel from "./modules/employee.model";
import AuthPermission from "../../middlewares/permission.middleware";

const employeeRouter = express.Router();

const AUTH_USER_PERMISSION = new AuthPermission();
const EMPLOYEE_INSTANCE = new EmployeeModel();

// ---------action => permission------------------
employeeRouter.post('/permission', AUTH_USER_PERMISSION.permission('employee','permission'), EMPLOYEE_INSTANCE.userRole)
// ---------action => addEmployeen------------------
employeeRouter.post('/addEmployee', AUTH_USER_PERMISSION.permission('employee','addEmployee'), EMPLOYEE_INSTANCE.addEmployee)
// ---------action => editEmployee------------------
employeeRouter.post('/editEmployee', AUTH_USER_PERMISSION.permission('employee','editEmployee'), EMPLOYEE_INSTANCE.editEmployee)
// ---------action => getAllReportingManagers------------------
employeeRouter.post('/getAllReportingManagers', AUTH_USER_PERMISSION.permission('employee','getAllReportingManagers'), EMPLOYEE_INSTANCE.getAllReportingManagers)
// ---------action => getAllTeamLeads------------------
employeeRouter.post('/getAllTeamLeads', AUTH_USER_PERMISSION.permission('employee','getAllTeamLeads'), EMPLOYEE_INSTANCE.getAllTeamLeads)
// ---------action => getEmployeeList------------------
employeeRouter.post('/getEmployeeList', AUTH_USER_PERMISSION.permission('employee','getEmployeeList'), EMPLOYEE_INSTANCE.getEmployeeList)
// ---------action => getallEmployeeList------------------
employeeRouter.post('/getallEmployeeList', AUTH_USER_PERMISSION.permission('employee','getallEmployeeList'), EMPLOYEE_INSTANCE.getallEmployeeList)
// ---------action => getEmployeeDetailByCode------------------
employeeRouter.post('/getEmployeeDetailByCode', AUTH_USER_PERMISSION.permission('employee','getEmployeeDetailByCode'), EMPLOYEE_INSTANCE.getEmployeeDetailByCode)
// ---------action => getActiveEmployeeListForFilter------------------
employeeRouter.post('/getActiveEmployeeListForFilter', AUTH_USER_PERMISSION.permission('employee','getActiveEmployeeListForFilter'), EMPLOYEE_INSTANCE.getActiveEmployeeListForFilter)


export default employeeRouter;

