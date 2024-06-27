import mongoose, { Schema, Document, Model } from "mongoose";

interface ILogin extends Document {
    username: string;
    password: string;
    designation: string;
    last_login: Date;
    empCode: string;
    login_token: string;
    reset_time_token: string;
    status: "Enabled" | "Disabled"; 
    hasAllAccess: string;

}

const loginSchema: Schema<ILogin> = new Schema({
    username:{
        type: String,
        required: true,
        trim: true
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    designation:{
        type: String,
        required: true,
        trim: true
    },
    last_login:{
        type: Date,
        default: Date.now
    },
    empCode:{
        type: String,
        required: true,
        trim: true
    },
    login_token:{
        type: String,
        required: false,
        trim: true
    },
    reset_time_token:{
        type: String,
        required: false,
        trim: true
    },
    status:{
        type: String,
        enum:['Enabled','Disabled'],
        required: true,
    },
    hasAllAccess:{
        type: String,
        enum:['0','1'],
        required: false,
        trim: true
    }
});

const loginDB: Model<ILogin> = mongoose.model<ILogin>("login", loginSchema);

export default loginDB;