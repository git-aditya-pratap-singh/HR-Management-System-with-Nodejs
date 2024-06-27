import mongoose, { Schema, Document, Model } from "mongoose";

interface Documents extends Document{
    name: string;
    path: string;
    isMandatory: 0 | 1; 
}

const documentSchema: Schema<Documents> = new Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    path:{
        type: String,
        required: true,
        trim: true
    },
    isMandatory:{
        type: Number,
        enum: [0,1],
        required: true
    }
})

const documentDB: Model<Documents> = mongoose.model<Documents>("document", documentSchema);

export default documentDB;