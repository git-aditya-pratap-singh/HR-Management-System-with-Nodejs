import express from "express";
import ShiftModel from "./modules/shift.model";
import AuthPermission from "../../middlewares/permission.middleware";

const shiftRouter = express.Router();

const AUTH_USER_PERMISSION = new AuthPermission();
const SHIFT_INSTANCE = new ShiftModel();

// ---------action => getActiveShift------------------
shiftRouter.post('/getActiveShift', AUTH_USER_PERMISSION.permission('shift','getActiveShift'), SHIFT_INSTANCE.getActiveShift);
// ---------action => getShiftList------------------
shiftRouter.post('/getShiftList', AUTH_USER_PERMISSION.permission('shift','getShiftList'), SHIFT_INSTANCE.getShiftList);
// ---------action => addShift------------------
shiftRouter.post('/addShift', AUTH_USER_PERMISSION.permission('shift','addShift'), SHIFT_INSTANCE.addShift);
// ---------action => editShift------------------
shiftRouter.post('/editShift', AUTH_USER_PERMISSION.permission('shift','editShift'), SHIFT_INSTANCE.editShift);

export default shiftRouter;