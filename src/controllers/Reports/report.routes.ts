import express from "express";
import ReportsControllers from "./modules/reports.model";

const reportRouter = express.Router();
const REPORTS_INSTANCE = new ReportsControllers();

reportRouter.post('/selectiveTimeSheet', REPORTS_INSTANCE.selectiveTimeSheet)

export default reportRouter;