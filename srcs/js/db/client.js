import 'dotenv/config';

import { MongoClient } from 'mongodb';

// Connection URL
const url = String(process.env.MONGOURL);
const client = new MongoClient(url);

export default client;