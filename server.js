'use strict';

/** Server Imports */
import express from 'express';
import path from 'path';
// import expressSession from 'express-session';
// import nodePath from "node:path";
import cors from 'cors';
import 'dotenv/config';
// import compression from "compression";
// import { fileURLToPath } from "node:url";

/** MongoDB Imports */
import mongoose from 'mongoose';
// import { v4 as uuid } from 'uuid';
// import bcrypt from "bcrypt";
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

/** Init server */
const server = express();
// const staticPath = path.join(__dirname, '/');
const port = String(process.env.PORT);
// server.use(express.static(staticPath));
server.use(cors());

/** Root management routes */

server.get('/', (req, res, next) => {
    console.log("Am I awake?");
    return res.render('front/src/index.js');
});

/** Account management routes */

server.route('/register')
    .get((req, res, next) => {
        console.log("Am I about to sign something?");
        return res.render(/*Une page angular*/(err, html) => {
            if (err) {
                return res.send(err.message);
            }
            if (html) {
                return res.send(html);
            }
        })
    }).post(async (req, res, next) => {
        const userName = req.body?.userName;
        const userPassword = req.body?.userPassword;
        const userId = uuid();
        const saltRounds = 15;
        let notificationMessage = {};

        if (userPassword && userName) {
            try {
                const findUserResult = await findOne(
                    String(process.env.DBNAME),
                    'users',
                    {userName: userName} 
                );

                if (!findUserResult) {
                    try {
                        const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

                        await insertOne(
                            String(process.env.DBNAME),
                            'users',
                            {
                                id: userId,
                                userName: userName,
                                password: hashedPassword
                            }
                        );
                    } catch (error) {
                        return next(error);
                    }

                    notificationMessage = {
                        message: `Un nouveau compte a été créé pour le pseudonyme: ${userName}. Vous allez être redirigé vers la page de connexion dans quelques instants`,
                        url: '/login',
                        timeout: 10000,
                        success: true
                    };

                    req.session.user = {
                        id: userId,
                        userName: userName
                    }
                } else {
                    notificationMessage = {
                        message: "Ce pseudonyme existe déjà. Veuillez en choisir un différent",
                        success: false
                    };
                }
            } catch(error) {
                return next(error);
            }
        } else {
            notificationMessage = {
                message: "Il manque une information nécessaire (Pseudonyme et/ou mot de passe). Merci de vérifier que vous ayait bien rempli tout les champs marqué d'une astérisque",
                success: false
            };
        }
        return res.json(notificationMessage)
    });

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