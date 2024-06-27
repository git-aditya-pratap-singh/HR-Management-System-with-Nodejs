import { Request, Response } from "express";
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import AlertService from "../../../helpers/AlertService";
import asyncHandler from "../../../utils/asyncHandler";
import NewMailFunctions from "../../../mail/mailFunctions.model";
import employeeDB from '../../../schema/employeedb.schema';


class UserloginModel extends AlertService{

    private msg: any = "";

    emailCheck = asyncHandler( async (req: Request, res: Response): Promise<any> => {

        const { email } = req.body;
        const emailValidation = this.validateEmail(email);

        const emailValid = emailValidation?.status;
        if (!emailValid) {
            this.msg = emailValidation?.message;
            return this.sendErrorResponse(res, 0, this.msg);
        }

        const emailData = await this.emailPresent(email);
        if (!emailData.status) {
            this.msg = emailData?.message;
            return this.sendErrorResponse(res, 0, this.msg);
        }

        const empCode = emailData?.data?.empCode;
        if (!empCode) {
            this.msg = "Employee not found!";
            return this.sendErrorResponse(res, 0, this.msg);
        }
        await this.generateOTP(emailData.data, res); 
    })

    private validateEmail = (validEmail: string): { status: boolean, message?: string } => {
        if(validEmail == null || validEmail == ""){
          return { status:false, message:'Email cannot be empty!' }
        }
        else if(!this.emailValid(validEmail)){
          return { status:false, message:'Please Enter a Valid Email-ID Ending With @bdsus.net or @crescdata.com!!'}
        }
        return {status:true}
    }

    // ------ email Structure --------
    emailValid = (email: string): boolean => {
        const pattern: RegExp =
            /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))@(bdsus\.net|crescdata\.com)$/i;
        return pattern.test(email);
    }

    //---------Email present ----
    private emailPresent = async (email: string): Promise<{ status: boolean, message?: string, data?: any }> => {
        var getResult = await employeeDB.findOne({
            status: { $ne: 'Ex-Employee' },
            $or: [
               { official_email_id_1: email },
               { official_email_id_2: email }
            ]
        },
        {
            empCode: 1,
            firstName: 1,
            match_email: {
                $cond: {
                    if: { $eq: ['$official_email_id_1', email] },
                    then: '$official_email_id_1',
                    else: '$official_email_id_2'
                }
            },
            otp: 1,
            otp_token: 1,
            status: 1,
            _id: 1
        })
        if(getResult == null){
            return { status: false, message: 'Email ID not found'}
        }
        return { status: true, data: getResult }
    } 

    
    private generateOTP = async(empinfo: any, res: Response): Promise<any> =>{
        let digits = '0123456789';
        let otpLength = 4;
        let otp = '';
        for(let i=1; i<=otpLength; i++){
            var index = Math.floor(Math.random()*(digits.length));
            otp = otp + digits[index];
        }

        if(otp === '' || otp === null){
            return this.sendErrorResponse(res, 0, "Faild to generate OTP!!")
        }
        const mailData = await this.sendOTPtoEmail(empinfo, otp, res);
        return this.sendDataResponse(res, 1, mailData)
    }

    private sendOTPtoEmail = async(empinfo: any, otp: string, res: Response): Promise<any> =>{
        try{
            const sendmail = new NewMailFunctions();
            let mailData = {};

            let temp = JSON.stringify(empinfo)
            const {empCode, firstName, match_email} = JSON.parse(temp);

            const toEmail = match_email;
            const subject: string = 'HRMS Login via OTP';
            const message: string = `<h1 style="font-weight:bold; font-style: italic; font-size:15px">Hello ${firstName},</h1>
            <p>Your OTP is ${otp}</p>
            <br><br>
            <p style="color: blue;">Best regards,<br>
            </p>`;

            if(!await this.storeOTPtoDB(empCode, otp, res)){
                return this.sendErrorResponse(res, 0, "Failed to Update OTP")
            }
            // chnages ToEmail here...............................................................
            const sent = await sendmail.newSmtpMail(toEmail, subject, message)
            if(!sent){
                return this.sendErrorResponse(res, 0, "Failed to sent OTP")
            }

            return mailData = {
                email: toEmail,
                sent: 1,
                empCode: empCode,
                msg: "Successfully otp sent"
            }

        }catch(err){
            return this.sendServerErrorResponse(res, 0, "SERVER_ERROR!!")
        }
    }

    private storeOTPtoDB = async(empCode: string, otp: string, res: Response): Promise<any> =>{

        const employee = await employeeDB.findOne({empCode: empCode});
        if(!employee){
            return this.sendErrorResponse(res, 0, "Employee Record Not Found To Store OTP");
        }

        const token = await this.genrateOTPtoken(empCode, otp)
        if(!token){
           return this.sendServerErrorResponse(res, 0, "OTP Token isn't Generate!!");
        }
        const saveOtp = await employeeDB.updateOne(
            {empCode: empCode},
            {$set: {
                otp_token: token,
                otp: otp
            }},
            {upsert: true, new: true}
        )
        if (!saveOtp) {
            return false;
        }
        return true;
    }

    private genrateOTPtoken = async(empCode: string, otp: string): Promise<string> =>{
        const token: string = jwt.sign({employeeCode: empCode, tokenOTP: otp}, 
            process.env.TOKEN_SECRET_KEY as string,
            {expiresIn: process.env.OTP_TOKEN_EXPIRY_TIME}
        )
        return token;
    }

    otpVerification = async(req: Request, res: Response): Promise<any>=>{
        const {email, empcode, enteredOtpCode} = req.body;
        const otpData = await this.emailPresent(email);
        if(!otpData){
            return this.sendErrorResponse(res, 0, "Data not found to match OTP!!")
        }
        await this.otpTokenVerification(otpData, enteredOtpCode, empcode, res);      
    }

    private otpTokenVerification = async(otpData: any, enteredOtpCode: any, empcode: string, res: Response): Promise<any> =>{
        try{
            let temp = JSON.stringify(otpData.data)
            const {empCode, match_email, otp, otp_token} = JSON.parse(temp);
            let successData = {}

            jwt.verify(otp_token, process.env.TOKEN_SECRET_KEY as string, (err: any, decode: any)=>{
                if(err){
                    return (err instanceof TokenExpiredError) ?
                    this.sendErrorResponse(res, 0, "OTP has expired. Please request a new OTP!")
                    : this.sendErrorResponse(res, 0, "OTP Token has been Corrupted!!")
                }else{
                    const {employeeCode, tokenOTP} = decode;
                    if(empcode !== employeeCode && empcode !== empCode){
                        return this.sendErrorResponse(res, 0, "Employee code not found!!");
                    }
                    if(enteredOtpCode !== otp && enteredOtpCode !== tokenOTP){
                        return this.sendErrorResponse(res, 0, "Please Enter Correct OTP!!");
                    }
                    successData = {
                        email: match_email,
                        empcode: empCode,
                        success: 'OTP Verified'
                    }
                    return this.sendDataResponse(res, 1, successData);
                }
            })
        }catch(error){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${error}`)
        }
    }

    userLogin = async(req: Request, res: Response): Promise<any>=>{
        const {email, empcode} = req.body;
        const userInfoOTP = await this.getUserByLoginPassOTP(req, res);

        let temp = JSON.stringify(userInfoOTP)
        let userInfo = JSON.parse(temp)

        if(userInfo.empCode === empcode && userInfo.match_email === email){
            const names: string[] = [userInfo.firstName, ` ${userInfo.middleName}` || '', ` ${userInfo.lastName}` || ''];
            const filteredNames: string[] = names.filter(name => name.length > 0);
            const name = filteredNames.join('');

            // create JWT token
            const token: string = jwt.sign(
                { _id: userInfo._id, username: name, accessTypeRole: 'employee', allAccess: '0', empCode: userInfo.empCode, loginKey: 'employee'}, 
                process.env.TOKEN_SECRET_KEY as string, 
                {
                    expiresIn: process.env.TOKEN_EXPIRY_TIME,
                });

            if (!token) {
                this.msg = "TOKEN_NOT_CREATED";
                return this.sendErrorResponse(res, 0, this.msg)
            }
            //let out = await new EmployeeModel().userRole('employee', res)
            this.msg = "Login successful";
            return this.sendSuccessResponse(res, 1, this.msg, {token: token, designation: 'employee'})
        }
        
    }

    private getUserByLoginPassOTP = async(req: Request, res: Response): Promise<any> =>{
        try{
            const {email, empcode} = req.body;
            const getDetailsOfUser = await employeeDB.findOne({
                empCode: empcode,
                $or: [
                  { official_email_id_1: email },
                  { official_email_id_2: email }
                ]
            },
            {
                empCode: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                status: 1,
                match_email: {
                    $cond: {
                        if: { $eq: ['$official_email_id_1', email] },
                        then: '$official_email_id_1',
                        else: '$official_email_id_2'
                    }
                }
            }
        );
            if(!getDetailsOfUser){
                return this.sendErrorResponse(res, 0, "Employee Details not Found!!")
            }
            return getDetailsOfUser;

        }catch(err){

        }
    }

}
export default UserloginModel;