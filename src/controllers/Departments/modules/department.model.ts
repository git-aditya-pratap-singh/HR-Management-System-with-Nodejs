import { Request, Response } from "express";
import { ObjectId } from 'mongodb';
import departmentDB from "../../../schema/departmentdb.schema";
import AlertService from "../../../helpers/AlertService";

class DepartmentModel extends AlertService{

    private msg: any = "";

    public getActiveDepartmentList = async(req: Request, res: Response): Promise<any> =>{
        const activedepartmentList = await departmentDB.find({ 
            status: { $ne: "Disabled" }
        },
        {
            name: 1,
            _id: 1
        });
        return this.sendDataResponse(res, 1, activedepartmentList)
    }

    public getDepartmentList = async(req: Request, res:Response): Promise<any> =>{
        const departmentList = await departmentDB.find().sort({_id: 1})
        return this.sendDataResponse(res, 1, departmentList)
    }

    public departmentExistsByName = async(departName:any): Promise<boolean> =>{
        const departExitName:any = await departmentDB.findOne({ name: {$eq: departName }},{_id: 1});
        if(!departExitName){
            return true;
        }else{
            return false;
        }
    }
    
    isActiveDepartment = async(id: any): Promise<boolean> =>{
        const activeDepartment = await departmentDB.findOne({$and: [{_id: {$eq: new ObjectId(id)}},{status: {$eq: 'Enabled'}}] })
        return (activeDepartment) ? true : false;
    }

    public addDepartment = async(req: Request, res: Response): Promise<any> =>{
        const {name, status} = req.body;
        return await this.departmentExistsByName(name) ? 
            (this.checkData(name) ? 
                (await this.insertDepartment(name, status, res) ? this.sendSuccessResponse(res, 1, "Department added.") : this.sendErrorResponse(res, 0, "Server Error")) 
            : this.sendErrorResponse(res, 0, "Name cannot be empty.")
        ) 
        : this.sendErrorResponse(res, 0, "Department Already Exists.");

    }

    private checkData = (name:any): boolean =>{
        if(name == null || name == ""){
            return false;
        } 
        return true;
    }

    private insertDepartment = async(name:string, status:string, res: Response): Promise<any>=>{
        const doc = {name, status}
        try{
            const insert = await departmentDB.insertMany(doc)
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
export default DepartmentModel;