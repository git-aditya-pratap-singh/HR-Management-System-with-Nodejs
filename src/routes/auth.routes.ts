import express from "express";
import loginRouter from "../controllers/Login/login.routes";
import seatsRouter from "../controllers/Seats/seats.routes";
import departmentRouter from "../controllers/Departments/department.routes";
import employeeRouter from "../controllers/Employees/employee.routes";
import locationRouter from "../controllers/Locations/location.routes";
import sublocationRouter from "../controllers/Sublocation/subLocation.routes";
import shiftRouter from "../controllers/Shifts/shift.routes";
import livereportRouter from "../controllers/liveReports/liveReports.routes";
import profileRouter from "../controllers/Profiles/profile.routes";
import reportRouter from "../controllers/Reports/report.routes";

import UserAuthentication from "../middlewares/auth.middleware";

const AUTH_USER_VERIFY = new UserAuthentication();


const router = express.Router();
// ---------model => login------------------
router.use('/login', loginRouter)
// ---------model => seats------------------
router.use('/seats', AUTH_USER_VERIFY.verifyToken, seatsRouter)
// ---------model => seats------------------
router.use('/department', AUTH_USER_VERIFY.verifyToken, departmentRouter)
// ---------model => employee------------------
router.use('/employee', AUTH_USER_VERIFY.verifyToken, employeeRouter)
// ---------model => location------------------
router.use('/location', AUTH_USER_VERIFY.verifyToken, locationRouter)
// ---------model => sublocation------------------
router.use('/sublocation', AUTH_USER_VERIFY.verifyToken, sublocationRouter)
// ---------model => shift------------------
router.use('/shift', AUTH_USER_VERIFY.verifyToken, shiftRouter)
// ---------model => liveReports------------------
router.use('/liveReports', AUTH_USER_VERIFY.verifyToken, livereportRouter)
// ---------model => viewprofile------------------
router.use('/viewprofile', AUTH_USER_VERIFY.verifyToken, profileRouter)
// ---------model => Reports------------------
router.use('/reports', AUTH_USER_VERIFY.verifyToken, reportRouter)

export default router;