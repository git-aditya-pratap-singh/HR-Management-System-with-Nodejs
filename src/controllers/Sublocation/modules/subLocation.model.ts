import { Request, Response } from "express";
import sublocationDB from "../../../schema/sublocationdb.schema";
import AlertService from "../../../helpers/AlertService";
import LocationModel from "../../Locations/modules/location.model";

class SubLocationModel extends AlertService{

    private msg: any = "";
    
    getActiveSubLocation = async (req: Request, res: Response): Promise<any>=>{
        const activesubLocation = await sublocationDB.find({
            status: { $eq: "Enabled" }
        },{
            _id: 1,
            name: 1
        });
        return this.sendDataResponse(res, 1, activesubLocation)
    }

    getSubLocationList = async (req: Request, res: Response): Promise<any>=>{
        const subLocationList = await sublocationDB.find().sort({_id: 1});
        return this.sendDataResponse(res, 1, subLocationList)
    }

    sublocationExistsByName = async (name: string): Promise<boolean>=>{
        return (await sublocationDB.findOne({name: {$eq: name}})) ? false : true;  
    }

    addSubLocation = async (req: Request, res: Response): Promise<any>=>{
        const {name, locationId, status} = req.body;
        return (await this.sublocationExistsByName(name)) ? (await this.validateData(name, locationId, res)) ? (await this.insertsubLocation(req.body, res))
            ? this.sendSuccessResponse(res, 1, "Sub-Location Added!") : this.sendErrorResponse(res, 0, "Sub-Location couldn't be Added!") : null // If validation fails, return null
            : this.sendErrorResponse(res, 0, "Sub-location Name Already Exists.!");   
    }

    editSubLocation = async (req: Request, res: Response): Promise<any>=>{}

    private validateData = async(name: any, locationId: any, res: Response): Promise<any>=>{
        const nameError = (name === "" || name === null) ? "Name couldn't be empty!" : "";
        const locationError = (locationId === "" || locationId === null) ? "Location couldn't be empty!" : "";
        if (nameError) {
            return this.sendErrorResponse(res, 0, nameError);
        }
        if (locationError) {
            return this.sendErrorResponse(res, 0, locationError);
        }
        const obj = new LocationModel();
        if(!(await obj.isActiveLocation(locationId))){
            return this.sendErrorResponse(res, 0, "Location isn't active.");
        }
        return true  
    }

    private insertsubLocation = async(data: any, res: Response): Promise<any>=>{
        const {name, locationId, status} = data;
        const doc = {name, locationId, status}
        try{
            const insert = await sublocationDB.insertMany(doc)
            if(insert === null){
                return false;
            }
            return true;
        }catch(err){
            this.msg = `SERVER_ERROR ${err}!`;
            return this.sendServerErrorResponse(res, 0, this.msg)
        }  
    }
  
}
export default SubLocationModel;