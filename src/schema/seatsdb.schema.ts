import mongoose, { Schema, Document, Model } from "mongoose";

interface SeatsInfo extends Document{
    seatId: string;
    subLocationId: Schema.Types.ObjectId;
    empCode: string;
    x: number;
    y: number; 
}

const seatsInfoSchema: Schema<SeatsInfo> = new Schema({
    seatId:{
        type: String,
        required: true,
        trim: true
    },
    subLocationId:{
        type: Schema.Types.ObjectId,
        required: true,
        trim: true
    },
    empCode:{
        type: String
    },
    x:{
        type: Number,
        equired: true,
        trim: true
    },
    y:{
        type: Number,
        equired: true,
        trim: true
    }
})

const seatsDB: Model<SeatsInfo> = mongoose.model<SeatsInfo>("seat", seatsInfoSchema);

export default seatsDB;