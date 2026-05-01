const express = require('express')
const app = express()
const path = require("path")
const hbs = require('hbs')
const User = require('./src/signupLogin')
const Cart = require('./src/cart')
require("dotenv").config();
const PORT = process.env.PORT;


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, './views'))

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


app.get('/', (req, res) => {

    res.render("home")
})
app.get('/login', (req, res) => {

    res.render("login")
})

app.get('/signup', (req, res) => {

    res.render("signup")
})

app.post("/signup", async (req, res) => {


    const input1 = req.body.username;
    const input2 = req.body.password;

    if (!input1 || !input2) {
        return res.status(400).send("Missing input");
    }
    if (input1.length > 15 || input2.length > 14) {
        return res.status(400).send("Too long input");
    }

    if (!validatePasswoord(input2)) {
        return res.status(400).send("Password must have atleast a number uppercase letter lowercase letter and special charecter")
    }
    const data = {
        username: input1,
        password: input2
    }

    console.log(data);
    await User.insertMany([data])
    res.render('home')
})


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
        const check = await User.findOne({ username: req.body.username })
        if (!check) {
            return res.status(404).send("User not found");
        }

        if (check.password === req.body.password) {
            res.render('home', {
                name: req.body.username
            })
        } else {
            res.send("Incorrect password")
        }

    } catch (err) {

        res.status(500).send("Server error");
    }

})


app.listen(PORT, () => {
    console.log("Server is running ......");
})