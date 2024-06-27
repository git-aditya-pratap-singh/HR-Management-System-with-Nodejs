import express from "express";
import DepartmentModel from "./modules/department.model";
import AuthPermission from "../../middlewares/permission.middleware";

const departmentRouter = express.Router();

const AUTH_USER_PERMISSION = new AuthPermission();
const DEPARTMENT_INSTANCE = new DepartmentModel();

// ---------action => getActiveDepartmentList------------------
departmentRouter.post('/getActiveDepartmentList', AUTH_USER_PERMISSION.permission('department','getActiveDepartmentList'), DEPARTMENT_INSTANCE.getActiveDepartmentList)
// ---------action => getActiveDepartmentList------------------
departmentRouter.post('/getDepartmentList', AUTH_USER_PERMISSION.permission('department','getDepartmentList'), DEPARTMENT_INSTANCE.getDepartmentList)
// ---------action => addDepartment------------------
departmentRouter.post('/addDepartment',  AUTH_USER_PERMISSION.permission('department','addDepartment'), DEPARTMENT_INSTANCE.addDepartment)

export default departmentRouter;





