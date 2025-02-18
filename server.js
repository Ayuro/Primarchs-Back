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
import WallPost from './models/wallpost.js';

/** INIT DB */

const dataBase = mongoose;
dataBase.connect(String(process.env.MONGOURL), {dbName: String(process.env.DBNAME)}).then(() => {
    console.log('Connected to Mongo');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

/** INIT SERVER */

const corsOptions = {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
       const { userName, email, password, firstName, lastName, gender, age } = req.body;

       if (!userName || !password || !email || !firstName || !lastName || gender || !age) {
        return res.status(400).json({ message: 'Missing username or password' });
    }

       try{
        const existingUser = await User.findOne({ userName: userName});

        if (existingUser) {
            return res.status(400).json({ message: 'This user already exist'});
        }

        const hashedPassword = await bcrypt.hash(password, 15);

        const newUser = new User({ userName, email, password: hashedPassword, role: "user", firstName, lastName, gender, age });
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

    /** Logout */

server.get('/api/logout', (req, res, next) => {
    console.log("I'm just getting cigarettes, it will take 10mins");
    return res.send();
})

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log('Received token:', token);

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

    /** Wall */
    server.get('/api/wall/posts', authenticate, async (req, res) => {
        try {
            const loggedInUserId = req.user.userId;
        
            const user = await User.findById(loggedInUserId).populate('friends', '_id');
        
            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }

            const friendIds = user.friends.map(friend => friend._id);
            friendIds.push(loggedInUserId);
            const posts = await WallPost.find({ userId: { $in: friendIds } })
              .sort({ createdAt: -1 })
              .populate('userId', 'userName');
        
            res.json(posts);
          } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ message: 'Server error' });
          }
      });
      
    server.post('/api/wall/post', authenticate, async (req, res) => {
        try {
            const { userId, content } = req.body;

            if (!userId || !content.trim()) {
                return res.status(400).json({ message: "User ID and content are required." });
            }

            const newPost = new WallPost({ userId, content, createdAt: new Date() });
            await newPost.save();
          
            res.status(201).json(newPost);
        } catch (error) {
            console.error("Error saving post:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
    
      server.get('/api/wall/:userId', authenticate, async (req, res) => {
        try {
          const { userId } = req.params;
          const posts = await WallPost.find({ userId }).sort({ createdAt: -1 });
      
          res.json(posts);
        } catch (error) {
          console.error("Error fetching posts:", error);
          res.status(500).json({ message: "Server error" });
        }
      });      

    /** Profil */

    server.get('/api/profil/:userId', async (req, res) => {
      try {
          const userId = req.params.userId;
  
          if (!userId) {
              return res.status(400).json({ message: 'User ID is required' });
          }
  
          const user = await User.findById(userId).select('-password');
          if (!user) {
              console.log("User not found in database.");
              return res.status(404).json({ message: 'User not found' });
          }
  
          console.log("User found:", user);
          res.json(user);
      } catch (error) {
          console.error("Database error:", error);
          res.status(500).json({ message: 'Server error', error: error.message });
      }
  });  

server.put('/api/profil', authenticate, async (req, res) => {
  console.log('Authenticated user:', req.user);

  try {
      const { userName, email, firstName, lastName, gender, age } = req.body;

      if (!userName || !email || !firstName || !lastName || !gender || !age) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      const updatedUser = await User.findByIdAndUpdate(
          req.user.userId,
          { userName, email, firstName, lastName, gender, age },
          { new: true, runValidators: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Profile updated successfully', updatedUser });
  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: 'Error updating profile' });
  }
});

    /** Search user */

server.get('/api/users/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const users = await User.find({ 
      userName: { $regex: query, $options: 'i' }
    }, 'userName _id');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error during user search:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

    /** Friend request */

server.post('/api/friends/request', async (req, res) => {
    const { requesterId, recipientId } = req.body;
  
    if (!requesterId || !recipientId) {
      return res.status(400).json({ message: 'Both requesterId and recipientId are required' });
    }
  
    try {
      const recipient = await User.findById(recipientId);
  
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
  
      const isAlreadyRequested = recipient.friendRequests.some(request => request === requesterId);
  
      if (isAlreadyRequested) {
        return res.status(400).json({ message: 'Friend request already sent' });
      }

      recipient.friendRequests.push(requesterId);
      await recipient.save();
  
      res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      console.error('Error during friend request:', error);
      res.status(500).json({ message: 'Server Error' });
    }
});
  
/** Friend list */

server.get('/api/friends/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).populate('friends', 'userName _id');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.friends);
    } catch (error) {
        console.error('Error fetching friends: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

server.use('*', (req, res) => {
    res.sendFile(`${staticPath}/index.html`);
});

server.get('/api/friends/requests/:userId', authenticate, async (req, res) => {
    
    const { userId } = req.params;
    res.setHeader('Content-Type', 'application/json');
    console.log('Received friend requests request for:', req.params.userId);
    console.log("out of try");
    try {
        const user = await User.findById(userId).populate('friendRequests', 'userName _id');
        console.log("in try");
        if (!user) {
            console.log("404");
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ friendRequests: user.friendRequests });
        console.log("200");
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        console.log("500");
        res.status(500).json({ message: 'Server error' });
    }
});

server.put('/api/friends/accept', async (req, res) => {
    const { userId, requesterId } = req.body;
  
    try {
      await FriendRequestModel.findOneAndDelete({ requesterId, recipientId: userId });
      await UserModel.findByIdAndUpdate(userId, { $push: { friends: requesterId } });
      await UserModel.findByIdAndUpdate(requesterId, { $push: { friends: userId } });
  
      res.json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error accepting friend request' });
    }
  });
  
server.put('/api/friends/reject', authenticate, async (req, res) => {
    const { userId, requesterId } = req.body;

    if (!userId || !requesterId) {
        return res.status(400).json({ message: 'userId and requesterId are required' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the requesterId is in the friendRequests
        const index = user.friendRequests.indexOf(requesterId);
        if (index === -1) {
            return res.status(400).json({ message: 'No pending friend request from this user' });
        }

        // Remove the friend request
        user.friendRequests.splice(index, 1);
        await user.save();

        res.status(200).json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


/** Server listening */

server.listen(1986, () => {
    console.log(`Server listening on ${port}`);
})