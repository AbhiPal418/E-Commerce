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
        required: true
    },
    email:{
        type:String,
        maxLength:20,
        unique:true,
        required:true
    },
    password: {
        type: String,
        maxLength: 14,
        unique:true,
        required: true
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
})


const collection = new mongoose.model("User", LoginSchema)

module.exports = collection