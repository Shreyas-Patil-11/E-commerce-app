const express = require("express")
const app = express()
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const cors = require("cors")



const port = 4000;

app.use(express.json());
app.use(cors());

mongoose.connect(`${process.env.MONGODB_KEY}`)

//API creation

app.get("/", (req, res)=>{
    res.send("Express App is running")
})

// Image Storage Engine
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'upload/images'),
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});


const upload = multer({storage:storage})

//Creating Upload Endpoints for images
app.use("/images", express.static('upload/images'))
app.post("/upload", upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`${process.env.SERVER_URL}/images/${req.file.filename}`
    })
})

//Schema for creating product
const Product = mongoose.model("Product",{
    id: {
        type: Number,
        required: true,     
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    new_price:{
        type: Number,
        required: true
    },
    old_price:{
        type: Number,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    available:{
        type: Boolean,
        default: true
    },
})

app.post("/addproduct", async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }else{
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved")

    // Send a success response
    res.json({ 
        success: true, 
        name: req.body.name    
    });
})

//Creating API for deleating Products
app.post('/removeproduct', async(req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})

//Creating API for getting all products
app.get('/allproducts', async(req, res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//schema creating for user model
const Users = mongoose.model('Users',{
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Map,
        of: Number,
        default: {}
    },
    data: {
        type: Date,
        default: Date.now,
    }
})

//Creating endpoint for resistering user
app.post('/signup', async (req, res) => {
    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "Existing User found with same E-mail Address" });
        }

        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        // Hash the password before saving

        const user = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
        });

        await user.save();

        const data = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(data, 'secret_ecom');
        return res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, errors: "Server Error" });
    }
});


//Creating endpoint for user login
app.post('/login', async (req, res) => {
    try {
        const user = await Users.findOne({ email: req.body.email });
        if (user) {
            const passCompare = req.body.password === user.password;
            if (passCompare) {
                const data = {
                    user: {
                        id: user.id
                    }
                };
                const token = jwt.sign(data, 'secret_ecom');
                console.log(token);
                
                return res.json({ success: true, token });
            } else {
                return res.json({ success: false, errors: "Wrong Password" });
            }
        } else {
            return res.json({ success: false, errors: "Wrong Email ID" });
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, errors: "Server Error" });
        }
    }
});



//creating endpoint for newcollection data
app.get('/newcollections', async (req, res)=> {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log('NewCollection Fetched')
    res.send(newcollection);
})

//creating endpoint in popular in women
app.get('/popularinwomen', async(req,res)=> {
    let products = await Product.find({category: 'women'})
    let popular_in_women = products.slice(0,4);
    console.log('Popular in women fetched')
    res.send(popular_in_women);
})

//creating middleware to fetch user
const fetchUser =async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({errors: 'Please authenticate using valid token'})
    }else{
        try{
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        }catch(error){
            res.status(401).send({errors: "Please authenticate using valid token"})
        }
    }
}

//creating endpoints for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.body.itemId;

        let userData = await Users.findById(userId);

        // Initialize cartData for the item if it doesn't exist
        if (!userData.cartData.get(itemId)) {
            userData.cartData.set(itemId, 0);
        }

        // Increment the item quantity in the cart
        userData.cartData.set(itemId, userData.cartData.get(itemId) + 1);

        // Update the user's cartData in the database
        await Users.findByIdAndUpdate(
            userId,
            { $set: { cartData: userData.cartData } },
            { new: true }
        );

        res.status(200).send("Item added to cart");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding item to cart");
    }
});


//creating endpoints to remove products from cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("removed", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0) {
        userData.cartData[req.body.itemId] -= 1;
    }
    await Users.findByIdAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
});


//creating endpoint to get cartdata
app.post('/getcart',fetchUser, async(req, res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id: req.user.id})
    res.json(userData.cartData || {})
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server running at port " + port);
    }else{
        console.log("Error"+ error);
    }
});