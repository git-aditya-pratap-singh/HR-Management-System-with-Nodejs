import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { IUser } from "./login.interface";
import AlertService from "../../../helpers/AlertService";
import asyncHandler from "../../../utils/asyncHandler";
import Password_Encrypt_Decrypt_Technique from "../../../helpers/pswdEncrypet";
import loginDB from '../../../schema/logindb.schema';

const pswdInstance = new Password_Encrypt_Decrypt_Technique();

class AdminloginModel extends AlertService{

    private msg: any = "";

    private GetuserByloginPass = async(usernme: string): Promise<IUser | null> => {
        const userMatch: IUser | null = await loginDB.findOne({ username: usernme },
            {username: 1, password: 1, designation: 1, status: 1, empCode: 1, hasAllAccess: 1}
        );
        return userMatch;
    }

    public login = asyncHandler( async(req: Request, res: Response): Promise<any> => {
    
            const { username, password } = req.body;
            const userValid: IUser | null = await this.GetuserByloginPass(username);

            if (!userValid) {
              this.msg = "Invalid Username..!!!";
              return this.sendErrorResponse(res, 0, this.msg);
            }

            if (userValid.status != "Enabled") {
              this.msg = "User account is not active.";
              return this.sendErrorResponse(res, 0, this.msg);
            }
        
            const pswdMatch: boolean = await pswdInstance.passwordDecrypt(password, userValid.password);
            if (!pswdMatch) {
              this.msg = "Invalid Password..!!!";
              return this.sendErrorResponse(res, 0, this.msg);
            }
            
            // create JWT token
            const token: string = jwt.sign(
                { _id: userValid._id, username: userValid.username, accessTypeRole: userValid.designation, 
                allAccess: userValid.hasAllAccess, empCode: userValid.empCode, loginKey: 'other'}, 
                process.env.TOKEN_SECRET_KEY as string, 
                {
                    expiresIn: process.env.TOKEN_EXPIRY_TIME,
                });

            if (!token) {
                this.msg = "TOKEN_NOT_CREATED";
                return this.sendErrorResponse(res, 0, this.msg)
            } else {
                this.msg = "Login successful";
                return this.sendSuccessResponse(res, 1, this.msg, {token: token, designation: 'admin'})
            }
    })

}
export default AdminloginModel;