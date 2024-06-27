import express from "express";
import SeatsModel from "./modules/seats.model";
import AuthPermission from "../../middlewares/permission.middleware";

const seatsRouter = express.Router();
const AUTH_USER_PERMISSION = new AuthPermission();

// Define route paths
const SEAT_INSTANCE = new SeatsModel();
// ---------action => getSublocationList------------------
seatsRouter.post('/getSublocationList', AUTH_USER_PERMISSION.permission('seats','getSublocationList'), SEAT_INSTANCE.getSublocationList)
// ---------action => getSublocationList------------------
seatsRouter.post('/getSublocationSeats',AUTH_USER_PERMISSION.permission('seats','getSublocationSeats'), SEAT_INSTANCE.getSublocationSeats)
// ---------action => add------------------
seatsRouter.post('/add', AUTH_USER_PERMISSION.permission('seats','add'), SEAT_INSTANCE.add)
// ---------action => remove------------------
seatsRouter.post('/remove', AUTH_USER_PERMISSION.permission('seats','remove'), SEAT_INSTANCE.remove)

export default seatsRouter;





