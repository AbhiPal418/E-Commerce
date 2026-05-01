const mongoose = require("mongoose");
require("dotenv").config();
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
}).then(() => {
    console.log("Connected Cart...");
}).catch(() => {
    console.log("Failed...");
})


const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
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
    ]
});

module.exports = mongoose.model("Cart", cartSchema);

