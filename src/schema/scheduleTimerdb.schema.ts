import mongoose, { Schema, Document, Model } from "mongoose";

interface ScheduleTimer extends Document{
    runTime: Date;
    dbCreateTime: Date;
    lastId: number;
    CityCode: string; 
}

const scheduleTimerSchema: Schema<ScheduleTimer> = new Schema({
    runTime:{
        type: Date,
        trim: true
    },
    dbCreateTime:{
        type: Date,
        trim: true
    },
    lastId:{
        type: Number,
        trim: true
    },
    CityCode:{
        type: String,
        required: true,
        trim: true
    }
})

const scheduleTimerDB: Model<ScheduleTimer> = mongoose.model<ScheduleTimer>("scheduleTimer", scheduleTimerSchema);

export default scheduleTimerDB;