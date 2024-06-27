import mongoose, { Schema, Document, Model } from "mongoose";

interface SubLocationInfo extends Document{
    name: string;
    locationId: Schema.Types.ObjectId;
    img_path: string;
    img_height: number;
    status: "Enabled" | "Disabled"; 
}

const sublocationSchema: Schema<SubLocationInfo> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    locationId:{
        type: Schema.Types.ObjectId,
        required: true,
        trim: true
    },
    img_path:{
        type: String,
        trim: true
    },
    img_height:{
        type: Number,
        trim: true
    },
    status:{
        type: String,
        enum: ["Enabled","Disabled"],
        required: true,
        trim: true
    }
})

const sublocationDB: Model<SubLocationInfo> = mongoose.model<SubLocationInfo>("sublocation", sublocationSchema);

export default sublocationDB;