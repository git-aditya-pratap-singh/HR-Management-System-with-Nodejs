import express from "express";
import LocationModel from "./modules/location.model";
import AuthPermission from "../../middlewares/permission.middleware";

const locationRouter = express.Router();
const AUTH_USER_PERMISSION = new AuthPermission();
const LOCATION_INSTANCE = new LocationModel();

// ---------action => getActiveLocation------------------
locationRouter.post('/getActiveLocation', AUTH_USER_PERMISSION.permission('location','getActiveLocation'), LOCATION_INSTANCE.getActiveLocation);
// ---------action => getLocationListn------------------
locationRouter.post('/getLocationList', AUTH_USER_PERMISSION.permission('location','getLocationList'), LOCATION_INSTANCE.getLocationList);
// ---------action => addLocation------------------
locationRouter.post('/addLocation', AUTH_USER_PERMISSION.permission('location','addLocation'), LOCATION_INSTANCE.addLocation);
// ---------action => editLocation------------------
locationRouter.post('/editLocation', AUTH_USER_PERMISSION.permission('location','editLocation'), LOCATION_INSTANCE.editLocation);

export default locationRouter;