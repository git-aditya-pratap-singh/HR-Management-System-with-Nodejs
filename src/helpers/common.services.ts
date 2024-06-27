import { ObjectId } from 'mongodb';
import userlocationDB from "../schema/userlocationdb.schema";
import employeeDB from '../schema/employeedb.schema';

class CommonServices {

    public getLocationEmployeeAccessList = async(empCode: string): Promise<ObjectId[]> =>{
        const userLocation = await employeeDB.find(
            { $and: [{ status: { $ne: 'Ex-Employee' } }, { empCode: empCode }] },
            { _id: 0, locationId: 1 }
        );
        const userLocationAccList = userLocation ? userLocation.map((item: any) => item.locationId) : [];
        return userLocationAccList;
    }

    public getLocationAccessList = async (empCode: string): Promise<ObjectId[]> =>{
        const userLocation = await userlocationDB.find(
            {$and: [{is_enabled: '1'},{empCode: empCode}]},
            {_id: 0, locationId: 1}
        );
        const userLocationAccList = userLocation ? userLocation.map((item: any) => item.locationId) : [];
        return userLocationAccList;
    }
}

export default CommonServices;