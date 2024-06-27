import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import DatabaseConnection from './config/dbConnection';
import router from './routes/auth.routes';

dotenv.config();
const app = express();

const apiUrl = process.env.HOST +':'+ process.env.PORT;

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("../dist/public"))

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: 'HEAD,GET,POST,PUT,PATCH,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}))

// callig Database connection
new DatabaseConnection().connectToMongoDB();

app.use('/api/v1', router)

const PORT: string =  process.env.PORT || '8000';

// Start the server
app.listen(PORT, ():void => {
    const msg = '🎉 Server started at ' + apiUrl
    console.log(String('*').padEnd(msg.length + 20, '*'))
    console.log('*' + String('').padEnd(msg.length + 18, ' ') + '*')
    console.log(`*${String('').padEnd(9, ' ')}${msg}${String('').padEnd(9, ' ')}*`)
    console.log('*' + String('').padEnd(msg.length + 18, ' ') + '*')
    console.log(String('*').padEnd(msg.length + 20, '*'))
})
