import express from "express";
import SubLocationModel from "./modules/subLocation.model";
import AuthPermission from "../../middlewares/permission.middleware";

const sublocationRouter = express.Router();
const AUTH_USER_PERMISSION = new AuthPermission();
const SUBLOCATION_INSTANCE = new SubLocationModel();

// ---------action => getActiveSubLocation------------------
sublocationRouter.post('/getActiveSubLocation', AUTH_USER_PERMISSION.permission('subLocation','getActiveSubLocation'), SUBLOCATION_INSTANCE.getActiveSubLocation);
// ---------action => getSubLocationList------------------
sublocationRouter.post('/getSubLocationList', AUTH_USER_PERMISSION.permission('subLocation','getSubLocationList'), SUBLOCATION_INSTANCE.getSubLocationList);
// ---------action => addSubLocation------------------
sublocationRouter.post('/addSubLocation', AUTH_USER_PERMISSION.permission('subLocation','addSubLocation'), SUBLOCATION_INSTANCE.addSubLocation);
// ---------action => editSubLocation------------------
sublocationRouter.post('/editSubLocation', AUTH_USER_PERMISSION.permission('subLocation','editSubLocation'), SUBLOCATION_INSTANCE.editSubLocation);

export default sublocationRouter;