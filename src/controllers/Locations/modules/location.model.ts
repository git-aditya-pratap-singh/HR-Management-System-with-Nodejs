import { Request, Response } from "express";
import { ObjectId } from 'mongodb';
import locationDB from "../../../schema/locationdb.schema";
import AlertService from "../../../helpers/AlertService";

class LocationModel extends AlertService{

    private msg: any = "";
    
    getActiveLocation = async(req: Request, res: Response): Promise<any>=>{
        const activeLocation = await locationDB.find({
            status: { $eq: "Enabled" }
        },
        {
           _id : 1,
           name: 1,
           address: 1
        });
        return this.sendDataResponse(res, 1, activeLocation)
    }

    getLocationList = async(req: Request, res: Response): Promise<any> =>{
        const locationList = await locationDB.find().sort({_id: 1});
        return this.sendDataResponse(res, 1, locationList)
    }

    addLocation = async(req: Request, res: Response): Promise<any> =>{
        return (await this.validate(req.body, res)) ? (await this.insertLocation(req.body, res)) ? this.sendSuccessResponse(res, 1, "Location Added.") :
        this.sendErrorResponse(res, 0, "Location couldn't be added!") :
        undefined;   
    }

    editLocation = async(req: Request, res: Response): Promise<any> =>{
        return (await this.updateLocation(req.body, res)) ? this.sendSuccessResponse(res, 1, "Location Updated.") : this.sendErrorResponse(res, 0, "Location couldn't be updated!");
    }

    isActiveLocation = async (id: any): Promise<boolean> =>{
        const check = await locationDB.findOne({$and: [{_id: new ObjectId(id)},{status: {$eq: 'Enabled'}}]})
        if(!check){
            return false
        }
        return true
        
    }

    private validate = async(data: any, res: Response): Promise<any>=>{
        const { name, address } = data;
        const nameError = (name === "" || name === null) ? "Name couldn't be empty!" : "";
        const addressError = (address === "" || address === null) ? "Address couldn't be empty!" : "";
        if (nameError) {
            return this.sendErrorResponse(res, 0, nameError);
        }
        if (addressError) {
            return this.sendErrorResponse(res, 0, addressError);
        }
        const check = await locationDB.find({ 'name': { $eq: name } });
        return (check.length > 0) ? this.sendErrorResponse(res, 0, "Name is already present!") : true;
    }


    private insertLocation = async(data: any, res: Response): Promise<any> =>{
        const {name, address, status} = data;
        const doc = { name, address, status };
        try{
            const insert = await locationDB.insertMany(doc)
            if(insert === null){
                return false;
            }
            return true;
        }catch(err){
            this.msg = `SERVER_ERROR ${err}!`;
            return this.sendServerErrorResponse(res, 0, this.msg)
        }  
    }


    private updateLocation = async(data: any, res: Response): Promise<any> =>{
        try{
            const update = await locationDB.findByIdAndUpdate(
                { _id: data._id },
                { $set: {
                    name: data.name,
                    address: data.address,
                    status: data.status
                }},
                {new: true}
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
export default LocationModel;