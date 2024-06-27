import {Request, Response} from "express";
import AlertService from "../../../helpers/AlertService";
import asyncHandler from "../../../utils/asyncHandler";
import ReportQuery from "./reports.pipelines";

class ReportsControllers extends AlertService{

    selectiveTimeSheet = asyncHandler( async(req: Request, res: Response): Promise<any> =>{

      const selectiveTimeSheetdata = await new ReportQuery().selectiveTimeSheetQueryPipelines(req, res);
      console.log("DATA",selectiveTimeSheetdata)

    })

}
export default ReportsControllers;