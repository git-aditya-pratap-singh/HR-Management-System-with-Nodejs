import express, { Request, Response } from "express";
import { connection } from "../config/mdb";
import BodyParser from "body-parser";
import response from "../response";
import * as dotenv from "dotenv";

dotenv.config();
const API_KEY = process.env.API_KEY;
const jsonParser = BodyParser.json();
const app = express();
const PORT: number = 8003;

app.use(BodyParser.json({limit: '50mb'}));
app.use(BodyParser.urlencoded({limit: '50mb', extended: true}));

app.post("/fetchData", jsonParser, async (req: Request, resp: Response) => {
  let lastid: number = req.body.last_id;
  let apiKey: any = req.body.API_KEY;

  if (apiKey != API_KEY) {
    resp.send(response(400, { message: `Invalid Api Key provided` }));
  }

  let sql =
    "SELECT DISTINCT acc_monitor_log.id,acc_monitor_log.event_point_id,acc_monitor_log.state,acc_monitor_log.card_no,acc_monitor_log.time,acc_monitor_log.pin FROM acc_monitor_log WHERE acc_monitor_log.device_name = 'Kovai office' AND acc_monitor_log.id > " +
    lastid +
    " and (acc_monitor_log.state = 0 OR acc_monitor_log.state = 1) AND (acc_monitor_log.event_point_id = 2 OR acc_monitor_log.event_point_id = 3) order by acc_monitor_log.id";

  try {
    const result = await connection.query(sql);

    resp.send(
      response(200, {
        message: "Current Puch Records fetched successfully !",
        result,
      })
    );
  } catch (error) {
    console.error(error);
  }
});
app.listen(PORT, (): void => {
  console.log(`server is running on port ${PORT}`);
});
