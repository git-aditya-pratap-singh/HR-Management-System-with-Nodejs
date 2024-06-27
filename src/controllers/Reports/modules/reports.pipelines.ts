import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import CommonServices from "../../../helpers/common.services";
import DateCalculations from "../../../helpers/dateCalculate.services";
import AlertService from "../../../helpers/AlertService";

import employeeDB from "../../../schema/employeedb.schema";
import punchRecordDB from "../../../schema/punchRecordDb.schema";

class ReportQuery extends AlertService{

    public selectiveTimeSheetQueryPipelines = async(req: Request, res: Response): Promise<any>=>{

        const user = res?.locals?.auth;
        let selectiveTimeSheetPipelines: any[] = [];             //1566239400
        const {fromDate, toDate, employeeFilter, departmentFilter, locationFilter, shiftFilter, subLocationFilter, teamLeadFilter, managerFilter} = req.body.data;


        //console.log("DATE---->>>",await new DateCalculations().dateConvertIntoTimeStamp(fromDate))
       

        if(fromDate){
          selectiveTimeSheetPipelines.push(
            {'$match': {'date': {'$eq': 1692210600}} }
          )
        }

        // if(toDate){
        //   selectiveTimeSheetPipelines.push(
        //     {'$match': {'date': {'$eq': Math.floor(toDate / 1000)}} }
        //   )
        // }

        if(user.accessTypeRole !== 'admin' && employeeFilter.length === 0){
          
            selectiveTimeSheetPipelines.push(
              {
                '$and': [
                   { 'userId': { '$in': await employeeDB.find({
                     '$or': [{ 'reportingPerson': user.empCode },{ 'teamLead': user.empCode}]
                   })}
                  }
                ]
              }
            )
        }

        if(employeeFilter.length > 0){
          selectiveTimeSheetPipelines.push(
            {'$match': {'userId': {'$in': await employeeFilter.map((items: any) => items.item) }} }
          )
        }
        
        selectiveTimeSheetPipelines.push(
            {
              '$lookup': {                 
                'from': 'employees', 'localField': 'userId', 'foreignField': 'empCode', 'as': 'employee'
              }
            },
 
            {'$unwind': {'path': '$employee', 'preserveNullAndEmptyArrays': true}}, 

            ...(shiftFilter.length > 0 ? [
              {
                '$lookup': {
                  'from': 'shifts', 'localField': 'shiftId', 'foreignField': '_id', 'as': 'shift',
                  'pipeline': [
                      {
                        '$match': {
                          '$expr': {'$in': ["$_id", await shiftFilter.map((item: any) => new ObjectId(item._id))]}
                        }
                      }
                  ]
                }
            },
            ] : [
              {
                '$lookup': {                 
                  'from': 'shifts', 'localField': 'shiftId', 'foreignField': '_id', 'as': 'shift'
                }
              }
            ]),

            {'$unwind': {'path': '$shift', 'preserveNullAndEmptyArrays': true}}, 

            
            ...(subLocationFilter.length > 0 ? [
              {
                '$lookup': {                 
                  'from': 'sublocations', 'localField': 'subLocationId', 'foreignField': '_id', 'as': 'sublocation',
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {'$in': ["$_id", await subLocationFilter.map((item: any) => new ObjectId(item._id))]}
                      }
                    }]
                }
            }
            ] : [
              {
                '$lookup': {
                  'from': 'sublocations', 'localField': 'subLocationId', 'foreignField': '_id', 'as': 'sublocation'
                }
              }
            ]),

            {'$unwind': {'path': '$sublocation', 'preserveNullAndEmptyArrays': true}},

            ...(locationFilter.length > 0 ? [
              {
                '$lookup': {                 
                  'from': 'locations', 'localField': 'sublocation.locationId', 'foreignField': '_id', 'as': 'location',
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {'$in': ["$_id", await locationFilter.map((item: any) => new ObjectId(item._id))]}
                      }
                    }]
                }
            }
            ] : [
              {
                '$lookup': {                 
                  'from': 'locations', 'localField': 'sublocation.locationId', 'foreignField': '_id', 'as': 'location'
                }
              }
            ]),
            
            {'$unwind': {'path': '$location', 'preserveNullAndEmptyArrays': true}}, 

             
            ...(departmentFilter.length > 0 ? [
              {
                '$lookup': {
                  'from': 'departments', 'localField': 'employee.departmentId', 'foreignField': '_id', 'as': 'department',
                  'pipeline': [
                      {
                        '$match': {
                          '$expr': {'$in': ["$_id", await departmentFilter.map((item: any) => new ObjectId(item._id))]}
                        }
                      }
                   ]
                }
            }
            ] : [
              {
                '$lookup': {                 
                  'from': 'departments', 'localField': 'employee.departmentId', 'foreignField': '_id', 'as': 'department'
                }
              }
            ]),

            {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true}}, 

            {
                '$lookup': {
                  'from': 'employees', 'localField': 'employee.reportingPerson', 'foreignField': 'empCode', 'as': 'reportingManager'
                }
            }, 
            {'$unwind': {'path': '$reportingManager', 'preserveNullAndEmptyArrays': true}}, 
            {
                '$lookup': {
                  'from': 'employees', 'localField': 'employee.teamLead', 'foreignField': 'empCode', 'as': 'TeamLead'
                }
            }, 
            {'$unwind': {'path': '$TeamLead', 'preserveNullAndEmptyArrays': true}}, 
            {
                '$project': {
                  'userId': 1, 'firstName': '$employee.firstName', 'middleName': '$employee.middleName', 'lastname': '$employee.lastName', 
                  'departmentName': '$department.name', 'locationName': '$location.name', 'subLocationId': '$sublocation._id', 
                  'sublocationName': '$sublocation.name', 'date': '$date', 'punch': 1, 'locationId': '$location._id', 'outTime': '$shift.outTime', 
                  'Reporting_Manager': {
                    '$concat': ['$reportingManager.firstName', {
                        '$cond': {
                          'if': {'$eq': ['$reportingManager.middleName', null]}, 
                          'then': '', 
                          'else': {'$concat': [' ', '$reportingManager.middleName']}
                        }
                      }, '$reportingManager.lastName'
                    ]
                  }, 
                  'TeamLead_Name': {
                    '$concat': ['$TeamLead.firstName', {
                        '$cond': {
                          'if': {'$eq': ['$TeamLead.middleName', null]}, 
                          'then': '', 
                          'else': {
                            '$concat': [' ', '$TeamLead.middleName']}
                        }
                      }, '$TeamLead.lastName'
                    ]
                  }
                }
              }
        );

        try{
           const pipelineExecution =  await punchRecordDB.aggregate(selectiveTimeSheetPipelines);
           return pipelineExecution;
        }catch(err){
           this.sendServerErrorResponse(res, 0, `SERVER_ERROR!!${err}`);
        }
    }
}
export default ReportQuery;