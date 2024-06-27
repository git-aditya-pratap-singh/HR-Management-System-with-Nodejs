import express from "express";
import LiveReportsModels from "./modules/liveReports.model";

const livereportRouter = express.Router();
const LIVEREPORTS_INSTANCE = new LiveReportsModels();

livereportRouter.post('/getLiveAllStatus', LIVEREPORTS_INSTANCE.getLiveAllStatus)
livereportRouter.post('/getSublocationSeatsStatus', LIVEREPORTS_INSTANCE.getSublocationSeatsStatus)
livereportRouter.post('/attendance', LIVEREPORTS_INSTANCE.attendance)
livereportRouter.post('/timeSheet', LIVEREPORTS_INSTANCE.timeSheet)

export default livereportRouter.post('/timeSheet', LIVEREPORTS_INSTANCE.timeSheet)
;