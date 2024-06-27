import mongoose, { Schema, Document, Model } from "mongoose";

interface punchRecords extends Document{
    subLocationId: Schema.Types.ObjectId;
    UserId: string;
    shiftId: Schema.Types.ObjectId;
    date: number;
    punch: string;
    lastStatus: "IN" | "OUT"; 
    lastTime: number;
}

const punchRecordsSchema: Schema<punchRecords> = new Schema({
    subLocationId:{
        type: Schema.Types.ObjectId,
        required: true,
    },
    UserId:{
        type: String,
        required: true,
        trim: true
    },
    shiftId:{
        type: Schema.Types.ObjectId,
        required: true,
        trim: true
    },
    date:{
        type: Number,
        trim: true
    },
    punch:{
        type: String,
        trim: true
    },
    lastStatus:{
        type: String,
        enum:['IN','OUT'],
        required : true
    },
    lastTime:{
        type: Number
    }
})

const punchRecordDB: Model<punchRecords> = mongoose.model<punchRecords>("punchRecord", punchRecordsSchema);

export default punchRecordDB;