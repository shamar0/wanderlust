if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
// console.log(process.env.SHA);

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dbUrl = process.env.ATLASDB_URL;


const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const User= require("./models/user.js");
const Listing = require("./models/listing.js");
const { error } = require("console");

main()
.then(res=>console.log("connected"))
.catch(err=>console.log(err));

async function main(){
    await mongoose.connect(dbUrl);
}

app.use(express.static (path.join(__dirname,"/public")));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"/views"));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
      secret:process.env.SECRET
    },
    touchAfter:24*3600, //in seconds
  })

  store.on("error",()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
  })

  const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+ 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
    }
}
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user;
    next();
})


app.listen(8080, (req,res)=>{
    console.log("listening");
})


app.get("/", (req,res)=>{
    res.send("hi");
})

app.get("/listings/:id/preview/:imageId", async(req,res)=>{
    let {id,imageId} = req.params;
    let listing = await Listing.findById(id);
    console.log(id,"..", imageId);
    res.render("listings/show_preview.ejs", {listing,imageId});
    // res.send(imageId);
})

// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email:"s@gmail.com",
//         username:"sham"
//     });
//    let registeredUser= await User.register(fakeUser,"helloworld");
//     console.log(registeredUser);
//     res.send(registeredUser);
// });

//LISTING
app.use("/listings",listingRouter);

//REVIEW 
app.use("/listings/:id/reviews",reviewRouter);

//USER
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    // console.log(err._message);
    res.send("OOPS! Something went wrong");
})
app.use((err,req,res,next)=>{
    console.log(err.message);
    // res.send(err._message);
    res.render("listings/error.ejs",{err});
})

// const find = async()=>{
//     let listing = await Listing.findById('65db0b8e0a81c67df278ebef');
//     console.log(listing);
// }
// find();