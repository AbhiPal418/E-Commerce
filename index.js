const express = require('express')
const app = express()
const path = require("path")
const hbs = require('hbs')
const User = require('./src/signupLogin')
const Cart = require('./src/cart')
const Product = require('./src/products')
require("dotenv").config();
const PORT = process.env.PORT;
const session = require("express-session");
const products = require('./src/products');
const adminID = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

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
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // console.log(req.session.user.isAdmin);

    if (!req.session.user.isAdmin) {
        return res.send("Access Denied: Admins only");
    }

    next();
}

// isUser middleware
const isUser = function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // console.log(req.session.user.isAdmin);
    if (req.session.user.isAdmin) {
        return res.send("Access Denied: Admins only");
    }

    next();
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

    const addedProduct = await Product.find({});
    res.render('admin_dashboard', {
        products: addedProduct
    });
})


// Sign Up route 
app.post("/signup", async (req, res) => {

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
        isAdmin: us.isAdmin()
    };
    res.redirect('/customer-dashboard')
})


// Login route
app.post("/login", async (req, res) => {
    const input1 = req.body.username;
    const input2 = req.body.password;

    if (!input1 || !input2) {
        return res.status(400).send("Missing input");
    }

    if (input1.length > 15 || input2.length > 14) {
        return res.status(400).send("Too long input");
    }

    try {
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
            return res.send("Incorrect password")
        }

    } catch (err) {

        return res.status(500).send("Server error");
    }

})

// Customer dashboard
app.get('/customer-dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        let searchProduct = req.query.query;
        if (searchProduct) {
            const prod = await Product.find(
                { productName: { $regex: searchProduct, $options: 'i' } }
            )
            res.render("customer_dashboard", {
                name: req.session.user.username,
                products: prod
            });
        } else {
            const prod = await Product.find({});

            res.render("customer_dashboard", {
                name: req.session.user.username,
                products: prod
            });
        }


    } catch (error) {
        console.log(error);
        res.status(400).send("Something Went Wrong");
    }

});


// Cart route
app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const name = req.session.user.username
    const customerObjectId = req.session.user.id;
    let cart = await Cart.findOne({ user_id: customerObjectId }).populate("items.product");


    res.render("cart", {
        name: req.session.user.username,
        products: cart.items,
    });
});


// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
})


// Add product route for admin
app.get('/add-product', isAdmin, (req, res) => {
    res.render('addProduct');
})

// Add product route
app.post('/add-product', isAdmin, async (req, res) => {

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
        console.log(error);
        res.status(400).send("Something Went Wrong");
    }


})


// Add to cart
app.post('/add-to-cart/:productID', async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const customerObjectId = req.session.user.id;
    const productID = req.params.productID;
    let cart = await Cart.findOne({ user_id: customerObjectId });

    if (!cart) {

        cart = new Cart({
            user_id: customerObjectId,
            items: []
        });
    }
    // console.log(cart.items);

    const existingItem = await cart.items.find(
        item => item.product.toString() === productID
    );

    // console.log(existingItem);
    if (existingItem) {
        return res.send("Already Added");
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
    return res.render('cart', {
        products: cart.items,
    });

})


// delete product route
app.post('/delete-product/:productID', isAdmin, async (req, res) => {

    const productID = req.params.productID;
    await Product.findOneAndDelete({ _id: productID });
    res.redirect('/admin-dashboard');
})

// edit-product route
app.get('/edit-product/:productID',isAdmin, async (req, res) => {

    try {
        const productID = req.params.productID;
        const prod = await Product.findOne({ _id: productID });
        res.render('update_product', {
            product: prod,
        })
    } catch (error) {
        res.status(404).send("Error fetching product")
    }
})

//edit product route
app.post('/edit-product/:productID',isAdmin, async (req, res) => {

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

        return res.redirect('/admin-dashboard');
    } catch (error) {
        res.status(404).send('Error updating Product');
    }
})


//place order
app.get('/place-order',isUser,(req,res)=>{
    res.send("hello")
    
})

app.get('/buy-now/:productID',(req,res)=>{
    res.redirect('/place-order');
})

app.post('/buy-now/:productID',(req,res)=>{

})



//server
app.listen(PORT, () => {
    console.log("Server is running ......");
})
