// auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import AlertService from '../helpers/AlertService';
import Isnotpermissions from '../utils/permission.services';

class AuthPermission extends AlertService {

    public permission = (requiredModel: string, requiredPermission: string) => { 
        return async (req: Request, res: Response, next: NextFunction) => {

            const user = res.locals.auth;
            const userPermissions = Isnotpermissions[user.accessTypeRole];
           
            if (Array.isArray(userPermissions)) {
                if (userPermissions.includes('*')) {
                    next();
                }
            }else if (userPermissions && userPermissions[requiredModel]) {
                if (userPermissions[requiredModel].includes(requiredPermission)) {
                    this.sendErrorResponse(res, 0, "You aren't authorized!!");
                    //res.redirect('http://localhost:4200');
                }
                else{
                    next();
                }
            } 
        };
    }
}

export default AuthPermission;
