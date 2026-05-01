const mongoose = require("mongoose");
require("dotenv").config();
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
}).then(() => {
    console.log("Connected...");
}).catch(() => {
    console.log("Failed...");
})

const LoginSchema = new mongoose.Schema({
    username: {
        type: String,
        maxLength: 15,
        unique:true,
        required: true
    },
    password: {
        type: String,
        maxLength: 14,
        unique:true,
        required: true
    }
})


const collection = new mongoose.model("connection1", LoginSchema)

module.exports = collection