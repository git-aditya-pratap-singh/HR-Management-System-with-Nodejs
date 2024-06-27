import { Request, Response } from "express";
import { ObjectId } from "mongoose";
import AlertService from "../../../helpers/AlertService";
import asyncHandler from "../../../utils/asyncHandler";
import DateCalculations from "../../../helpers/dateCalculate.services";
import LiveReportsQuery from "./liveReports.pipeline_stages";
import ShiftModel from "../../Shifts/modules/shift.model";
import PunchService from "../../../helpers/punch.services";
import CommonServices from "../../../helpers/common.services";
//---------------DatabaseSchema--------------------
import shiftDB from "../../../schema/shiftdb.schema";
import employeeDB from "../../../schema/employeedb.schema";
import userlocationDB from "../../../schema/userlocationdb.schema";

const LIVE_REPORTS = new LiveReportsQuery();
const INSTANCE_OF_SHIFT = new ShiftModel();
const DATE_CALC = new DateCalculations();
const INSTANCE_OF_PUNCH = new PunchService();

class LiveReportsModels extends AlertService{

    private liveAttendanceList: any[] = [];
    private userLocationList: any[] = [];

    private getLocationAccessList = async (empCode: string): Promise<ObjectId[]> =>{
        const userLocation = await userlocationDB.find(
            {$and: [{is_enabled: '1'},{empCode: empCode}]},
            {_id: 0, locationId: 1}
        );
        const userLocationAccList = userLocation ? userLocation.map((item: { locationId: ObjectId }) => item.locationId) : [];
        return userLocationAccList;
    }
    
  
    getLiveAllStatus = asyncHandler(async(req: Request, res: Response): Promise<any> =>{

        const user = res.locals.auth;
        let shiftArray: any[] = [];
        let dateArray: any[] = [];

        const shiftInfo = await shiftDB.find(
            {status: 'Enabled'},
            {_id: 1, name: 1, meanTime: 1}
        );
        if(user.loginKey === "employee"){
            this.userLocationList = await new CommonServices().getLocationEmployeeAccessList(user.empCode);
        }
        if(user.loginKey === "other"){
            this.userLocationList = await new CommonServices().getLocationAccessList(user.empCode);
        }

        await Promise.all(shiftInfo.map(async(item) =>{
            let dateTime = await DATE_CALC.calculateDate(item.meanTime)
            dateArray.push(dateTime)
            shiftArray.push(item?._id)
        }));
        const liveAllStatus = await LIVE_REPORTS.getLiveStatus(shiftArray, dateArray, this.userLocationList, res);
        return this.sendDataResponse(res, 1, liveAllStatus)
      
    })
    

    getSublocationSeatsStatus = asyncHandler( async(req: Request, res: Response): Promise<any> =>{

        let dateArray: any[] = [];
        let shiftArray: any[] = [];
        let subLocationArray: any[] = [];

        let locationSeatsStatus = await LIVE_REPORTS.getSublocationSeatsStatusPipeline_Stages_1(req.body.id, res);
        // n console.log(locationSeatsStatus);

        await Promise.all(locationSeatsStatus.map(async(item: any)=>{
            let dateTime = await DATE_CALC.calculateDate(item.meanTime);
            dateArray.push(dateTime);
            shiftArray.push(item.shiftId);
            subLocationArray.push(item.subLocationId);
        }));
        let SublocationSeats = await LIVE_REPORTS.getSublocationSeatsStatusPipeline_Stages_2(dateArray, shiftArray, subLocationArray, res);
        return this.sendDataResponse(res, 1, SublocationSeats)
    })


    attendance = asyncHandler( async(req: Request, res: Response): Promise<any>=>{
    
        let dateArray: any[] = [];
        let shiftArray: any[] = [];

        const attendanceResults = await LIVE_REPORTS.attendancePipelines(res); 
        const activeShifts = await INSTANCE_OF_SHIFT.getActiveShiftDetails();
        await Promise.all(activeShifts.map(async(item: any)=>{
            let dateTime = await DATE_CALC.getDate(item.meanTime);
            dateArray.push(dateTime)
            shiftArray.push(item?._id)
        }));

        const liveAttendanceList = await LIVE_REPORTS.attandancePipelinesSecond(dateArray, shiftArray, res);
        //console.log(this.liveAttendanceList)
        return this.sendDataResponse(res, 1, this.liveAttendanceList)
    });


    timeSheet = asyncHandler( async(req: Request, res: Response): Promise<any> =>{

        let punchDetails: any = null;
        const { forDate } = req.body;
        const forDateTime = forDate ? forDate : null;
        const time = Math.floor(new Date().getTime() / 1000);

        const activeEmployees = await LIVE_REPORTS.timeSheetPipelines(res);

        if(activeEmployees.length > 0){
            let dateArray: any[] = [];
            let shiftArray: any[] = [];
            const activeShifts = await INSTANCE_OF_SHIFT.getActiveShiftDetails()
        
            await Promise.all(activeShifts.map(async(item: any, index:  number)=>{
                let dateTime = await DATE_CALC.getDate(item.meanTime, forDateTime);
                dateArray.push(dateTime)
                shiftArray.push(item?._id)
            }))
        
            punchDetails = await LIVE_REPORTS.timeSheetPunchPipelines(dateArray, shiftArray, res)
            console.log("----->>>>",punchDetails)
        }

        let puncheslist: any = {};
        let punches: any = {};
        let arr: any[] = []
        

        if(punchDetails.length > 0){  
            punchDetails.map((item: any) => {                
                arr.push(puncheslist[item.userId] = {
                    empCode: item.userId,
                    date: item.date,
                    lastIn: item.shiftInTime,
                    lastOut: item.shiftOutTime,
                    locationID: item.subLocationId,
                    punches: []
                })
                puncheslist[item.userId].punches.push(...item.punch.split(", "));     
            });
        } 
        console.log(arr)  
    })

    
}

export default LiveReportsModels;