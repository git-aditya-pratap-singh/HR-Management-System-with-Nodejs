import mongoose, { Schema, Document, Model } from "mongoose";

interface UserLocationInfo extends Document{
    empCode: string;
    locationId: Schema.Types.ObjectId;
    is_enabled: string; 
}

const userlocationSchema: Schema<UserLocationInfo> = new Schema({
    empCode:{
        type: String,
        required: true,
        trim: true
    },
    locationId:{
        type: Schema.Types.ObjectId,
        required: true,
        trim: true
    },
    is_enabled:{
        type: String,
        enum: ['0','1'],
        required: true,
        trim: true
    }
})

const userlocationDB: Model<UserLocationInfo> = mongoose.model<UserLocationInfo>("userlocation", userlocationSchema);

export default userlocationDB;