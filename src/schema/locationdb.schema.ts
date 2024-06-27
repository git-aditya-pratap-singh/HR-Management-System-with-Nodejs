import mongoose, { Schema, Document, Model } from "mongoose";

interface Location extends Document{
    name: string;
    address: string;
    status: "Enabled" | "Disabled"; 
}

const locationSchema: Schema<Location> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    address:{
        type: String,
        required: true,
        trim: true
    },
    status:{
        type: String,
        enum:['Enabled','Disabled'],
        required: true
    }
})

const locationDB: Model<Location> = mongoose.model<Location>("location", locationSchema);

export default locationDB;