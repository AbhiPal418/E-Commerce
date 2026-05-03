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
    quantity: {
        type: Number,
        default: 1

    },
    price: {
        type: Number,
        required: true

    }
}
);

module.exports = mongoose.model("Product", ProductSchema);

