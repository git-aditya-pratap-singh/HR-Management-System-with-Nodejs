import ADODB from "@el3um4s/node-adodb";
import * as dotenv from 'dotenv'
dotenv.config()
const MDBPATH=process.env.MDBDATABASES
const connection = ADODB.open(
  `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${MDBPATH}`
);

export { connection };
