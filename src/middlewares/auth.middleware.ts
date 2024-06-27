import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import dotenv from 'dotenv';
import AlertService from '../helpers/AlertService';

dotenv.config();
const BaseCtrl = new AlertService();

class UserAuthentication {
    
    public verifyToken = (req: Request, res: Response, next: NextFunction)=>{
        const token: string | undefined = req.header("Authorization"); 
       
        if (!token) {
            return BaseCtrl.sendErrorResponse(res, 0, 'Unauthorized HTTP, Token not provided!');
        }
        
        const jwtToken: string = token.replace("Bearer", "").trim();
        try {
            jwt.verify(jwtToken, process.env.TOKEN_SECRET_KEY as string, (err, decode)=>{
                if(err){
                    return (err instanceof TokenExpiredError) ? 
                    BaseCtrl.sendErrorResponse(res, 0, "Token expired, please log in again!")
                    : BaseCtrl.sendErrorResponse(res, 0, "Authentication failed!");  
                }
                else{
                    const {_id, username, accessTypeRole, allAccess, empCode, loginKey}:any = decode;
                    const payload = {_id, username, accessTypeRole, allAccess, empCode, loginKey};
                    res.locals.auth = payload
                    console.log(payload)
                    next();
                }
            });
        } catch (err) {
            return BaseCtrl.sendServerErrorResponse(res, 0, 'Server Error!');
        }
    }
}

export default UserAuthentication;