import mongoose, { Schema, Document, Model } from "mongoose";

interface Employee extends Document {
    IdCard_ID: string;
    empCode: string;
    tempCode: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    gender: "Male" | "Female" | "Other";
    dateOfBirth: Date | null;
    dateOfJoining: Date | null;
    probationDays: number;
    dateOfConfirmation: Date | null;
    isTeamLead: string;
    isReportingManager: string;
    reportingPerson: string | null;
    teamLead: string | null;
    departmentId: Schema.Types.ObjectId;
    shiftId: Schema.Types.ObjectId;
    extension: string | null;
    status: "Probation" | "Confirmed" | "Notice Period" | "Ex-Employee";
    personal_email: string | null;
    official_email_id_1: string;
    official_email_id_2: string | null;
    locationId: Schema.Types.ObjectId;
    otp_token: string | null;
    otp: number | null;
}

const employeeSchema: Schema<Employee> = new Schema({
    IdCard_ID: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    empCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    tempCode: {
        type: String,
        trim: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    middleName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    dateOfJoining: {
        type: Date,
    },
    probationDays: {
        type: Number,
        default: 180,
        trim: true,
    },
    dateOfConfirmation: {
        type: Date,
    },
    isTeamLead: {
        type: String,
        enum: ['0', '1'],
        required: true,
    },
    isReportingManager: {
        type: String,
        enum: ['0', '1'],
        required: true,
    },
    reportingPerson: {
        type: String,
        trim: true,
    },
    teamLead: {
        type: String,
        trim: true,
    },
    departmentId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    shiftId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    extension: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["Probation", "Confirmed", "Notice Period", "Ex-Employee"],
        required: true,
        trim: true,
    },
    personal_email: {
        type: String,
        unique: true,
        trim: true,
    },
    official_email_id_1: {
        type: String,
        unique: true,
        trim: true,
    },
    official_email_id_2: {
        type: String,
        unique: true,
        trim: true,
    },
    locationId: {
        type: Schema.Types.ObjectId
    },
    otp_token: {
        type: String
    },
    otp: {
        type: Number
    },
});

const employeeDB: Model<Employee> = mongoose.model<Employee>("employee",employeeSchema);

export default employeeDB;

