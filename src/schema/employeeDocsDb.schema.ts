import mongoose, { Schema, Document, Model } from "mongoose";

interface employeeDocs extends Document{
    emp_id: number;
    doc_id: number;
    fileName: number;
    status: "Enabled" | "Disabled"; 
}

const employeeDocSchema: Schema<employeeDocs> = new Schema({
    emp_id:{
        type: Number,
        required: true,
        trim: true
    },
    doc_id:{
        type: Number,
        required: true,
        trim: true
    },
    fileName:{
        type: Number,
        required: true,
        trim: true
    },
    status:{
        type: String,
        enum:['Enabled','Disabled'],
        required: true
    }
})

const employeeDocsDB: Model<employeeDocs> = mongoose.model<employeeDocs>("employee_document", employeeDocSchema);

export default employeeDocsDB;