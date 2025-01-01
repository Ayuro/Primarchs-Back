/** Server Imports */
import express from 'express';
import cors from 'cors';

/** MongoDB Imports */
import mongoose from 'mongoose';

/** Init DB */
const dataBase = mongoose;
dataBase.connect('mongodb+srv://Ayuro:1TUyQJktKPQGsx21@cluster0.cxsbqca.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to Mongo');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

/** Init server */
const server = express();
const port = 1986;
server.use(cors());

/** Root management routes */

server.get('/', (req, res, next) => {
    console.log("Am I awake?");
    return res.send();
});

/** Account management routes */

server.get('/register', (req, res, next) => {
    console.log("Am I about to sign something?");
    return res.send();
})

server.get('/login', (req, res, next) => {
    console.log("Honey, I'm home!");
    return res.send();
})

server.get('/logout', (req, res, next) => {
    console.log("I'm just getting cigarettes, it will take 10mins");
    return res.send();
})

/** Server listening */

server.listen(1986, () => {
    console.log(`Server listening on ${port}`);
})