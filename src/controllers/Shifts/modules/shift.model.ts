import { Request, Response } from "express";
import { ObjectId } from 'mongodb';
import shiftDB from "../../../schema/shiftdb.schema";
import AlertService from "../../../helpers/AlertService";

class ShiftModel extends AlertService{

    private msg: any = "";
    
    getActiveShift = async(req: Request, res: Response): Promise<any>=>{
        const activeLocation = await shiftDB.find({
            status: { $eq: "Enabled" }
        });
        return this.sendDataResponse(res, 1, activeLocation);
    }

    getActiveShiftDetails = async(): Promise<any> =>{
        const activeLocationDetails = await shiftDB.find({
            status: { $eq: "Enabled" }
        });
        return activeLocationDetails;
    }

    getShiftList = async(req: Request, res: Response): Promise<any>=>{
        const shiftList = await shiftDB.find().sort({_id: 1});
        return this.sendDataResponse(res, 1, shiftList)
    }

    isActiveShift = async(id: any): Promise<boolean> =>{
        const activeShift = await shiftDB.findOne({$and: [{_id: {$eq: new ObjectId(id)}},{status: {$eq: 'Enabled'}}] })
        return (activeShift) ? true : false;
    }

    addShift = async(req: Request, res: Response): Promise<any>=>{
        // Object distructuring concept ----------
        const {name, inTime, outTime, authIn, meanTime} = req.body;
        const insertData = await this.checkData(name, inTime, outTime, authIn, meanTime)
        return (
            (insertData.name === true && insertData.time === true) ?
            (
                (await this.insertShift(req.body, res)) ?
                this.sendSuccessResponse(res, 1, "Shift saved.") :
                this.sendServerErrorResponse(res, 0, "Server Error: Data has not been saved.")
            ) :
            (
                (insertData.name === false) ?
                (this.msg = "Name can't be empty!", this.sendErrorResponse(res, 0, this.msg)) :
                (insertData.time === false) ?
                (this.msg = "Time format not supported!", this.sendErrorResponse(res, 0, this.msg)) :
                null 
            )
        );
    }

    editShift = async(req: Request, res: Response): Promise<any>=>{
        // Object distructuring concept ----------
        const {name, inTime, outTime, authIn, meanTime} = req.body;
        const shiftData = await this.checkData(name, inTime, outTime, authIn, meanTime)
        return (
            (shiftData.name === true && shiftData.time === true) ?
            (
                (await this.updateShift(req.body, res)) ?
                this.sendSuccessResponse(res, 1, "Shift saved.") :
                this.sendServerErrorResponse(res, 0, "Server Error: Data has not been saved.")
            ) :
            (
                (shiftData.name === false) ?
                (this.msg = "Name can't be empty!", this.sendErrorResponse(res, 0, this.msg)) :
                (shiftData.time === false) ?
                (this.msg = "Time format not supported!", this.sendErrorResponse(res, 0, this.msg)) :
                null 
            )
        );
        
    }

    private checkData = async(name: string, inTime: number, outTime: number, authIn: number, meanTime: number): Promise<{name?: boolean, time?: boolean}> =>{
        return (
            (name === '' || name === null) ? { name: false } :
            (isNaN(inTime) || isNaN(outTime) || isNaN(authIn) || isNaN(meanTime)) ? { time: false } :
            { name: true, time: true }
        );
    }

    private insertShift = async(data: any, res: Response): Promise<any>=>{
        try{
            const insertItem = {
                name: data.name,
                inTime: data.inTime,
                outTime: data.outTime,
                authIn: data.authIn,
                meanTime: data.maenTime,
                status: data.status
    
            }
            const insert = await shiftDB.insertMany(insertItem);
            if(insert === null){
                return false;
            }
            return true;
        }catch(err){
            this.msg = `SERVER_ERROR ${err}!`;
            return this.sendServerErrorResponse(res, 0, this.msg)
        }
        
    }

    private updateShift = async(data: any, res: Response): Promise<any>=>{
        try{
            const update = await shiftDB.updateOne(
                { _id: data._id },
                { $set: {
                    name: data.name,
                    inTime: data.inTime,
                    outTime: data.outTime,
                    authIn: data.authIn,
                    meanTime: data.meanTime,
                    status: data.status
                }}
            );
            if(update === null){
                return false;
            }
            return true;
        }catch(err){
            this.msg = `SERVER_ERROR ${err}!`;
            return this.sendServerErrorResponse(res, 0, this.msg)
        }
    }
} 
export default ShiftModel;