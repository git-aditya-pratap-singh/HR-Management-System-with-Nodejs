import { Request, Response } from "express";
import AlertService from "../../../helpers/AlertService";
import asyncHandler from "../../../utils/asyncHandler";
import Password_Encrypt_Decrypt_Technique from "../../../helpers/pswdEncrypet";
//-------------DatabaseSchema-------------
import loginDB from "../../../schema/logindb.schema";
import employeeDB from "../../../schema/employeedb.schema";
import userlocationDB from "../../../schema/userlocationdb.schema";

const pswdInstance = new Password_Encrypt_Decrypt_Technique();
class ProfileModels extends AlertService{

    profileInfo = asyncHandler(async (req: Request, res: Response): Promise<any> =>{
        const user = res.locals.auth;

        const userLookupPipeline = {
            '$lookup': {
              'from': 'userlocations',
              'localField': 'empCode',
              'foreignField': 'empCode',
              'as': 'profileinfo',
              'let': { 'empcode': '$empCode' },
              'pipeline': [
                { '$match': { '$expr': { '$eq': ['$empCode', '$$empcode'] } } },
                { '$project': { '_id': 1, 'locationId': 1, 'is_enabled': 1 } }
              ]
            }
        };

        const adminQueryPipeline = [
            userLookupPipeline
        ];
      
        const userQueryPipeline = [
            { '$match': { 'status': 'Enabled', 'empCode': user.empCode } },
            userLookupPipeline
        ];

        const pipeline = user.accessTypeRole === 'admin' && user.allAccess === '1' ? adminQueryPipeline : userQueryPipeline;
        const access = user.accessTypeRole === 'admin' && user.allAccess === '1' ? true : false;
        

        let LoginList: any = await loginDB.aggregate(pipeline);
        const listData: { [key: string]: any } = {};

        LoginList.forEach((logD:any) => {
            if (!listData[logD.empCode]) {
                listData[logD.empCode] = {
                    username: logD.username,
                    password: logD.password,
                    designation: logD.designation,
                    hasAllAccess: logD.hasAllAccess,
                    last_login: logD.last_login,
                    empCode: logD.empCode,
                    password_token: logD.password_token,
                    reset_time_token: logD.reset_time_token,
                    status: logD.status,
                    GridlocList: [],
                    locList: []
                };
            }
            logD.profileinfo.filter((item: any)=>{
                if(item.is_enabled == '1'){
                    const locdata: any = {
                        locId: item.locationId,
                        IsChecked: item.is_enabled
                    };
                    listData[logD.empCode].locList.push(locdata);
                }
            })
            logD.profileinfo.filter((item: any)=>{
                if(item.locationId){
                    const gridata: any = {
                        locId: item.locationId,
                        IsChecked: item.is_enabled
                    };
                    listData[logD.empCode].GridlocList.push(gridata);
                }
            })
        });
        const FinallistData = Object.values(listData);
        let data = FinallistData;  
        return this.sendDataResponse(res, 1, {access, data});    
    })

    private usernameExists = async(username: String, res: Response): Promise<any> =>{
        try{
            const result: any = await loginDB.findOne({username: {$eq: username}});
            return (result) ? true : false;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }
    }

    private empCodeExists = async(empCode: String, res: Response): Promise<any> =>{
        try{
            const result: any = await loginDB.findOne({empCode: {$eq: empCode}});
            return (result) ? true : false;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }
    }

    private employeeExists = async(empCode: String, res: Response): Promise<any> =>{
        try{
            const result: any = await employeeDB.findOne({empCode: {$eq: empCode}});
            return (result) ? true : false;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }
    }

    private adduserValidate = async(req: Request, res: Response): Promise<any> =>{
        const {username, password, empCode} = req.body;
        if(!username){
            return this.sendErrorResponse(res, 0, "Please, enter the userame!!");
        }
        if(!isNaN(username)){
            return this.sendErrorResponse(res, 0, "Please, userame should not be Numaric!!");
        }
        if(await this.usernameExists(username, res)){
            return this.sendErrorResponse(res, 0, `${username} is already Exists!!`);
        }
        if(!empCode){
            return this.sendErrorResponse(res, 0, `Please, enter the Employee-Code!!`);
        }
        if(await this.empCodeExists(empCode, res)){
            return this.sendErrorResponse(res, 0, `${empCode} is already Exists!!`);
        }
        if(!await this.employeeExists(empCode, res)){
            return this.sendErrorResponse(res, 0, `This Employee (${empCode}) is not part of Our Organization.`);
        }
        if(!password){
            return this.sendErrorResponse(res, 0, `Please, enter the Password!!`);
        }
        return true
    }

    addusers = async (req: Request, res: Response): Promise<any> =>{

        const user = res.locals.auth;
        const {username, password, status, designation, empCode, hasAllAccess, locationList} = req.body;
        if(!user.allAccess){
            return this.sendErrorResponse(res, 0, "You are not authorized!!")
        }

        if(await this.adduserValidate(req, res)){
                const hashedPassword = await pswdInstance.passwordEncrypt(password);
                const lastdateandTime = new Date();
            
                const locationsToInsert = locationList
                .filter((loc: any) => loc.IsChecked === true) 
                .map((loc: any) => ({
                    empCode: empCode,
                    locationId: loc.locId,
                    is_enabled: 1 
                }));

                const adminToInsert = await new loginDB({
                    username: username,
                    password: hashedPassword,
                    designation: designation,
                    empCode: empCode,
                    last_login: lastdateandTime,
                    status: status,
                    hasAllAccess: hasAllAccess
                })

                adminToInsert.save();
                await userlocationDB.insertMany(locationsToInsert);
                return this.sendSuccessResponse(res, 1, "Data saved successfully!");
        }
    }

    editpassword = async (req: Request, res: Response): Promise<any> =>{
        try{
            const {id, password} = req.body;
            const timestamp = Date.now();
            const hashedPassword = (await pswdInstance.passwordEncrypt(password)).trim();

            const updatePswd = await loginDB.findByIdAndUpdate(
                {_id: id},
                {$set: {
                    password: hashedPassword,
                    reset_time_token: timestamp
                }},
                { new: true, upsert: true },
            )
            if (!updatePswd) {
                return this.sendErrorResponse(res, 0, "Password has not been updated!!");
            }
            return this.sendSuccessResponse(res, 1, "Password has been updated!!");
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!!${err}`);
        }
    }

}

export default ProfileModels;