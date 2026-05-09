const express = require('express')
const app = express()
const path = require("path")
const hbs = require('hbs')
const User = require('./models/signupLogin')
const Cart = require('./models/cart')
const Product = require('./models/products')
const Order = require('./models/orders')
const PORT = process.env.PORT;
const session = require("express-session");
const products = require('./products.json');
const mongoose = require("mongoose");
const { totalmem } = require('os')
const { arrayBuffer } = require('stream/consumers')
const adminID = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
require("dotenv").config();

app.use(session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //     maxAge: 1000 * 60 * 60
    // }
}));

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, './views'))
app.use(express.static(path.join(__dirname, './public')));


// Password validation function
function validatePassword(password) {
    let minlength = 6;
    let hasNumber = false;
    let hasUppercase = false;
    let hasLowercase = false;
    let hasSpecialchar = false;
    const Specialchar = "@#%*";

    if (password.length < 6) {
        return false;
    } else {
        for (let i = 0; i < password.length; i++) {
            const ch = password[i];
            if (ch >= 'A' && ch <= 'Z') {
                hasUppercase = true;
            } else if (ch >= 'a' && ch <= 'z') {
                hasLowercase = true;
            } else if (ch >= '0' && ch <= '9') {
                hasNumber = true;
            } else {
                for (let x = 0; x < Specialchar.length; x++) {
                    let y = Specialchar[x];
                    if (ch == y) {
                        hasSpecialchar = true;
                    }
                }
            }
        }
    }
    return (hasNumber && hasLowercase && hasSpecialchar && hasUppercase);
}

// isAdmin middleware
const isAdmin = function (req, res, next) {
    try {
        if (!req.session.user) {
            return res.status(401).redirect('/login');
        }

        if (!req.session.user.isAdmin) {
            return res.status(403).send("Access Denied: Admins only");
        }

        next();
    } catch (err) {
        res.status(500).send("Server Error");
    }
}

// isUser middleware
const isUser = function (req, res, next) {
    try {
        if (!req.session.user) {
            return res.status(401).redirect('/login');
        }

        if (req.session.user.isAdmin) {
            return res.status(403).send("Access Denied: Users only");
        }
        next();
    } catch (err) {
        res.status(500).send("Server Error")
    }
}


// Home route
app.get('/', async (req, res) => {
    const prod = await Product.find({});
    res.render("home", {
        products: prod
    })
})

//login route
app.get('/login', (req, res) => {

    if (req.session.user) {
        return res.redirect("/customer-dashboard");
    }
    return res.render("login");
})

// signup route
app.get('/signup', (req, res) => {
    res.render("signup")
})

// admin-dashboard
app.get('/admin-dashboard', isAdmin, async (req, res) => {

    try {
        let searchProduct = req.query.query;
        let addedProduct = await Product.find({}).limit(10);
        if (searchProduct) {
            addedProduct = await Product.find(
                { productName: { $regex: searchProduct, $options: 'i' } }
            )
        }
        const order = await Order.find({}).populate("user_id").populate("items.product");
        const pendingOrders = order.filter(order =>
            order.items.filter(item => item.status === "Pending")
        );

        res.render('admin_dashboard', {
            products: addedProduct,
            orders: order,
        });

    } catch (error) {
        console.log(error);
        res.status(400).send("Error Fetching Data");
    }

})


// Sign Up route 
app.post("/signup", async (req, res) => {
    try {
        const input1 = req.body.username;
        const input2 = req.body.password;
        const input3 = req.body.email;

        if (!input1 || !input2) {
            return res.status(400).send("Missing input");
        }
        if (input1.length > 15 || input2.length > 14 || input3.length > 20) {
            return res.status(400).send("Too long input");
        }
        if (!validatePassword(input2)) {
            return res.status(400).send("Password must have atleast a number uppercase letter lowercase letter and special charecter")
        }
        const existingCustomer = await User.findOne({ email: input3 })

        if (existingCustomer) {
            return res.status(400).send("Email Id already Exist");
        }

        const data = {
            username: input1,
            email: input3,
            password: input2
        }

        const us = await User.create(data)
        req.session.user = {
            id: us._id.toString(),
            username: us.username.toString(),
            email: us.email.toString(),
            isAdmin: us.isAdmin
        };
        res.status(200).redirect('/customer-dashboard');
    } catch (err) {
        res.status(500).send("Something went wrong");
    }
})


// Login route
app.post("/login", async (req, res) => {
    try {
        const input1 = req.body.username;
        const input2 = req.body.password;

        if (!input1 || !input2) {
            return res.status(400).send("Missing input");
        }

        if (input1.length > 15 || input2.length > 14) {
            return res.status(400).send("Too long input");
        }


        const user = await User.findOne({ username: req.body.username })

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (user.password === req.body.password) {
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            };
            if (user.isAdmin) {
                return res.redirect('/admin-dashboard')
            } else {
                return res.redirect('/customer-dashboard')
            }
        } else {
            return res.status(400).send("Incorrect password")
        }

    } catch (err) {
        return res.status(500).send("Server error");
    }

})

// Customer dashboard
app.get('/customer-dashboard', isUser, async (req, res) => {

    try {
        let searchProduct = req.query.query;
        if (searchProduct) {
            const prod = await Product.find(
                { productName: { $regex: searchProduct, $options: 'i' } }
            )
            res.status(200).render("customer_dashboard", {
                name: req.session.user.username,
                products: prod
            });
        } else {
            const prod = await Product.find({}).limit(18);

            res.status(200).render("customer_dashboard", {
                name: req.session.user.username,
                products: prod
            });
        }
    } catch (error) {
        res.status(400).send("Something Went Wrong");
    }

});


// Cart route
app.get('/cart', isUser, async (req, res) => {
    try {
        // const name = req.session.user.username
        const customerObjectId = req.session.user.id;
        let cart = await Cart.findOne({ user_id: customerObjectId }).populate("items.product");

        if (!cart) {
            cart = new Cart({
                user_id: customerObjectId,
                items: []
            });
        }
        let price = 0;
        for (let i = 0; i < cart.items.length; i++) {
            price += cart.items[i].price;
        }
        if (cart) {
            return res.status(200).render("cart", {
                user_id: customerObjectId,
                products: cart.items,
                totalPrice: price
            });
        } else {
            res.status(404).send("Your Cart Is empty");
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
});


// Logout Route
app.get('/logout', isUser, (req, res) => {
    req.session.destroy(() => {
        res.status(200).redirect('/login');
    });
})


// Add product route for admin
app.get('/add-product', isAdmin, (req, res) => {
    res.status(200).render('addProduct');
})


//bulk add
app.get('/bulk-add', isAdmin, (req, res) => {
    res.status(200).render('bulk_add');
})


//bulk-add route
app.post('/bulk-add', isAdmin, async (req, res) => {
    try {
        await Product.insertMany(products);
        res.status(200).redirect('/admin-dashboard');
    } catch (err) {
        res.status(500).send("Error adding products");
    }
})


// Add product route
app.post('/add-product', isAdmin, async (req, res) => {

    try {
        const proname = req.body.ProductName;
        const prodesc = req.body.ProductDescription;
        const proprice = req.body.ProductPrice;

        prod = {
            productName: proname,
            productDescription: prodesc,
            quantity: 2,
            price: proprice
        }

        const add_prod = await Product.insertOne(prod);

        return res.redirect('/admin-dashboard');
    } catch (err) {
        res.status(500).send(("Server Error"));
    }
})


// Search
app.get('/search', async (req, res) => {

    try {
        let searchProduct = req.query.query;
        if (!searchProduct) {
            return res.send("Please enter a search term");
        }

        const prod = await Product.find(
            { productName: { $regex: searchProduct, $options: 'i' } }
        )
        if (req.session.user) {

            res.render('customer_dashboard', { products: prod });
        } else {
            res.render('home', { products: prod });
        }

    } catch (error) {
        res.status(400).send("Something Went Wrong");
    }


})


// Add to cart
app.post('/add-to-cart/:productID', isUser, async (req, res) => {

    try {
        const customerObjectId = req.session.user.id;
        const productID = req.params.productID;
        let cart = await Cart.findOne({ user_id: customerObjectId });

        if (!cart) {
            cart = new Cart({
                user_id: customerObjectId,
                items: []
            });
        }

        const existingItem = await cart.items.find(
            item => item.product.toString() === productID
        );

        if (existingItem) {
            return res.status(200).send("Already Added");
        }
        else {
            cart.items.push({
                product: productID,
                quantity: 1,
                price: req.body.price
            });
            await cart.save();
        }
        await cart.populate("items.product")
        return res.status(200).redirect('/cart');
    } catch (err) {
        res.status(500).send("Server Error");
    }
})


// delete product route
app.post('/delete-product/:productID', isAdmin, async (req, res) => {
    try {
        const productID = req.params.productID;
        await Product.findOneAndDelete({ _id: productID });
        res.status(200).redirect('/admin-dashboard');
    } catch (err) {
        res.status(500).send("Server Error");
    }
})

// edit-product route
app.get('/edit-product/:productID', isAdmin, async (req, res) => {

    try {
        const productID = req.params.productID;
        const prod = await Product.findOne({ _id: productID });
        res.status(200).render('update_product', {
            product: prod,
        })
    } catch (error) {
        res.status(404).send("Error fetching product")
    }
})

//edit product route
app.post('/edit-product/:productID', isAdmin, async (req, res) => {

    try {
        const proname = req.body.ProductName;
        const prodesc = req.body.ProductDescription;
        const proprice = req.body.ProductPrice;

        let updatedData = {
            productName: proname,
            productDescription: prodesc,
            quantity: 2,
            price: proprice
        }

        const add_prod = await Product.updateOne(
            { _id: req.params.productID },
            updatedData
        );

        return res.status(200).redirect('/admin-dashboard');
    } catch (error) {
        res.status(404).send('Error updating Product');
    }
})

//Place-order route
app.post('/place-order/:productID', isUser, async (req, res) => {

    try {
        const customerObjectId = req.session.user.id;
        const productID = req.params.productID;
        const selected = req.body.paymentMethod;
        const location = req.body.location;
        let order = await Order.findOne({ user_id: customerObjectId });
        const prod = await Product.findOne({ _id: productID });

        if (!order) {
            order = new Order({
                user_id: customerObjectId,
                items: []
            });
        }
        const finalPrice = prod.price;
        const existingItem = order.items.find(
            item => item.product.toString() === productID
        );

        if (existingItem) {
            existingItem.quantity += 1;
        }
        if (selected === "COD") {

            order.items.push({
                product: productID,
                quantity: 1,
                price: (parseFloat(finalPrice) + parseFloat(finalPrice * .01))
            });
        } else {
            order.items.push({
                product: productID,
                quantity: 1,
                price: finalPrice
            });

            order.totalAmount = finalPrice;
        }
        order.orderlocation = location;
        await order.save();

        res.status(200).redirect('/orders');
    } catch (err) {
        // console.log(err);
        res.status(500).send("Some thing went wrong");
    }

})

//buy-now route
app.get('/buy-now/:productID', isUser, (req, res) => {
    const productID = req.params.productID;
    res.status(200).redirect(`/place-order/${productID}`);
})

//place order
app.get('/place-order/:productID', isUser, async (req, res) => {

    try {
        const productID = req.params.productID;

        const prod = await Product.findOne({ _id: productID });
        return res.render('place_order', {
            product: prod
        });
    } catch (err) {
        return res.status(500).send("Server Error");
    }
})

app.get('/place-order-from-cart/:customerID', isUser, async (req, res) => {

    const customerObjectId = req.session.user.id;
    let cart = await Cart.findOne({ user_id: customerObjectId });
    // let order = await Order.findOne({ user_id: customerObjectId });

    let total = 0;

    const orderItems = cart.items.map(item => {
        total += parseFloat(item.price) * parseFloat(item.quantity);
    })

    return res.render('place_order_cart', {
        user_id: customerObjectId,
        product: cart.items,
        totalPrice: total,
    });
})


app.post('/place-order-from-cart/:customerID', isUser, async (req, res) => {
    try {
        const customerObjectId = req.session.user.id;
        const selected = req.body.paymentMethod;
        const location = req.body.location;
        let cart = await Cart.findOne({ user_id: customerObjectId });
        let order = await Order.findOne({ user_id: customerObjectId });

        let total = 0;

        const orderItems = cart.items.map(item => {
            total += parseFloat(item.price) * parseFloat(item.quantity);
        })
        if (!order) {
            order = new Order({
                user_id: customerObjectId,
                items: []
            });
        }
        if (selected === "COD") {

            order.items = order.items.concat(cart.items);
            cart.items = [];
            order.totalAmount = parseFloat(total) + parseFloat(total * 0.01);

        } else {
            order.items = order.items.concat(cart.items);
            cart.items = [];
            order.totalAmount = total;
        }
        order.orderlocation = location;
        await cart.save();
        await order.save();
        // console.log(total, order.totalAmount)

        return res.status(200).redirect('/orders');
    } catch (error) {
        console.log(error)
        res.status(500).send("Something Went Wrong");
    }
})
// order route
app.get('/orders', isUser, async (req, res) => {

    try {
        const customerObjectId = req.session.user.id;

        let order = await Order.findOne({ user_id: customerObjectId }).populate("items.product");
        if (!order) {
            order = new Order({
                user_id: customerObjectId,
                items: []
            });
        }
        console.log(order);
        return res.render('order_list', {
            orders: order.items,
            status: order.status,
            totalAmount: order.totalAmount
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching data");
    }
})

//Remove from cart route
app.post('/remove-from-cart/:productID', isUser, async (req, res) => {

    try {
        const customerObjectId = req.session.user.id;
        const productID = req.params.productID;
        // console.log(productID);

        const cart = await Cart.findOne({ user_id: customerObjectId });
        cart.items = cart.items.filter(item =>
            item._id.toString() !== productID
        )

        await cart.save();
        res.status(200).redirect('/cart');
    } catch (err) {
        res.status(500).send("Server Error");
    }
})

app.get('/profile', isUser, async (req, res) => {
    const user_id = req.session.user.id;

    const user = await User.findOne({ _id: user_id });
    res.render('user_profile', {
        user: user,
    })
})

app.get('/change-password', isUser, async (req, res) => {
    res.render("change_password");
})

app.post('/change-password', isUser, async (req, res) => {

    try {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(403).send("All filds are required");
        }
        const userObjectId = req.session.user.id;
        let currUser = await User.findOne({ _id: userObjectId });
        if (currUser.password !== currentPassword) {
            return res.render("change_password", {
                error: "Incorrect Password"
            })
        }
        if (newPassword.length > 14 || confirmPassword.length > 14) {
            return res.render("change_password", {
                error: "Length Must be less than 14"
            })
        }
        if (!validatePassword(newPassword)) {
            return res.render("change_password", {
                error: "Must include Uppercase,Lowercase letter,symbol,number"
            })
            return res.status(400).send("")
        }
        if (newPassword !== confirmPassword) {
            return res.render('change_password', {
                error: "Passwords do not match"
            });
        } else {
            currUser.password = newPassword;
            await currUser.save();
            req.session.destroy(() => {
                return res.status(200).redirect('/login');
            })

        }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
})


//delete-order
app.post('/delete-order/:userID/:productID', isAdmin, async (req, res) => {
    try {

        const customerObjectId = req.params.userID;
        const productID = req.params.productID;

        let order = await Order.findOne({ user_id: customerObjectId });
        order.items = order.items.filter(item =>
            item._id.toString() !== productID
        )
        await order.save();
        return res.status(200).redirect('/admin-dashboard');

    } catch (error) {
        res.send('Error');
    }
})

// update-order
app.post('/update-order/:userID/:productID', isAdmin, async (req, res) => {
    try {
        const customerObjectId = req.params.userID;
        const productID = req.params.productID;

        // let order = await Order.findOne({ user_id: customerObjectId });


        await Order.updateOne(
            { user_id: customerObjectId, "items._id": productID },
            { $set: { "items.$.status": "Delivered" } }
        );

        return res.redirect('/admin-dashboard');

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
})

//delete-account route
app.get('/delete-account', isUser, (req, res) => {
    return res.render("delete_account");

})

app.post('/delete-account', isUser, async (req, res) => {

    try {
        const customerObjectId = req.session.user.id;
        const userPassword = req.body.password;

        let user = await User.findOne({ _id: customerObjectId })
        if (user.password === userPassword) {
            await User.findOneAndDelete({ _id: customerObjectId });
            return res.redirect('/signup');
        } else {
            return res.status(403).render("delete_account", {
                error: "Invalid Password"
            })
        }
    } catch (error) {
        return res.status(500).send("Something Went Wrong")
    }
})


//product-details route
app.get('/product-details/:productID', async (req, res) => {
    try {
        const productID = req.params.productID;
        const prod = await Product.findOne({ _id: productID });
        const category = prod.category;
        const similar = await Product.find(
            { category: { $regex: category, $options: 'i' } }
        ).limit(5);
        res.render('product_details', {
            product: prod,
            similarProducts: similar
        })
    } catch (err) {
        res.status(500).send("Server Error");
    }
})


//server
app.listen(PORT, () => {
    console.log("Server is running ......");
})


