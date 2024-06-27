import { Request, Response } from "express";
import employeeDB from "../../../schema/employeedb.schema";
import DepartmentModel from "../../Departments/modules/department.model";
import ShiftModel from "../../Shifts/modules/shift.model";
import UserloginModel from "../../Login/modules/user.login.model";
import userlocationDB from "../../../schema/userlocationdb.schema";

import { Output } from "./employee.interface";
import EmployeeListQuery from "./employee.pipeline_stages";
import AlertService from "../../../helpers/AlertService";

class EmployeeModel extends AlertService{

    private msg: any = "";
    public key: boolean = false;

    public out: any = {
        access: false,
        itDetails : false,
        employeeOnly: false,
        name: ''
    }
    
    userRole = (req: Request, res: Response): any =>{//userrole: string
        switch(res.locals.auth.accessTypeRole){
            case 'admin':
                this.out.access = true;
                this.out.itDetails = false;
                this.out.employeeOnly = false;
                break;
            case 'itsupport':
                this.out.access = false; 
                this.out.itDetails = true;
                this.out.employeeOnly = false;
                break;
            case 'employee':
                this.out.access = false;
                this.out.itDetails = false;
                this.out.employeeOnly = true;
                break;
            default:
                this.out.access = false;
                this.out.itDetails = false;
                this.out.employeeOnly = false;
                break;
        }
        this.out.name = res.locals.auth.username;
        //return this.out
        return this.sendDataResponse(res, 1, this.out)
    }
    
    getAllTeamLeads = async (req: Request, res: Response): Promise<any> =>{
        const teamleadList = await employeeDB.find({ 
            isTeamLead: "1", 
            status: { $ne: "Ex-Employee" } 
        }).sort({ empCode: 1 });
        return this.sendDataResponse(res, 1, teamleadList)
    }

    getAllReportingManagers = async (req: Request, res: Response): Promise<any> =>{
        const managersList = await employeeDB.find({ 
            isReportingManager: "1", 
            status: { $ne: "Ex-Employee" } 
        }).sort({ empCode: 1 }); 
        return this.sendDataResponse(res, 1, managersList)
    }

    employeeBadgeExists = async(id: any, res: Response): Promise<any> =>{
        try{
            const result = await employeeDB.find({IdCard_ID: {$eq: id}});
                return (!Array.isArray(result) || result.length === 0) ? false : true;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }   
    }

    employeeExists = async(empCode: any, res: Response): Promise<any> =>{
        try{
            const result = await employeeDB.find({empCode: {$eq: empCode}});
                return (!Array.isArray(result) || result.length === 0) ? false : true;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }   
    }

    employeeEmailExists = async(email: any, res: Response): Promise<any> =>{
        try{
            const result = await employeeDB.findOne({ $or: [ {officialEmailId_1: {$eq: email}}, {officialEmailId_2: {$eq: email}}] });
                return (result) ? true : false;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }   
    }

    tempEmployeeExists = async(tempCode: any, res: Response): Promise<{ status: boolean, data?: any }> =>{
        const result = await employeeDB.findOne({tempCode: {$eq: tempCode}});
            return (result?.tempCode) ? {status: true, data: result} : {status: false};      
    }


    isActiveEmployee = async(empCode: any, res: Response): Promise<any> =>{
        try{
            const result = await employeeDB.find({empCode: {$eq: empCode}, status: {$ne: 'Ex-Employee'}});
                return (!Array.isArray(result) || result.length === 0) ? false : true;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }   
    }

    getEmployeeDetailByCode = async (req: Request, res: Response): Promise<any> =>{
        try{
            const detailsbyCode = await employeeDB.findOne({empCode: req.body.empCode}); 
            return this.sendDataResponse(res, 1, detailsbyCode);
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }
    }

    getLocationEmployeeAccessList = async (empCode: string, res: Response): Promise<any> =>{
        try{
            const employee = await employeeDB.findOne({ 
                empCode: {$eq: empCode}, 
                status: {$ne: 'Ex-Employee'}
            }, {_id: 0, locationId: 1}
        );
            return employee ? employee.locationId : null;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`)
        }
    }

    getLocationAccessList = async (empCode: string, res: Response): Promise<any> =>{
        try{
            const locationAccess = await userlocationDB.find({
                is_enabled: {$eq: "1"}, 
                empCode: {$eq: empCode}},
                {_id: 0, locationId: 1}
            );
            return locationAccess ? locationAccess.map((loc: any) => loc.locationId) : null;
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR_${err}!!`);
        }
    }


    getActiveEmployeeListForFilter = async (req: Request, res: Response): Promise<any> => {
        let queryPipelines: any[] = [];
    
        if (res.locals.auth.accessTypeRole === "admin") {
    
            if (res.locals.auth.allAccess == '0') {
                const userFLocList = await new EmployeeListQuery().getLocationAccessList(res.locals.auth.empCode);
                queryPipelines.push({ 'locationId': { '$in': userFLocList } });
            }
            queryPipelines.push({ status: { $ne: 'Ex-Employee' } });
    
        } else {
    
            if (res.locals.auth.loginKey === "employee" && (res.locals.auth.allAccess == '0')) {
                const empLocation = await this.getLocationEmployeeAccessList(res.locals.auth.empCode, res);
                queryPipelines.push({ 'locationId': { '$in': empLocation } });
            } 
            else if (res.locals.auth.loginKey === "other" && (res.locals.auth.allAccess == '0')) {
                const userFLocList = await this.getLocationAccessList(res.locals.auth.empCode, res);
                queryPipelines.push({ 'locationId': { '$in': userFLocList } });
            }
            queryPipelines.push({
                $and: [
                    { $or: [{ 'reportingPerson': res.locals.auth.empCode }, { 'teamLead': res.locals.auth.empCode }] },
                    { $or: [{ 'status': { $ne: 'Ex-Employee' } }, { 'empCode': res.locals.auth.empCode}] }
                ]
            });
        }
    
        const query = queryPipelines.length > 1 ? { $and: queryPipelines } : queryPipelines[0];
        
        try {
            const activeEmployeeList = await employeeDB.find(query).sort({ firstName: 1 });
            const formattedList = activeEmployeeList.map(value => ({
                item: value.empCode,
                itemName: `${value.firstName} ${value.middleName ? value.middleName + ' ' : ''} ${value.lastName || ''}`
            }));
            
            return this.sendDataResponse(res, 1, formattedList);
        } catch (error) {
            return this.sendServerErrorResponse(res, 0, "Error retrieving employee list");
        }
    }
    

    getEXEmployeeListForFilter = async (res: Response): Promise<any> =>{
        try{
            let pipeline: any[] = [];
            const reportingPerson = res.locals.auth.empCode;

            if(res.locals.auth.accessTypeRole === "admin"){
                pipeline.push({status: {$eq: 'Ex-Employee'}});
            }else{
                pipeline.push({'$and': [{'$or': [
                    {'reportingPerson': {'$eq': reportingPerson}},
                    {'teamLead': {'$eq': reportingPerson }},
                    {'empCode': {'$eq': reportingPerson}}
                ]},
                {'status': {$eq: 'Ex-Employee'}}
            ] })
            }
            
            const [pipelineexe] = pipeline;  // Array Destructuring...
            const ExemployeeList = await employeeDB.find(pipelineexe).sort({ firstName: 1 });
            const formattedExList = ExemployeeList.map(value => ({
                item: value.empCode,
                itemName: `${value.firstName} ${value.middleName ? value.middleName + ' ' : ''} ${value.lastName || ''}`
            }));
            return this.sendDataResponse(res, 1, formattedExList);
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}`);
        }
    }
    

    getEmployeeList = async (req: Request, res: Response): Promise<any> =>{
        try{
            const employeeList = await new EmployeeListQuery().getEmployeeQueryList(res);

            let access = (res.locals.auth.accessTypeRole === 'admin') ? true : false; 
            let itsupportAccess = (res.locals.auth.accessTypeRole === 'itsupport') ? true : false; 
            let employeeAccess = (res.locals.auth.accessTypeRole === 'employee') ? true : false; 

            return this.sendDataResponse(res, 1, {employeeList, access, itsupportAccess, employeeAccess});
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}`);
        }
    }

    getallEmployeeList = async (req: Request, res: Response): Promise<any> =>{
        try{
           const employeeAllList = await new EmployeeListQuery().getAllEmployeeQueryList(res);

           let access = (res.locals.auth.accessTypeRole === 'admin') ? true : false; 
           let itsupportAccess = (res.locals.auth.accessTypeRole === 'itsupport') ? true : false; 

           return this.sendDataResponse(res, 1, {employeeAllList, access, itsupportAccess})
        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}`);
        }
    }

    addEmployee = async (req: Request, res: Response): Promise<any> =>{
        this.key = true;
        await this.userAccessType(req, res) ? await this.formValidation(req, res) ? await this.insertEmployee(req, res) : null : null;
    }

    editEmployee = async (req: Request, res: Response): Promise<any> =>{
        this.key = false;
        await this.userAccessType(req, res) ? await this.formValidation(req, res) ? await this.updateEmployee(req, res) : null : null;
    }

    private userAccessType = async (req:Request, res:Response): Promise<any> =>{
        if(res.locals.auth.accessTypeRole !== 'admin'){
            if(req.body.action === 'addEmployee'){
                return this.sendErrorResponse(res, 0, 'Only the administrator is authorized to add employees!!');
            }
        }
        if(res.locals.auth.accessTypeRole === 'Manager' || res.locals.auth.accessTypeRole === 'teamleader' || res.locals.auth.accessTypeRole === 'employee'){
            if(req.body.action === 'editEmployee'){
                return this.sendErrorResponse(res, 0, 'Only the administrator is authorized to edit employees!!');
            }
        }
        if(res.locals.auth.accessTypeRole === 'itsupport'){
            if(req.body.action === 'editEmployee'){
                try{
                    const {IdCard_ID, empCode, firstName, middleName, lastName, gender, dateOfBirth, dateOfJoining, probationDays, dateOfConfirmation, isTeamLead, isReportingManager, reportingPerson, 
                      official_email_id_1, official_email_id_2, personal_email, teamLead, departmentId, shiftId, locId, extension, status, tempCode} = req.body;
                   
                    const empData: any = await employeeDB.findOne({empCode: {$eq: empCode}});
                    
                    // Developed krna hai----
                    if(IdCard_ID !== empData?.IdCard_ID || empCode !== empData?.empCode || firstName !== empData?.firstName || middleName !== empData?.middleName
                        || lastName !== empData?.lastName || gender !== empData?.gender || dateOfBirth !== empData?.dateOfBirth.toISOString().split('T')[0] 
                        || dateOfJoining !== empData?.dateOfJoining.toISOString().split('T')[0]
                        || probationDays !== empData?.probationDays || dateOfConfirmation !== empData?.dateOfConfirmation.toISOString().split('T')[0] 
                        || isTeamLead !== empData?.isTeamLead 
                        || isReportingManager !== empData?.isReportingManager || reportingPerson !== empData?.reportingPerson || teamLead !== empData?.teamLead
                        || departmentId !== empData?.departmentId || shiftId !== empData?.shiftId || locId !== empData?.locationId || official_email_id_1 !== empData?.official_email_id_1
                        || official_email_id_2 !== empData?.official_email_id_2 || personal_email !== empData?.personal_email || extension !== empData?.extension
                        || status !== empData?.status) 
                    {
                        return this.sendErrorResponse(res, 0, "IT-Support has only tempcode update authorized!!")
                    }

                    return true;
                }catch(err){
                    return this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}`);
                }
            }
        }
        return true
    }

    private formValidation = async (req:Request, res:Response): Promise<any> =>{
        const {IdCard_ID, empCode, firstName, middleName, lastName, gender, dateOfBirth, dateOfJoining, probationDays, isTeamLead, isReportingManager, reportingPerson, 
            official_email_id_1, official_email_id_2, personal_email, teamLead, departmentId, shiftId, locId, extension, status, tempCode} = req.body;

        if(!IdCard_ID){
            return this.sendErrorResponse(res, 0, "Please Enter Employee Badge.")
        }
        if(isNaN(IdCard_ID)){
            return this.sendErrorResponse(res, 0, "Employee Badge should be numeric.")
        }

        if(this.key == true){    
            if(await this.employeeBadgeExists(IdCard_ID, res)){
                return this.sendErrorResponse(res, 0, "Employee Badge Code Used.")
            }
        }
        
        if(!empCode){
            return this.sendErrorResponse(res, 0, "Employe Code cannot be empty.")
        }

        if(this.key == true){
            if(await this.employeeExists(empCode, res)){
                return this.sendErrorResponse(res, 0, "Employee Code Used.")
            }
        }
        
        if(!firstName){
            return this.sendErrorResponse(res, 0, "First Name cannot be empty.")
        }
        if(!gender){
            return this.sendErrorResponse(res, 0, "Please Select Gender")
        }
        if(!dateOfBirth){
            return this.sendErrorResponse(res, 0, "Invalid Date found for Date of Birth.")
        }
        if(!dateOfJoining){
            return this.sendErrorResponse(res, 0, "Invalid Date found for Date of Joining.")
        }
        if(!probationDays){
            return this.sendErrorResponse(res, 0, "Please enter the Probation Period.!")
        }
        if(isNaN(probationDays) || probationDays <= 0){
            return this.sendErrorResponse(res, 0, "Probation days should be numberic and non negative.")
        }
        if(!isTeamLead){
            return this.sendErrorResponse(res, 0, "Please! Choose is this Team Lead or Not.")
        }
        if(!isReportingManager){
            return this.sendErrorResponse(res, 0, "Please! Choose is this Manager or Not.")
        }
        if(!reportingPerson){
            return this.sendErrorResponse(res, 0, "Please select Reporting manager.!")
        }

        if(!await this.isActiveEmployee(reportingPerson, res)){
            return this.sendErrorResponse(res, 0, "Reporting Person has no longer employed by our organization!!")
        }

        if(!official_email_id_1){
            return this.sendErrorResponse(res, 0, "Please! enter the Official email-1")
        }
        if(!await new UserloginModel().emailValid(official_email_id_1)){
            return this.sendErrorResponse(res, 0, "Please Enter a Valid Email-ID Ending With @bdsus.net or @crescdata.com!!")
        }

        if(this.key == true){
            if(await this.employeeEmailExists(official_email_id_1, res)){
                return this.sendErrorResponse(res, 0, "This email is already registered!!")
            }
        }
       
        if(isTeamLead === '0'){
            if(!teamLead){
                return this.sendErrorResponse(res, 0, "Please Select Team-Lead.!")
            }  
        }
        if(!departmentId){
            return this.sendErrorResponse(res, 0, "Please Select Department.!")
        }
        if(!await new DepartmentModel().isActiveDepartment(departmentId)){
            return this.sendErrorResponse(res, 0, "Selected department is not an active department.!")
        }

        if(!shiftId){
            return this.sendErrorResponse(res, 0, "Please Select Shift.!")
        }
        if(!await new ShiftModel().isActiveShift(shiftId)){
            return this.sendErrorResponse(res, 0, "Selected shift is not an active shift.!")
        }
        
        if(!locId){
            return this.sendErrorResponse(res, 0, "Please Select Location.!")
        }
        if(!status){
            return this.sendErrorResponse(res, 0, "Please Select Status.!")
        }
        if(tempCode !== ''){
            const checkResult = await this.tempEmployeeExists(tempCode, res);
            if(checkResult?.status === true){
                const employeeData = checkResult?.data;
                return this.sendErrorResponse(res, 0, `Temporary code ${tempCode} already used for employee -> ${employeeData.empCode} ${employeeData.firstName} 
                ${employeeData.middleName} ${employeeData.lastName}`)
            }
        }
        return true;   
    }

    private insertEmployee = async (req: Request, res: Response): Promise<any> =>{
        const {IdCard_ID, empCode, firstName, middleName, lastName, gender, dateOfBirth, dateOfJoining, probationDays, isTeamLead, isReportingManager, reportingPerson, 
            official_email_id_1, official_email_id_2, personal_email, teamLead, departmentId, shiftId, locId, extension, status, tempCode} = req.body;
            
        const joinDate = new Date(dateOfJoining);
        const dateOfConfirmation = new Date(joinDate.getTime() + (probationDays * 24 * 60 * 60 * 1000));
        const dateOfConfirmationEMP = dateOfConfirmation.toISOString().slice(0, 10);

        (middleName === undefined) ? '' : middleName;
        (lastName === undefined) ? '' : lastName;
        (official_email_id_2 === undefined) ? '' : official_email_id_2;
        (personal_email === undefined) ? '' : personal_email;
        (teamLead === undefined) ? '' : teamLead;
        (extension === undefined) ? '' : extension;
        (tempCode === undefined) ? '' : tempCode;

        const insertEmployeeData = await new employeeDB({
            IdCard_ID: IdCard_ID,
            empCode: empCode,
            tempCode: tempCode,
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            gender: gender,
            dateOfBirth: dateOfBirth,
            dateOfJoining: dateOfJoining,
            probationDays: probationDays,
            dateOfConfirmation: dateOfConfirmationEMP,
            isTeamLead: isTeamLead,
            isReportingManager: isReportingManager,
            reportingPerson: reportingPerson,
            teamLead: teamLead,
            departmentId: departmentId,
            shiftId: shiftId,
            extension: extension,
            status: status,
            personal_email: personal_email,
            official_email_id_1: official_email_id_1,
            official_email_id_2: official_email_id_2,
            locationId: locId,
        });
        insertEmployeeData.save()
        .then(saveData =>{
            return this.sendSuccessResponse(res, 1, "Data saved successfully!");
        })
        .catch(err =>{
            return this.sendErrorResponse(res, 0, "Data has not been saved!");
        })
    }

    private updateEmployee = async(req: Request, res: Response): Promise<any> =>{
        try{
            const {IdCard_ID, empCode, firstName, middleName, lastName, gender, dateOfBirth, dateOfJoining, probationDays, isTeamLead, isReportingManager, reportingPerson, 
                official_email_id_1, official_email_id_2, personal_email, teamLead, departmentId, shiftId, locId, extension, status, tempCode} = req.body;

            const joinDate = new Date(dateOfJoining);
            const dateOfConfirmation = new Date(joinDate.getTime() + (probationDays * 24 * 60 * 60 * 1000));
            const dateOfConfirmationEMP = dateOfConfirmation.toISOString().slice(0, 10);

            const updateEmployeeData = await employeeDB.updateOne(
                {empCode: empCode},
                {$set: 
                    {
                    IdCard_ID: IdCard_ID,
                    empCode: empCode,
                    tempCode: tempCode,
                    firstName: firstName,
                    middleName: middleName,
                    lastName: lastName,
                    gender: gender,
                    dateOfBirth: dateOfBirth,
                    dateOfJoining: dateOfJoining,
                    probationDays: probationDays,
                    dateOfConfirmation: dateOfConfirmationEMP,
                    isTeamLead: isTeamLead,
                    isReportingManager: isReportingManager,
                    reportingPerson: reportingPerson,
                    teamLead: teamLead,
                    departmentId: departmentId,
                    shiftId: shiftId,
                    extension: extension,
                    status: status,
                    personal_email: personal_email,
                    official_email_id_1: official_email_id_1,
                    official_email_id_2: official_email_id_2,
                    locationId: locId,
                    }
                },{upsert: true});

                return updateEmployeeData
                ? this.sendSuccessResponse(res, 1, `Employee Data Updated!`)
                : this.sendErrorResponse(res, 0, `Failed to update employee data.`);

        }catch(err){
            return this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}`);
        }
    }
}

export default EmployeeModel; 