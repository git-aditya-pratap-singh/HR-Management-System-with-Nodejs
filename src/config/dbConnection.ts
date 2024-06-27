import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
class DatabaseConnection {

    connectToMongoDB = async(): Promise<mongoose.Connection> =>{
        try {
            const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}${process.env.DATABASE_NAME}` as string);

            const msg = `📥 MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
            console.log(String('*').padEnd(msg.length + 20, '*'))
            console.log('*' + String('').padEnd(msg.length + 18, ' ') + '*')
            console.log(`*${String('').padEnd(9, ' ')}${msg}${String('').padEnd(9, ' ')}*`)
            console.log('*' + String('').padEnd(msg.length + 18, ' ') + '*')
            console.log(String('*').padEnd(msg.length + 20, '*'))
            
            return connectionInstance.connection;
        } catch (err) {
            console.error("Failed to connect to database:", err);
            process.exit(1);
        }
    }
}

export default DatabaseConnection;