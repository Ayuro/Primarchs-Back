import 'dotenv/config';

import { MongoClient } from 'mongodb';

// Connection URL
const url = String(process.env.MONGOURL);
const db = String(process.env.DBNAME)
const client = new MongoClient(url);
client.db(db);

export default client;