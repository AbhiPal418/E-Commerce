const mongoose = require("mongoose");
require("dotenv").config();
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
}).then(() => {
    console.log("Connected orders...");
}).catch(() => {
    console.log("Failed...");
})


const OrderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
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

            },
            status: {
                type: String,
                default: "Pending"
            },
            orderDate: {
                type: Date,
                default: Date.now
            }
        }
    ],
    totalAmount: {
        type: Number,
    },
    orderStatus: {
        type: String,
        default: "Placed"
    },
    orderlocation:{
        type:String,
        required:true
    }

}
);


module.exports = mongoose.model("Order", OrderSchema);

