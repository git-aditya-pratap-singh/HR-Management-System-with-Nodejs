import mongoose, { Schema, Document, Model } from "mongoose";

interface ShiftInfo extends Document{
    name: string;
    inTime: number;
    outTime: number;
    authIn: number;
    meanTime: number;
    status: "Enabled" | "Disabled"; 
}

const shiftInfoSchema: Schema<ShiftInfo> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    inTime:{
        type: Number,
        required: true,
        trim: true
    },
    outTime:{
        type: Number,
        required: true,
        trim: true
    },
    authIn:{
        type: Number,
        trim: true
    },
    meanTime:{
        type: Number,
        trim: true
    },
    status:{
        type: String,
        enum: ['Enabled','Disabled'],
        required: true
    }
})

const shiftDB: Model<ShiftInfo> = mongoose.model<ShiftInfo>("shift", shiftInfoSchema);

export default shiftDB;