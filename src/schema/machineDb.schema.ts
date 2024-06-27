import mongoose, { Schema, Document, Model } from "mongoose";

interface Machines extends Document{
    serialNumber: string;
    types: "IN" | "OUT";
    status: "Enabled" | "Disabled"; 
    name: string;
    subLocationId: Schema.Types.ObjectId;
}

const machineSchema: Schema<Machines> = new Schema({
    serialNumber:{
        type: String,
        required: true,
        trim: true
    },
    types:{
        type: String,
        enum:['IN','OUT'],
        required : true
    },
    status:{
        type: String,
        enum:['Enabled','Disabled'],
        required : true
    },
    name:{
        type: String,
        required: true,
        trim: true
    },
    subLocationId:{
        type: Schema.Types.ObjectId,
        required: true,
        trim: true
    } 
})

const machineDB: Model<Machines> = mongoose.model<Machines>("machine", machineSchema);

export default machineDB;