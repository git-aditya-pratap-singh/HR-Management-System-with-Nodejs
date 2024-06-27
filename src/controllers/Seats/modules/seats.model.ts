import { Request, Response } from "express";
import { ObjectId } from 'mongodb';
import sublocationDB from "../../../schema/sublocationdb.schema";
import seatsDB from "../../../schema/seatsdb.schema";
import employeeDB from "../../../schema/employeedb.schema";
import AlertService from "../../../helpers/AlertService";

class SeatsModel extends AlertService{
     
    private msg: any = "";

    public getSublocationList = async (req: Request, res: Response): Promise<any> =>{
       const sublocationList:any = await sublocationDB.aggregate([
          {
            '$match': {
              'status': 'Enabled'
            }
          }, {
            '$lookup': {
              'from': 'locations', 
              'localField': 'locationId', 
              'foreignField': '_id', 
              'as': 'LocationName'
            }
          }, {
            '$unwind': '$LocationName'
          }, {
            '$project': {
              'name': 1,
              'img_path': 1,
              'img_height': 1, 
              'LocationName': '$LocationName.name'
            }
          }
      ])
      return this.sendDataResponse(res, 1, sublocationList)
    }

    getSublocationSeats = async(req: Request, res: Response): Promise<any> =>{
      
      await seatsDB.find({subLocationId: {$eq: req.body.id}})
      .then(check =>{
        return this.sendDataResponse(res, 1, check);
      })
      .catch(err=>{
        return this.sendErrorResponse(res, 0, `SERVER-ERROR ${err}!`)
      })
    }

    add = async (req: Request, res: Response): Promise<any> =>{

      const {_id, subLocationId, empCode, x, y} = req.body;
      return (_id === "") ? this.sendErrorResponse(res, 0, "Please enter seat code!") :
        await seatsDB.findOne({seatId: _id})
        .then(seatIDCheck => (seatIDCheck) ? this.sendErrorResponse(res, 0, `Seat ${_id} already exists. Please enter a different seat code!`) :

            sublocationDB.findOne({_id: new ObjectId(subLocationId)})
            .then(subLocationCheck => (!subLocationCheck) ? this.sendErrorResponse(res, 0, "Invalid Sub-Location ID!") :

                (empCode !== "") ? employeeDB.findOne({$and: [{empCode: {$eq: empCode}}, {status: {$ne: 'Ex-Employee'}}]})
                .then(empCheck => (!empCheck) ? this.sendErrorResponse(res, 0, "Invalid employee Code!") :

                    seatsDB.insertMany({'seatId': _id, 'subLocationId': subLocationId, 'empCode': empCode, 'x': x, 'y': y})
                    .then(insert => (insert === null) ? this.sendErrorResponse(res, 0, "Failed to add seat.") :
                      this.sendSuccessResponse(res, 1, "Seat added successfully.")
                    )
                    .catch(err => this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}!`))
                ) :
                  seatsDB.insertMany({'seatId': _id, 'subLocationId': subLocationId, 'empCode': empCode, 'x': x, 'y': y})
                  .then(insert => (insert === null) ? this.sendErrorResponse(res, 0, "Failed to add seat.") :
                    this.sendSuccessResponse(res, 1, "Seat added successfully.")
                  )
                  .catch(err => this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}!`))
            )
            .catch(err => this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}!`))
        )
        .catch(err => this.sendServerErrorResponse(res, 0, `SERVER_ERROR ${err}!`));
    } 

    remove = async (req: Request, res: Response): Promise<any> =>{

      await seatsDB.deleteMany({seatId: req.body._id})
      .then(removeSeats =>{
        return (removeSeats.deletedCount > 0 ) ? this.sendSuccessResponse(res, 1, "Seat removed.") : this.sendErrorResponse(res, 0, "Seat didn't removed.")
      })
      .catch(err=>{
        return this.sendErrorResponse(res, 0, `SERVER-ERROR ${err}!`)
      })
    }
}
    
export default SeatsModel;