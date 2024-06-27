import mongoose, { Schema, Document, Model } from "mongoose";

interface Department extends Document{
    name: string;
    status: "Enabled" | "Disabled"; 
}

const departmentSchema: Schema<Department> = new Schema({
    name:{
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

const departmentDB: Model<Department> = mongoose.model<Department>("department", departmentSchema);

export default departmentDB;