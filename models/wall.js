import mongoose from 'mongoose';

const wallSchema = new mongoose.Schema({
    date: {},
    time: {},
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
})