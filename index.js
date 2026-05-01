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

app.use(session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: false
}));

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, './views'))

// Password validation function
function validatePasswoord(password) {
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


app.get('/',async (req, res) => {

    const prod = await Product.find({});
    console.log(prod);

    res.render("home",{
        products: prod
    })
})
app.get('/login', (req, res) => {

    res.render("login")
})

app.get('/signup', (req, res) => {

    res.render("signup")
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

    if (!validatePasswoord(input2)) {
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
    console.log(data);
    const us = await User.create(data)
    req.session.user = {
        id: us._id.toString(),
        username: us.username.toString(),
        email: us.email.toString()
    };
    res.redirect('/customer_dashboard')
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
                email: user.email
            };
            return res.redirect('/customer_dashboard')

        } else {
            res.send("Incorrect password")
        }

    } catch (err) {

        res.status(500).send("Server error");
    }

})

// Customer dashboard
app.get('/customer_dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render("customer_dashboard", {
        name: req.session.user.username
        
    });
});


// Cart route
app.get('/cart', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user_id = req.session.user.id
    const name = req.session.user.username
    console.log(name);

    res.render("cart", {
        name: req.session.user.username
    });
});


// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
})

app.post('/add',async (req, res) => {
    
    prod = [
        {
        product:"T - shirt",
        quantity:2,
        price:200
    },{
        product:"Shirt",
        quantity:5,
        price:500
    },{
        product:"Pant",
        quantity:2,
        price:1000
    },{
        product:"Phones",
        quantity:10,
        price:20000
    },
]

    const add_prod = await Product.create(prod);
    return res.redirect('customer_dashboard');

})

app.listen(PORT, () => {
    console.log("Server is running ......");
})