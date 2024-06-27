import mongoose, { Schema, Document, Model } from "mongoose";

interface AppSettings extends Document{
    name: string;
    value: string;
    status: "Enabled" | "Disabled"; 
}

const appsettingsSchema: Schema<AppSettings> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    value:{
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

const appsettingsDB: Model<AppSettings> = mongoose.model<AppSettings>("appsetting",appsettingsSchema)

export default appsettingsDB;