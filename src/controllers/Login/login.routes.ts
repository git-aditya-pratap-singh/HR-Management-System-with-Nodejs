import express from "express";
import AdminloginModel from "./modules/admin.login.model";
import UserloginModel from "./modules/user.login.model";

const loginRouter = express.Router();

// Define route paths
const ADMIN_AUTH_LOGIN = new AdminloginModel();
const USER_AUTH_LOGIN = new UserloginModel();

// ---------action => /login /emailCheck /otpVerification / userLogin------------------
loginRouter.post('/login', ADMIN_AUTH_LOGIN.login);

loginRouter.post('/emailCheck', USER_AUTH_LOGIN.emailCheck);
loginRouter.post('/otpVerification', USER_AUTH_LOGIN.otpVerification);
loginRouter.post('/userLogin', USER_AUTH_LOGIN.userLogin);

export default loginRouter;
