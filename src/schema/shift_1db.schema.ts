import mongoose, { Schema, Document, Model } from "mongoose";

interface Shift_1Info extends Document{
    name: string;
    inTime: string;
    outTime: string;
    authDelay: number;
    meanTime: number;
}

const shift_1_InfoSchema: Schema<Shift_1Info> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    inTime:{
        type: String,
        required: true,
        trim: true
    },
    outTime:{
        type: String,
        required: true,
        trim: true
    },
    authDelay:{
        type: Number,
        trim: true
    },
    meanTime:{
        type: Number,
        trim: true
    }
})

const shift_1DB: Model<Shift_1Info> = mongoose.model<Shift_1Info>("shift_1", shift_1_InfoSchema);

export default shift_1DB;