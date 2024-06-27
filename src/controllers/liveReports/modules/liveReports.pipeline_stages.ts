import { Response } from "express";
import { ObjectId } from 'mongodb';
import AlertService from "../../../helpers/AlertService";
import DateCalculations from "../../../helpers/dateCalculate.services";
import CommonServices from "../../../helpers/common.services";

import employeeDB from "../../../schema/employeedb.schema";
import userlocationDB from "../../../schema/userlocationdb.schema"
import punchRecordDB from "../../../schema/punchRecordDb.schema";
import sublocationDB from "../../../schema/sublocationdb.schema";
import seatsDB from "../../../schema/seatsdb.schema";

const DATE_CALC = new DateCalculations();

class LiveReportsQuery extends AlertService {


    getSublocationSeatsStatusPipeline_Stages_1 = async(id: any, res: Response): Promise<any> =>{
      const subLocationPipeline = [
          {'$match': {'subLocationId': {'$eq': new ObjectId(id)}}},
          {
            '$lookup': {
              'from': 'employees', 'localField': 'empCode', 'foreignField': 'empCode', 'as': 'employee'
            }
          },
          {'$unwind': {'path': '$employee', 'preserveNullAndEmptyArrays': true}},
          {
            '$lookup': {
              'from': 'shifts', 'localField': 'employee.shiftId', 'foreignField': '_id', 'as': 'shift'
            }
          },
          {'$unwind': {'path': '$shift', 'preserveNullAndEmptyArrays': true}}, 
          {
            '$project': {
              '_id': 0, 'subLocationId': 1, 'shiftId': '$employee.shiftId', 'meanTime': '$shift.meanTime', 'name': '$shift.name'
            }
          }
        ]
        try{
          const result = await seatsDB.aggregate(subLocationPipeline);
          return result;
        }catch(err){
          return this.sendServerErrorResponse(res, 0, `SERVER-ERROR! ${err}`)
        } 
    }

    getSublocationSeatsStatusPipeline_Stages_2 = async(dateList: number[], shiftArray: ObjectId[], subLocationArray: ObjectId[], res: Response): Promise<any> =>{

      const pipline_Stages = [

          {'$project': {'_id': 0}},
          {
            '$lookup': {
              'from': 'employees', 'localField': 'empCode', 'foreignField': 'empCode', 'as': 'employee'
            }
          },
          {'$unwind': {'path': '$employee', 'preserveNullAndEmptyArrays': true}
          },
          {
            '$lookup': {
              'from': 'departments', 'localField': 'employee.departmentId', 'foreignField': '_id', 'as': 'department'
            }
          },
          {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true}}, 
          {
            '$match': {'$and': [ {'subLocationId': {'$in': subLocationArray }}, {'employee.status': {'$ne': 'Ex-Employee' }} ]}
          },
          {
            '$project': {
              '_id': 1, 'subLocationId': 1, 'empCode': 1, 'x': 1, 'y': 1, 
              'firstName': '$employee.firstName', 'middleName': '$employee.middleName', 'lastName': '$employee.lastName', 
              'ext': '$employee.extension', 'shiftId': '$employee.shiftId', 'dept': '$department.name'
            }
          }, 
          {
            '$lookup': {
              'from': 'punchrecords', 
              'let': {'subLocationId': '$subLocationId', 'empCode': '$empCode', 'shiftId': '$shiftId'}, 
              'pipeline': [
                {'$match': {
                    '$expr': {
                      '$and': [{'$eq': ['$subLocationId', '$$subLocationId']},{'$eq': ['$userId', '$$empCode']},
                      {'$eq': ['$shiftId', '$$shiftId']}, {'$in': ["$date", dateList]}]
                    }
                  }
                }
              ], 'as': 'punch_records'
            }
          },
          {'$unwind': {'path': '$punch_records', 'preserveNullAndEmptyArrays': true}}, 
          {
            '$project': {
              '_id': 1, 'subLocationId': 1, 'empCode': 1, 'x': 1, 'y': 1, 'firstName': 1, 'middleName': 1, 
              'lastName': 1, 'ext': 1, 'shiftId': 1, 'dept': 1, 
              'status': {'$ifNull': ['$punch_records.lastStatus', 'ABSENT']}
            }
          },
          {'$match': {'shiftId': {'$in': shiftArray }}}
        ]
      try{
        const report = await seatsDB.aggregate(pipline_Stages);
        return report;
      }catch(err){
        return this.sendServerErrorResponse(res, 0, `SERVER-ERROR! ${err}`)
      }
    }
    

    getLiveStatus = async(shiftList: ObjectId[], dateList: number[], userLocationList: any, res: Response): Promise<any> =>{

      try{
        let liveAllStatusPipeline: any[] = [];
        if(res.locals.auth.accessTypeRole === 'admin'){
          liveAllStatusPipeline.push({
              '$match': {
              'shiftId': { '$in': shiftList  }, 
              'status': {'$ne': 'Ex-Employee'},
              ...(res.locals.auth.allAccess == '0' ? { 'locationId': { '$in': userLocationList  } } : {})
              }
          }); 
        }
        else{
          liveAllStatusPipeline.push({
              '$match': {
                  'status': { '$ne': 'Ex-Employee' },
                  'shiftId': { '$in': shiftList  },
                  '$or': [
                      { 'reportingPerson': res.locals.auth.empCode },
                      { 'teamLead': res.locals.auth.empCode },
                      { 'empCode': res.locals.auth.empCode }
                   ]
                  }
          });

          if(res.locals.auth.loginKey === 'other' && res.locals.auth.allAccess !== '1'){
              liveAllStatusPipeline.push({'$match': {'locationId': {'$in': userLocationList }}});
          }
          else if(res.locals.auth.loginKey === 'employee' && res.locals.auth.allAccess !== '1'){
              liveAllStatusPipeline.push({'$match': {'locationId': {'$eq': userLocationList }}});
          }
        };

        liveAllStatusPipeline.push(
                {
                  '$lookup': {
                    'from': 'employees', 'localField': 'reportingPerson', 'foreignField': 'empCode', 'as': 'reportingManager', 
                    'let': {'empcode': '$reportingPerson'}, 
                    'pipeline': [
                      {'$match': {'$expr': {'$eq': ['$empCode', '$$empcode']}}},
                      {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
                    ]
                  }
                },
                { '$unwind': {'path': '$reportingManager', 'preserveNullAndEmptyArrays': true}}, 
                {
                  '$lookup': {
                    'from': 'employees', 'localField': 'teamLead', 'foreignField': 'empCode', 'as': 'reportingTeamLead', 
                    'let': {'empcode': '$teamLead'}, 
                    'pipeline': [
                      {'$match': {'$expr': {'$eq': ['$empCode', '$$empcode']}}},
                      {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
                    ]
                  }
                },
                {'$unwind': {'path': '$reportingTeamLead', 'preserveNullAndEmptyArrays': true}}, 
                {
                  '$lookup': {
                    'from': 'departments', 'localField': 'departmentId', 'foreignField': '_id', 'as': 'department', 
                    'let': {'departmentID': '$departmentId'}, 
                    'pipeline': [
                      {'$match': {'$expr': {'$eq': ['$_id', '$$departmentID'] }} }, 
                      {'$project': {'_id': 0, 'name': 1}}
                    ]
                  }
                }, 
                {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true }}, 
                {
                  '$lookup': {
                    'from': 'locations', 'localField': 'locationId', 'foreignField': '_id', 'as': 'location', 
                    'let': {'locationID': '$locationId'}, 
                    'pipeline': [
                      {'$match': {'$expr': {'$eq': ['$_id', '$$locationID' ]}}}, 
                      {'$project': {'_id': 0, 'name': 1}}
                    ]
                  }
                },
                {'$unwind': {'path': '$location', 'preserveNullAndEmptyArrays': true}}, 
                {
                  '$lookup': {
                    'from': 'punchrecords', 'localField': 'empCode', 'foreignField': 'userId', 'as': 'punchDetails', 
                    'let': {'punchID': '$empCode'}, 
                    'pipeline': [
                      {'$match': {'$expr': {'$and': [ {'$eq': ['$userId', '$$punchID' ]}, {'$in': ["$date", dateList ] } ]} }},
                      {'$project': {'_id': 0, 'userId': 1, 'date': 1, 'lastStatus': 1, 'lastTime': 1}} 
                    ]
                  } 
                },
                {'$unwind': {'path': '$punchDetails','preserveNullAndEmptyArrays': true}}, 
                {
                  '$project': {
                    '_id': 0, 'empCode': 1, 'firstName': 1, 'middleName': 1, 'lastName': 1, 'departmentId': 1, 
                    'departmentName': '$department.name', 'shiftId': 1, 'locationId': 1, 'locationName': '$location.name', 
                    'date': '$punchDetails.date', 'lastStatus': '$punchDetails.lastStatus', 'lastTime': '$punchDetails.lastTime', 
                    'reportingManager': {
                      '$concat': [
                        '$reportingManager.firstName', {
                          '$cond': {
                            'if': {'$eq': ['$reportingManager.middleName', null]}, 
                            'then': '', 
                            'else': {'$concat': [' ', '$reportingManager.middleName']}
                          }}, '$reportingManager.lastName']
                    }, 
                    'teamLead': {
                      '$concat': [
                        '$reportingTeamLead.firstName', {
                          '$cond': {
                            'if': {'$eq': ['$reportingTeamLead.middleName', null]}, 
                            'then': '', 
                            'else': {'$concat': [' ', '$reportingTeamLead.middleName']}
                          }}, '$reportingTeamLead.lastName']
                    }, 
                    'status': 1, 'extension': 1
                  }
                }
              );

        const resultliveAllStatus = await employeeDB.aggregate(liveAllStatusPipeline).exec();
        const list: any = {};
        resultliveAllStatus.forEach((item)=>{
          let name = item.firstName + (item.middleName ? ' '+item.middleName : '') + (item.lastName ? ' '+item.lastName : '');
            list[item.empCode] = {
              name: name,
              depart_id: item.departmentId,
              depart_name: item.departmentName,
              location_id: item.locationId,
              locationName: item.locationName,
              manager: item.reportingManager,
              teamlead: item.teamLead,
              status: item.status, 
              extension: item.extension,
              lastStatus: item.lastStatus,
              lastTime: item.lastTime, 
              date: "",
              shift: ""    
            }
        })
        const Finallist = Object.values(list);
        return Finallist;
      }catch(err){
        return this.sendServerErrorResponse(res, 0, `SERVER-ERROR! ${err}`)
    }  
  }

  
  attendancePipelines = async( res: Response): Promise<any> =>{

    const user = res.locals.auth;
    const QueryPipelines = [
      ...(user.accessTypeRole !== 'admin' ? [
        { 
          '$match': {  
            '$and': [
                {'status': {'$ne': 'Ex-Employee' }},
                {'$or': [{ 'reportingPerson': user.empCode }, { 'teamLead': user.empCode }, { 'empCode': user.empCode } ]}, 
                ...(user.allAccess === '0' ?
                  [{ '$expr': { '$in': ["$locationId", await new CommonServices().getLocationEmployeeAccessList(user?.empCode)] } }]
                  : []) 
            ]
          }
        }
      ] : [
        { 
          '$match': {  
            '$and': [
                {'status': {'$ne': 'Ex-Employee' }},
                ...(user.allAccess === '0' ?
                  [{ '$expr': { '$in': ["$locationId", await new CommonServices().getLocationEmployeeAccessList(user?.empCode)] } }]
                  : []) 
            ]
          }
        }
      ]),

      {
        '$lookup': {'from': 'employees', 'localField': 'reportingPerson', 'foreignField': 'empCode', 'as': 'Reporting_Manager', 
          'let': {'empcode': '$reportingPerson'}, 
          'pipeline': [
            {'$match': {'$expr': {'$eq': [ '$empCode', '$$empcode' ]}} }, 
            {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
          ]
        }
      },
      {'$unwind': {'path': '$Reporting_Manager', 'preserveNullAndEmptyArrays': true}}, 
      {
        '$lookup': {'from': 'employees','localField': 'teamLead', 'foreignField': 'empCode', 'as': 'TeamLead_Name', 
          'let': {'empcode': '$teamLead'}, 
          'pipeline': [
            {'$match': {'$expr': {'$eq': [ '$empCode', '$$empcode' ]}} }, 
            {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
          ]
        }
      },
      {'$unwind': {'path': '$TeamLead_Name', 'preserveNullAndEmptyArrays': true}}, 
      {
        '$lookup': {'from': 'departments', 'localField': 'departmentId', 'foreignField': '_id', 'as': 'department', 
          'pipeline': [
            {'$project': {'_id': 0}}
          ]
        }
      },
      {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true}}, 
      {
        '$lookup': {
          'from': 'shifts', 'localField': 'shiftId', 'foreignField': '_id', 'as': 'shift', 
          'pipeline': [
            {'$project': {'_id': 0}}
          ]
        }
      },
      {'$unwind': {'path': '$shift', 'preserveNullAndEmptyArrays': true}}, 
      {
        '$project': {
          '_id': 0, 'IdCard_ID': 1, 'empCode': 1, 'tempCode': 1, 'firstName': 1, 'middleName': 1, 'lastName': 1, 'gender': 1, 
          'dateOfBirth': 1, 'dateOfJoining': 1, 'probationDays': 1, 'dateOfConfirmation': 1, 'isTeamLead': 1, 
          'isReportingManager': 1, 'reportingPerson': 1, 'teamLead': 1, 'departmentId': 1, 'shiftId': 1, 'extension': 1, 
          'status': 1, 'personal_email': 1, 'official_email_id_1': 1, 'official_email_id_2': 1, 'locationId': 1, 
          'Reporting_Manager': {
            '$concat': [
              '$Reporting_Manager.firstName', {
                '$cond': {
                  'if': { '$eq': ['$Reporting_Manager.middleName', null] }, 
                  'then': '', 
                  'else': {'$concat': [' ', '$Reporting_Manager.middleName'] }
                }
              }, '$Reporting_Manager.lastName'
            ]
          }, 
          'TeamLead_Name': {
            '$concat': [
              '$TeamLead_Name.firstName', {
                '$cond': {
                  'if': { '$eq': ['$TeamLead_Name.middleName', null] }, 
                  'then': '', 
                  'else': { '$concat': [' ', '$TeamLead_Name.middleName'] }
                }
              }, '$TeamLead_Name.lastName'
            ]
          }, 
          'departmentName': '$department.name', 'shiftName': '$shift.name', 'shiftinTime': '$shift.inTime', 
          'shiftoutTime': '$shift.outTime', 'shiftmeanTime': '$shift.meanTime'
        }
      }
    ]
    try{
      const activeEmployee = await employeeDB.aggregate(QueryPipelines);
      return activeEmployee;
    }catch(err){
      return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${err}`); 
    }
  }

  attandancePipelinesSecond = async(dateItem: number[], shiftItem: ObjectId[], res: Response): Promise<any> =>{

    const queryPipelinesSecond = [
        {'$match': {'status': {'$ne': 'Ex-Employee' }} },
        {
          '$lookup': {'from': 'employees', 'localField': 'reportingPerson', 'foreignField': 'empCode', 'as': 'Reporting_Manager', 
            'let': {'empcode': '$reportingPerson'}, 
            'pipeline': [
              {'$match': { '$expr': { '$eq': ['$empCode', '$$empcode' ]} } },
              {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
            ]
          }
        },
        {'$unwind': {'path': '$Reporting_Manager', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'employees', 'localField': 'teamLead', 'foreignField': 'empCode', 'as': 'TeamLead_Name', 
            'let': {'empcode': '$teamLead'}, 
            'pipeline': [
              {'$match': {'$expr': {'$eq': ['$empCode', '$$empcode']}} },
              {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
            ]
          }
        },
        {'$unwind': {'path': '$TeamLead_Name', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'punchrecords', 'localField': 'empCode', 'foreignField': 'userId', 'as': 'punchRecords', 
            'let': {'empcode': '$empCode'}, 
            'pipeline': [
              {'$match': {
                  '$expr': {
                    '$and': [ {'$eq': ["$userId", "$$empcode"]}, {'$in': ["$date", [1530901800]]}]
                  }
              }}, 
              {'$limit': 1}
            ]
          }
        },
        {'$unwind': {'path': '$punchRecords', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'shifts', 'localField': 'punchRecords.shiftId', 'foreignField': '_id', 'as': 'shift',
            'pipeline': [{
                '$match': {
                  '$expr': {
                    '$and': [
                      {'$eq': ["$status", "Enabled"]},
                      {'$in': ["$_id", shiftItem ]}
                    ]
                  }
                }
            }]
          }
        },
        {'$unwind': {'path': '$shift', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'sublocations', 'localField': 'punchRecords.subLocationId','foreignField': '_id', 'as': 'subLocation', 
            'pipeline': [
              {'$match': {'$expr': {'$eq': ["$status", "Enabled"]} }},
              {'$project': {'_id': 1, 'name': 1, 'locationId': 1, 'status': 1}}
            ]
          }
        },
        {'$unwind': {'path': '$subLocation', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'locations', 'localField': 'subLocation.locationId', 'foreignField': '_id', 'as': 'Location', 
            'pipeline': [
              {'$match': {'$expr': {'$eq': ["$status", "Enabled"]} }},
              {'$project': {'_id': 1, 'name': 1, 'status': 1}}
            ]
          }
        },
        {'$unwind': {'path': '$Location', 'preserveNullAndEmptyArrays': true}},
        {
          '$lookup': {'from': 'departments', 'localField': 'departmentId', 'foreignField': '_id', 'as': 'department', 
            'pipeline': [{
              '$project': {'_id': 0, 'name': 1}
            }]
          }
        },
        {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true}},
        {
          '$project': {
            '_id': 1, 'empCode': 1, 'firstName': 1, 'middleName': 1, 'lastName': 1, 'status': 1, 
            'Reporting_Manager': {
              '$concat': ['$Reporting_Manager.firstName', {
                '$cond': {
                  'if': {'$eq': ['$Reporting_Manager.middleName', null]}, 
                  'then': '', 
                  'else': {'$concat': [' ', '$Reporting_Manager.middleName' ]}
                }
              }, '$Reporting_Manager.lastName'
              ]
            }, 
            'TeamLead_Name': {
              '$concat': ['$TeamLead_Name.firstName', {
                '$cond': {
                  'if': {'$eq': ['$TeamLead_Name.middleName', null]}, 
                  'then': '', 
                  'else': {'$concat': [' ', '$TeamLead_Name.middleName']}
                }
              }, '$TeamLead_Name.lastName'
              ]
            }, 
            'departmentId': 1, 'departmentName': '$department.name', 'locationID': '$Location._id', 'locationName': '$Location.name', 
            'locationStatus': '$Location.status', 'sublocationID': '$subLocation._id', 'sublocationName': '$subLocation.name', 
            'sublocationStatus': '$subLocation.status', 'punchDate': '$punchRecords.date', 'punching': '$punchRecords.punch', 
            'punchlastStatus': '$punchRecords.lastStatus', 'punchShiftID': '$punchRecords.shiftId', 'shiftID': '$shift._id',
            'shiftName': '$shift.name', 'shiftStatus': '$shift.status', 'shiftinTime': '$shift.inTime', 
            'shiftoutTime': '$shift.outTime', 'shiftAuthIn': '$shift.authIn', 'shiftmeanTime': '$shift.meanTime'
          }
        }
    ]
    try{
      const resultData = await employeeDB.aggregate(queryPipelinesSecond);
      return resultData;
    }catch(err){
      return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${err}`); 
    }
  };


  timeSheetPipelines = async(res: Response): Promise<any>=>{

    const user = res?.locals?.auth;
    const queryPipelines_stages_1: any[] = [];

    queryPipelines_stages_1.push({
      '$match': {'status': {'$ne': "Ex-Employee"} }
    })

    if(user?.accessTypeRole !== 'admin'){
      if(user?.loginKey === 'other' && user?.allAccess !== '1'){
        queryPipelines_stages_1.push({'$match': {'locationId': {'$in': await new CommonServices().getLocationAccessList(user?.empCode) }} })
      }else if(user?.loginKey === 'employee' && user?.allAccess !== '1'){
        queryPipelines_stages_1.push({'$match': {'locationId': {'$in': await new CommonServices().getLocationEmployeeAccessList(user?.empCode) }} })
      }
      if(user?.loginKey === 'other' && user?.allAccess !== '1' && user?.accessTypeRole !== 'itsupport'){
        queryPipelines_stages_1.push(
          {'$match': {
            '$or': [
              {'empCode': {'$eq': user?.empCode}},
              {'reportingPerson': {'$eq': user?.empCode}},
              {'teamLead': {'$eq': user?.empCode}}
            ]
          }})
      }else if(user?.loginKey === 'other' && user?.allAccess !== '1' && user?.accessTypeRole === 'itsupport'){
        queryPipelines_stages_1.push({'$match': {'empCode': {'$eq': user?.empCode}} })
      }else if(user?.loginKey === "employee" && user?.allAccess !== '1'){
        queryPipelines_stages_1.push({'$match': {'empCode': {'$eq': user?.empCode}} })
      }

    }else{
      if(user?.allAccess !== '1'){
        queryPipelines_stages_1.push({'$match': {'locationId': {'$in': await new CommonServices().getLocationAccessList(user?.empCode) }} })
      }
      // if(user?.empCode){
      //   queryPipelines_stages_1.push({'$match': {'empCode': {'$eq': user?.empCode}} })
      // }

      //remaining something missing
    }

    queryPipelines_stages_1.push(  
      {
        '$lookup': {
          'from': 'employees', 'localField': 'reportingPerson', 'foreignField': 'empCode', 'as': 'Reporting_Manager', 
          'let': {'empcode': '$reportingPerson'}, 
          'pipeline': [
            {'$match': {'$expr': {'$and': [{'$eq': ['$empCode', '$$empcode']}, { '$ne': ['$status', 'Ex-Employee'] }]} } },
            {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1}}
          ]
        }
      },
      {'$unwind': {'path': '$Reporting_Manager', 'preserveNullAndEmptyArrays': true}},
      {
        '$lookup': {'from': 'employees', 'localField': 'teamLead', 'foreignField': 'empCode', 'as': 'TeamLead_Name', 
          'let': {'empcode': '$teamLead'}, 
          'pipeline': [
            {'$match': {'$expr': {'$and': [{'$eq': ['$empCode', '$$empcode']}, { '$ne': ['$status', 'Ex-Employee'] }]} } },
            {'$project': {'_id': 0, 'firstName': 1, 'middleName': 1, 'lastName': 1 }}
          ]
        }
      },
      {'$unwind': {'path': '$TeamLead_Name', 'preserveNullAndEmptyArrays': true}},
      {
        '$lookup': {'from': 'departments', 'localField': 'departmentId', 'foreignField': '_id', 'as': 'department', 
          'pipeline': [
            {'$match': {'$expr': {'$ne': ["$status", "Disabled"]} }},
            {'$project': {'_id': 0}}
          ]
        }
      },
      {'$unwind': {'path': '$department', 'preserveNullAndEmptyArrays': true}},
      {
        '$lookup': {'from': 'seats', 'localField': 'empCode', 'foreignField': 'empCode', 'as': 'seats'}
      },
      {'$unwind': {'path': '$seats', 'preserveNullAndEmptyArrays': true}
      },
      {
        '$lookup': {'from': 'sublocations', 'localField': 'seats.subLocationId', 'foreignField': '_id', 'as': 'sublocation',
          'pipeline': [
            {'$match': {'$expr': {'$ne': ["$status", "Disabled"]} }},
          ]
        }
      },
      {'$unwind': {'path': '$sublocation', 'preserveNullAndEmptyArrays': true }
      },
      {
        '$lookup': {'from': 'locations', 'localField': 'sublocation.locationId', 'foreignField': '_id', 'as': 'location',
          'pipeline': [
            {'$match': {'$expr': {'$ne': ["$status", "Disabled"]} }},
          ]
        }
      },
      {'$unwind': {'path': '$location', 'preserveNullAndEmptyArrays': true}},
      {
        '$project': {
          'empCode': 1, 'gender': 1, 'status': 1, 'official_email_id_1': 1,
          'reportingPerson': 1,'teamLead': 1,'extension': 1,  
          'departmentName': '$department.name', 'sublocationId': '$seats.subLocationId', 'sublocationName': '$sublocation.name', 
          'locationId': '$sublocation.locationId', 'locationName': '$location.name', 
          'FullName': {
            '$concat': ['$firstName',
              {
                '$cond': {'if': {'$eq': ['$middleName', null]},
                  'then': '',
                  'else': {'$concat': [' ', '$middleName']}}
              },{'$concat': [' ', '$lastName']} 
            ]
          },
          'Reporting_Manager': {
            '$concat': ['$Reporting_Manager.firstName', 
              {
                '$cond': {'if': {'$eq': ['$Reporting_Manager.middleName', null]}, 
                  'then': '', 
                  'else': {'$concat': [' ', '$Reporting_Manager.middleName']}
                }
              }, '$Reporting_Manager.lastName'
            ]
          }, 
          'TeamLead_Name': {
            '$concat': ['$TeamLead_Name.firstName', 
              {
                '$cond': {'if': {'$eq': ['$TeamLead_Name.middleName', null]}, 
                  'then': '', 
                  'else': {'$concat': [' ', '$TeamLead_Name.middleName' ]}
                }
              }, '$TeamLead_Name.lastName'
            ]
          }
        }
      },
    )
    try{
      const pipelineExecution =  await employeeDB.aggregate(queryPipelines_stages_1);
      return pipelineExecution;
    }catch(err){
      return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${err}`)
    }
  }


  timeSheetPunchPipelines = async(dateItem: number[], shiftItem: ObjectId[], res: Response): Promise<any> =>{
    const user = res.locals.auth;
    const punchpipelineStages: any[] = [];

    if(user?.loginKey === 'employee'){
      punchpipelineStages.push({
        '$match': {'userId': {'$eq': user?.empCode}}
      })
    }
    if(!shiftItem){
      punchpipelineStages.push({
        '$match': {'shiftId': {'$in': shiftItem}}
      })
    }
    
    punchpipelineStages.push(
        {'$match':    //1566239400
          {'date': {'$in': [1704306600]}}
        },
        {
          '$lookup': {'from': 'shifts', 'localField': 'shiftId', 'foreignField': '_id', 'as': 'shift', 
            'pipeline': [
              {'$match': {'status': {'$ne': 'Disabled'}} }
            ]
          }
        },
        {'$unwind': {'path': '$shift', 'preserveNullAndEmptyArrays': true }}, 
        {
          '$project': {
            'date': 1, 'punch': 1, 'userId': 1, 'lastStatus': 1, 'shiftId': 1, 'lastTime': 1, 'subLocationId': 1, 
            'shiftID': '$shift._id', 'shiftName': '$shift.name', 'shiftInTime': '$shift.inTime', 
            'shiftOutTime': '$shift.outTime', 'shiftauthIn': '$shift.authIn', 'shiftmeanTime': '$shift.meanTime'
          }
        },
        {'$sort':{ 'userId': 1 }}
    );

    try{
      const punchRecordPipeline =  await punchRecordDB.aggregate(punchpipelineStages);
      //console.log(punchRecordPipeline)
      return punchRecordPipeline;

    }catch(err){
      return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${err}`)
    }
  }


  timeSheetLocationPipelines = async(res: Response): Promise<any> =>{

    const sublocationPipelines = [
      {'$match': {'status': {'$ne': 'Disabled'}}},
      {
        '$lookup': {
          'from': 'locations', 'localField': 'locationId', 'foreignField': '_id', 'as': 'location', 
          'pipeline': [
            {'$match': {'$expr': {'$ne': ['$status', 'Disabled']} }}
          ]
        }
      },
      {'$unwind': {'path': '$location', 'preserveNullAndEmptyArrays': true }},
      {'$project': {'_id': 0, 'loocationID': '$location._id', 'firstLocation': '$location.name', 'secondLocation': '$name'}}
    ]
    try{
      const sublocationResult = await sublocationDB.aggregate(sublocationPipelines);
      return sublocationResult;
    }catch(err){
      return this.sendServerErrorResponse(res, 0, `SERVER_ERROR!! ${err}`)
    }
  }
}

export default LiveReportsQuery;