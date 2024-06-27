import { Response } from "express";
import { ObjectId } from 'mongodb';
import employeeDB from "../../../schema/employeedb.schema";
import userlocationDB from "../../../schema/userlocationdb.schema";
import AlertService from "../../../helpers/AlertService";

class EmployeeListQuery extends AlertService {

    async getLocationAccessList(empCode: string): Promise<any> {
      try{
        const getlocAccList = await userlocationDB.find({ is_enabled: '1', empCode: empCode });
        return getlocAccList.map(loc => loc.locationId);
      }catch(err){
        //return this.serverErr(res, 0, "SERVER_ERROR!!");
      }
    }
        
    getAllEmployeeQueryList = async (res: Response): Promise<any> => {

        let queryPipeline: any = {};

        if (res.locals.auth.accessTypeRole === "Manager" || res.locals.auth.accessTypeRole === "teamleader") {
            queryPipeline = {
                $match: {$and: [
                            { $or: [{ reportingPerson: res.locals.auth.empCode }, { teamLead: res.locals.auth.empCode }] },
                            { $or: [{ status: { $ne: 'Ex-Employee' } }, { empCode: res.locals.auth.empCode }] },
                        ]}
                };

                if(res.locals.auth.allAccess == 1){
                    const locationAccessList = await this.getLocationAccessList(res.locals.auth.empCode);
                    queryPipeline = [{'$match': {'$and': [
                                    {'$or': [{'reportingPerson': res.locals.auth.empCode}, {'teamLead': res.locals.auth.empCode}]},
                                    {'$or': [{'status': {'$ne': 'Ex-Employee'}}, {'empCode': res.locals.auth.empCode}]}
                                ]
                            }
                        }, {'$match': {'locationId': {'$in': locationAccessList }}}
                    ]
                    const [subqueryPipeline_1, subqueryPipeline_2] = queryPipeline;  // Distructure array of pipline...
                    return await this.getEmployeeList(subqueryPipeline_1, res, subqueryPipeline_2)
                } 

        }else if (res.locals.auth.accessTypeRole === "itsupport" || res.locals.auth.accessTypeRole === "admin") {
          queryPipeline = { $match: {'status': {'$in': [ 'Confirmed', 'Probation', 'Notice Period', 'Ex-Employee']}} };
        }
        return await this.getEmployeeList(queryPipeline, res);
    }


    getEmployeeQueryList = async (res: Response): Promise<any> =>{

        let queryPipeline: any = {};

        if (res.locals.auth.accessTypeRole === "employee") {
            queryPipeline = {
                $match: { 'status': { $ne: 'Ex-Employee' }, 'empCode': res.locals.auth.empCode }
            };
        }

        else if (res.locals.auth.accessTypeRole === "itsupport" || res.locals.auth.accessTypeRole === "admin") {
            queryPipeline = { $match: { 'status': { $ne: 'Ex-Employee' } } };
        }

        else if (res.locals.auth.accessTypeRole === "Manager" || res.locals.auth.accessTypeRole === "teamleader") {
            queryPipeline = {
                $match: {
                    $and: [
                        { $or: [{ reportingPerson: res.locals.auth.empCode }, { teamLead: res.locals.auth.empCode }] },
                        { $or: [{ status: { $ne: 'Ex-Employee' } }, { empCode: res.locals.auth.empCode}] }, 
                    ]
                }
            }

            if(res.locals.auth.allAccess == 1){
                const locationAccessList = await this.getLocationAccessList(res.locals.auth.empCode);
                queryPipeline = [
                    {'$match': {'$and': [
                                {'$or': [{'reportingPerson': res.locals.auth.empCode }, {'teamLead': res.locals.auth.empCode }]},
                                {'$or': [{'status': {'$ne': 'Ex-Employee'}}, {'empCode': res.locals.auth.empCode }]}
                            ]
                        }
                    }, {'$match': {'locationId': {'$in': locationAccessList }}}
                ]
                const [subqueryPipeline_1, subqueryPipeline_2] = queryPipeline;  // destructuring array of pipline...
                return await this.getEmployeeList(subqueryPipeline_1, res, subqueryPipeline_2)
            }
        }
        return await this.getEmployeeList(queryPipeline, res);
    }

    getEmployeeList = async(queryPipeline: any, res: Response, subqueryPipeline?: any): Promise<any> =>{
        try {
            const empList_Pipeline = [
                
                queryPipeline,
                ...(subqueryPipeline ? [subqueryPipeline] : []),  // SubQueryPipeline check empty or not and destructuring

                { $lookup: { from: 'employees', localField: 'reportingPerson', foreignField: 'empCode', as: 'reportingManager' } },
                { $lookup: { from: 'employees', localField: 'teamLead', foreignField: 'empCode', as: 'reportingteamLead' } },
                { $lookup: { from: 'departments', localField: 'departmentId', foreignField: '_id', as: 'department' } },
                { $lookup: { from: 'shifts', localField: 'shiftId', foreignField: '_id', as: 'shift' } },
                { $lookup: { from: 'locations', localField: 'locationId', foreignField: '_id', as: 'location' } },
                { $unwind: '$reportingManager' },
                { $unwind: '$reportingteamLead' },
                { $unwind: '$department' },
                { $unwind: '$shift' },
                { $unwind: '$location' },
                {
                    $project: {
                        '_id': 1, 'empCode': 1, 'tempCode': 1, 'firstName': 1, 'middleName': 1, 'lastName': 1,
                        'departmentId': 1, 'shiftId': 1, 'locationId': 1, 'gender': 1, 'dateOfBirth': 1, 'dateOfJoining': 1,
                        'dateOfConfirmation': 1, 'isReportingManager': 1, 'isTeamLead': 1, 'officialEmailId_1': 1,
                        'officialEmailId_2': 1, 'personalEmail': 1, 'extension': 1, 'status': 1, 'departmentList': '$department.name',
                        'shiftList': '$shift.name', 'LocList': '$location.name',
                        'Reporting_Manger': {
                            $concat: [
                                '$reportingManager.firstName',
                                { $cond: { if: { $eq: ['$reportingManager.middleName', null] }, then: '', else: { $concat: [' ', '$reportingManager.middleName'] } } },
                                '$reportingManager.lastName'
                            ]
                        },
                        'TeamLead': {
                            $concat: [
                                '$reportingteamLead.firstName',
                                { $cond: { if: { $eq: ['$reportingteamLead.middleName', null] }, then: '', else: { $concat: [' ', '$reportingteamLead.middleName'] } } },
                                '$reportingteamLead.lastName'
                            ]
                        }
                    }
                },
                { $sort: { 'empCode': 1 } }
            ];
            return await employeeDB.aggregate(empList_Pipeline);
        } catch (err) {
            return this.sendServerErrorResponse(res, 0, "SERVER_ERROR");
        }
    }
}

export default EmployeeListQuery;
