require('dotenv').config();                                   //Require the .env file and load values into varables for security reasons.  
/*===========================================================================*/
/*Libraries Used In Web-Application*/

var express                 = require("express"),            //Require the Express Library :  The framework of the website
    app                     = express(),                     //Use the express() function from Express Library and place into into app
    bodyParser              = require("body-parser"),        //Require the body-parser library :  Used 
    mongoose                = require("mongoose"),           //Require the mongosose database library : Connect To Database
    flash                   = require("connect-flash"),      //Require the connect-flash library : show the errors
    passport                = require("passport"),           //Require the passport library : Authentications For New Accounts
    LocalStrategy           = require("passport-local"),     //Require the passport-local library : Local Authentication Strategy authenticates users using a username and password
    methodOverride          = require("method-override"),    //Require the method-orderride : Use for the UPDATE and DELETE routes
    expressSanitizer        = require("express-sanitizer"),  //Require the express-sanitizer library : Sanitize the user input
    Moment                  = require("moment"),             //Require the moment library : Use to determine when a post has been posted
    Item                    = require("./models/item"),     
    Comment                 = require("./models/comment"),   //Require the models that will be implement into the database
    Reviews                 = require("./models/reviews"),
    User                    = require("./models/user");


/*===========================================================================*/
/*Routes Are Place Into Seperate Folders To Improve Readability And Become Required*/

//Configure dotenv

// require('dotenv').load();                                   //Require the .env file and load values into varables for security reasons.  


/*===========================================================================*/
/*Routes Are Place Into Seperate Folders To Improve Readability And Become Required*/

var commentRoutes   = require("./routes/comments"),
    reviewRoutes     = require("./routes/reviews"),          //Require the routes in the folder and assign to a variable
    itemsRoutes     = require("./routes/items"),
    indexRoutes     = require("./routes/index");

/*===========================================================================*/
/*Connect To Local Database By MongoDB*/

var url = process.env.DATABASE || "mongodb://localhost:27017/kconnection_v1";

mongoose.connect(url, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);                       //Set useCreateIndex to true : Reason collection.ensureIndex is Deprecation
mongoose.set('useFindAndModify', false);                    //Reason collection.findAndModify is deprecated


/*===========================================================================*/
/*Extracting Data From A Form And Use in Web-pages*/

app.use(bodyParser.urlencoded({extended: true}));           //Use the bodyParse to populate the req.body with form-encoded sources.

/*===========================================================================*/
/*Use The ExpressSanitizer Library */

app.use(expressSanitizer());                                //Use the expressSanitizer library to clean user input

/*===========================================================================*/
/*Using The EJS Library To Remove ejs From Linked Routes*/

app.set("view engine", "ejs");                      

/*===========================================================================*/
/*Use To Linked To Public Without Having To Write Directory Name*/

app.use(express.static(__dirname +"/public"));      

/*===========================================================================*/
/*Use To Create PUT and DELETE HTTP Requests*/

app.use(methodOverride("_method"));

/*===========================================================================*/
/*Use The Connect-Flash Library*/

app.use(flash());

/*===========================================================================*/
/*Configuration Of The Passport Library*/

app.use(require("express-session")({
    secret: "EaSt3R3gg 2.0",
    resave: false,
    saveUninitialized: false
}));

/*===========================================================================*/
/*Use The MomentJS Library*/

app.locals.moment = require("moment");          //Locals is used require moment library on every page

/*===========================================================================*/
/*Configuration Of The Passport Library*/

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());           //Passport.js : how to get information from a user object to store in a session (serialize)
passport.deserializeUser(User.deserializeUser());       //And how to take that information and turn it back into a user object (deserialize).

/*===========================================================================*/
/*Use The Passport-Local To Get The Information Of The Current User Login*/

app.use(async function(req, res, next){                 //async function 
   res.locals.currentUser = req.user;                   //Locals allows the currentUser to be on all webpages
   if(req.user) {
    try {
      let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();   //Populate the notifications from the user
      res.locals.notifications = user.notifications.reverse();      //Notifications will be present on every page 
    } catch(err) {
      console.log(err.message);
    }
   }
   res.locals.error = req.flash("error");           //Locals allows the flash message (err) to be on all webpages
   res.locals.success = req.flash("success");       //Locals allows the flash message (success) to be on all webpages
   next();
});

/*===========================================================================*/
/*Reduce The Repeating URLs Length and Improve Routes Readability  */


app.use("/items", itemsRoutes);
app.use("/items/:id/comments", commentRoutes);
app.use("/items/:id/reviews", reviewRoutes);
app.use("/", indexRoutes);
/*===========================================================================*/
/*SETS UP THE SERVER*/
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Kingsville Connection Server Started");
});
