const mongoose = require("mongoose");
require("dotenv").config();
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
}).then(() => {
    console.log("Connected product...");
}).catch(() => {
    console.log("Failed...");
})


const ProductSchema = new mongoose.Schema({

    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productDescriptionDetailed: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: "All"
    },
    availabelity: {
        type: Boolean,
        default: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    price: {
        type: Number,
        required: true

    },
    image: {
        type: String,
        default: "\\images\\MensStyleLooks.jpeg"
    },
    itemCatagory:{
        type:String,
        required:true
    }
}
);

module.exports = mongoose.model("Product", ProductSchema);

