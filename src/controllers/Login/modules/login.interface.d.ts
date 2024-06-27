import { Types } from "mongoose";

export interface IUser {
    _id: Schema.Types.ObjectId;
    username: string;
    password: string;
    designation: string;
    status: string;
    empCode: string;
    hasAllAccess: number;
}