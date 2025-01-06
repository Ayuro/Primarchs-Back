'use strict';

/** Server Imports */
import express from 'express';
// import expressSession from 'express-session';
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from 'cors';
import 'dotenv/config';
// import compression from "compression";

/** MongoDB Imports */
import mongoose from 'mongoose';
// import { v4 as uuid } from 'uuid';
import bcrypt from "bcrypt";
// import bodyParser from "body-parser";

/** Init DB */
const dataBase = mongoose;
dataBase.connect(String(process.env.MONGOURL), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    const dbName = String(process.env.DBNAME);
    const collection = "users";
    const jwtSecret = String(process.env.JWT_SECRET);
    console.log('Connected to Mongo');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

const userSchema = new dataBase.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// module.exports = mongoose.model('User', userSchema);

/** Init server */
const server = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname, '/front/browser');
const port = String(process.env.PORT);
server.use(express.static(staticPath));
// server.use(cors());

server.set('view engine', 'html');

/** Root management routes */

server.route('/api/register')
    .get((req, res) => {
        console.log("Am I about to sign something?");
    })
    .post(async (req, res) => {
       const { userName, password } = req.body;

       try{
        const existingUser = await UserActivation.findOne({ userName: userName});

        if (existingUser) {
            return res.status(400).json({ message: 'This user already exist'});
        }

        const hashedPassword = await bcrypt.hash(password, 15);

        const newUser = new UserActivation({ userName, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Your account have been created" });
       } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Server Error" });
       }
    });

// module.exports = router;

server.get('/api/login', (req, res, next) => {
    console.log("Honey, I'm home!");
    return res.send();
})

server.get('/api/logout', (req, res, next) => {
    console.log("I'm just getting cigarettes, it will take 10mins");
    return res.send();
})

server.use('*', (req, res) => {
    res.sendFile(`${staticPath}/index.html`);
});

/** Server listening */

server.listen(1986, () => {
    console.log(`Server listening on ${port}`);
})