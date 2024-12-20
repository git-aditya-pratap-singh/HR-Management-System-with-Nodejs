import {NextFunction, Request, Response} from "express";
import AlertService from "../helpers/AlertService";

const asyncHandler = (func: Function) =>
    async(req: Request, res: Response, next: NextFunction) =>{
        try{
            await func(req, res, next)
        }catch(err){
           return new AlertService().sendServerErrorResponse(res, 0, `SERVER_ERROR! ${err}`)
        }
    }
    

export default asyncHandler;