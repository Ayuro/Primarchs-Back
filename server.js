'use strict';

/** Server Imports */
import express from 'express';
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from 'cors';
import 'dotenv/config';

/** MongoDB Imports */
import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import User from './models/user.js';
import jwt from 'jsonwebtoken';
import authenticateToken from './srcs/js/middlewares/jwt-validation.js';

/** INIT DB */

const dataBase = mongoose;
dataBase.connect(String(process.env.MONGOURL), {dbName: String(process.env.DBNAME)}).then(() => {
    console.log('Connected to Mongo');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

/** INIT SERVER */

const corsOptions = {
    origin: 'http://localhost:4200', // Allow only Angular frontend
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
  };

const server = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname, '/front/browser');
const port = String(process.env.PORT);
const SECRET_KEY = String(process.env.SECRET_KEY);
server.use(express.static(staticPath));
server.use(cors(corsOptions));
server.use(express.json())

server.set('view engine', 'html');


/** MANAGEMENT ROUTES */

    /** Register */

server.route('/api/register')
    .post(async (req, res) => {
       const { userName, password } = req.body;

       if (!userName || !password) {
        return res.status(400).json({ message: 'Missing username or password' });
    }

       try{
        const existingUser = await User.findOne({ userName: userName});

        if (existingUser) {
            return res.status(400).json({ message: 'This user already exist'});
        }

        const hashedPassword = await bcrypt.hash(password, 15);

        const newUser = new User({ userName, password: hashedPassword, role: "user" });
        await newUser.save();

        res.status(201).json({ message: "Your account have been created" });
       } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Server Error" });
       }
    });

    /** Login */

server.route('/api/login')
    .post(async (req, res) => {
    const { userName, password } = req.body;

    if ( !userName || !password ) {
        return res.status(400).json({ message: "Missing userName of password"});
    }

    try {
        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user._id, userName: user.userName },
            SECRET_KEY,
            { expiresIn: '2h', }
        );

        res.status(200).json({ message: `Hi, access granted ${userName}`, token });
    } catch (error) {
        console.error("Error during login: ", error);
        res.status(500).json({ message: "Server error"});
    }
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