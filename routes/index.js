var express   = require("express");
var router    = express.Router();
var passport  = require("passport");
var User      = require("../models/user");
var Item      = require("../models/item");
var async     = require("async");
var Notification = require("../models/notification");
var middleware = require("../middleware");
var nodemailer = require("nodemailer");
var multer = require('multer');
var crypto = require("crypto");

//======================================Cloudinary API======================================//
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  };
  var upload = multer({ storage: storage, fileFilter: imageFilter});

  var cloudinary = require('cloudinary');
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_API, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

//======================================HomePage Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Homepage
router.get("/", function(req,res){
  res.render("homepage");
});

//======================================FAQ Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The FAQ page
router.get("/faq", function(req,res){
  res.render("faq");
});

//======================================Updates Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Updates page
router.get("/updates", function(req,res){
  res.render("updates");
});

//======================================About Us Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The About Us page
router.get("/aboutus", function(req,res){
  res.render("aboutus");
});

//======================================Privacy Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Privacy page
router.get("/privacy", function(req,res){
  res.render("privacy");
});

//======================================Safety Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Safety page
router.get("/safety", function(req,res){
  res.render("safety");
});

//======================================Terms Of Use Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Terms Of Us page
router.get("/termsofuse", function(req,res){
  res.render("termsofuse");
});

//======================================Updates Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show The Senior Project page
router.get("/seniorproject", function(req,res){
  res.render("seniorproject");
});



///======================================Sign Up Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The Sign Up Form
router.get("/signup", function(req,res){
  res.render("signup");
});

//======================================Sign Up Create Route======================================//
//CREATE ROUTE - POST HTTP Request - Create A New Account
router.post("/signup", upload.single('image'), function(req,res){
req.body.username = req.sanitize(req.body.username);
req.body.firstname = req.sanitize(req.body.firstname);
req.body.lastname = req.sanitize(req.body.lastname);
req.body.email = req.sanitize(req.body.email);
    cloudinary.v2.uploader.upload(req.file.path, async function(err,result) {         //API Cloudinary 
      if (err) {
        req.flash("error", "Unable To Upload Image, Please Try Again Later");
        res.redirect("back");
      }
          req.body.image = result.secure_url;                                       //Add Cloundinary URL And Public Id To User
          req.body.imageId = result.public_id;

          var newUser = new User(
          {
            username:req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            image: req.body.image,
            imageId: req.body.imageId,
            
          });
          
    if(req.body.adminCode === process.env.ADMIN_CODE) {                           //Check To See If The User Is An Admin
      newUser.isAdmin = true;
    }

    if(req.body.studentCode === process.env.STUDENT_CODE) {                           //Check To See If The User Is An Admin
      newUser.isStudent = true;
    }
    
    User.register(newUser, req.body.password, function(err, user){                //Create The User Profile
      if(err){
        return res.render("signup", {"error": err.message});                  
      }
      passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome To Kingsville Connection " + user.username);  //Inform The User, The Account Has Been Created
            res.redirect("/");
          });
    });
  });
  });

//======================================Login Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show Login Form
// show login form
router.get("/login", function(req, res){
  res.render("login");
});

//======================================Login Create Route======================================//
//CREATE ROUTE - POST HTTP Request - Check If The Account Exists
router.post("/login", passport.authenticate("local",
{
  successRedirect:"/",
  failureRedirect:"/login"
}), function(req, res){
});


//======================================Forgot Form Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The User Profile
router.get('/users/:id', function(req, res) {
  User.findById(req.params.id, function(err, foundUser){                                //Find User By Id
    if(err){
      req.flash("error", "Unable To Found User Profile");
      res.redirect("/");
    }
    if(foundUser){
      Item.find().where("author.id").equals(foundUser._id).exec(function(err, items){     //Find Item By Author Id That Equals User Id
      if(err){
        req.flash("error", "Unable To Found Items");
        res.redirect("/");
      }    
      res.render("users/show", {user: foundUser, items: items});
    });
    }else{
            req.flash("error", "User No Longer Exists");
            res.redirect("back");
        }
  });
});

//======================================User Profile Edit Route======================================//
//EDIT ROUTE - GET HTTP Request - Edit The Profile With Edit Form
router.get("/users/:id/edit", middleware.isLoggedIn ,function(req,res){
  User.findById(req.params.id, function(err, editUser){                               //Find User By Id
    if(err){
     req.flash("error", "Unable To Get To Edit Form");
      res.redirect("back");
    }else{
      res.render("users/edit", {user: editUser});  
    }
  });
});

//======================================User Profile Update Route======================================//
//UPDATE ROUTE - PUT HTTP Request - Update The User Profile
router.put("/users/:id", upload.single('image'), function(req, res){
req.body.university = req.sanitize(req.body.university);
req.body.gender = req.sanitize(req.body.gender);
req.body.year = req.sanitize(req.body.year);
req.body.profession = req.sanitize(req.body.profession);
    User.findById(req.params.id, async function(err, updateUser){                     //Find User By Id
      if(err){
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        if (req.file) {
          try {
            await cloudinary.v2.uploader.destroy(updateUser.imageId);
            var result = await cloudinary.v2.uploader.upload(req.file.path);
                  updateUser.imageId = result.public_id;                            //Add Public Id and Secure URL To User
                  updateUser.image = result.secure_url;
                } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
                }
              }
            updateUser.university = req.body.university;                          //Update User With University, Gender, Year, and Profession
            updateUser.gender = req.body.gender;
            updateUser.year = req.body.year;
            updateUser.profession = req.body.profession;
            
            updateUser.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/users/" + updateUser._id);
          }
        });
  });

//======================================User Profile Destroy Route======================================//
//Destroy ROUTE - DELETE HTTP Request - Update The User Profile
router.delete('/users/:id', function (req, res) {
    User.findById(req.params.id, async function (err, deleteUser) {               //Find User By Id
      if (err) {
        req.flash("error", "User Could Not Be Deleted");
        return res.redirect("back");
      }
      try {
            await cloudinary.v2.uploader.destroy(deleteUser.imageId);             //Delete The User Profile Image From Cloudinary
            deleteUser.remove();
            req.flash('success', 'User Deleted successfully');
            res.redirect('/');
          } catch (err) {
            if (err) {
              req.flash("error", "User Could Not Be Deleted");
              return res.redirect("back");
            }
          }
        });
  });

//======================================Logout Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Send The Use Back To The Homepage
router.get("/logout",function(req, res) {
  req.logout();
  req.flash("success", "Logged You Out");
  res.redirect("/");
});

//======================================Forgot Form Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The Forgot Form
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

//======================================Forgot Form Create Route======================================//
//CREATE ROUTE - POST HTTP Request - Create The Forget Password And Token
router.post('/forgot', function(req, res, next) {
  async.waterfall([                                                       //async.waterfall - Runs an array of functions in series, 
    function(done) {                                                      //each passing their results to the next in the array
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');                                  //Token Written In Hex
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {     //Find The One User With The Email
        if (err) { return done(err); }
        if (!user) {
          req.flash('error', 'No Account With That Email Address Exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;             //Give The User A Token With A One Hour Time Limit

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({              //Send An Email To The User With The Website Email
        service: 'Gmail', 
        auth: {
          user: 'kingsville.connection@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kingsville.connection@gmail.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail Has Been Sent To ' + user.email + ' With Further Instructions.');
        done(err, 'done');
      });
    }
    ], function(err) {
      if (err) return next(err);
      return res.redirect('/forgot');
    });
});

router.get('/reset/:token', function(req, res) {                      //The Token Has Expired
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (err) { return (err); }
    if (!user) {
      req.flash('error', 'Password Reset Token Is Invalid Or Has Expired.');
      res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

//======================================Forgot Form Create Route======================================//
//CREATE ROUTE - POST HTTP Request - Create The Forget Password Form To Change Password
router.post('/reset/:token', function(req, res) {
  async.waterfall([                                                             //async.waterfall - Runs an array of functions in series,     
    function(done) {                                                            //each passing their results to the next in the array
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          req.flash('error', 'Password Reset Token Is Invalid Or Has Expired.');
          return res.redirect('back');
        }
        
        if(req.body.password === req.body.confirm) {                            //Confirm The New Password
          user.setPassword(req.body.password, function(err) {
            if (err) { return done(err); }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {                                           //Save The New Password
              if (err) { return done(err); }
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
          req.flash("error", "Passwords Do Not Match.");
          return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'kingsville.connection@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kingsville.connection@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
    ], function(err) {
      if(err){
        req.flash('error', 'Password Unable To Be Changed.');
      }
      res.redirect('/');
    });
});

//======================================Notifications Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The Follower Notifications On The Menu Bar
router.get('/users/:id', async function(req, res) {
  try {
    let user = await User.findById(req.params.id).populate('followers').exec();       //let == var, Find User By Id Populate With Followers
    res.render('/users/' + req.params.id, { user });
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

//======================================Notifications Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The Notifications On The Menu Bar
router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);                                //let == var, Find User By Id Populate With Followers
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'Successfully followed ' + user.username);             //User Follows Other User
    res.redirect('/users/' + req.params.id);
    
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

//======================================Notification Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show All The Notifications 
router.get('/notifications', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({                   //let == var, Find Users By Id
      path: 'notifications',
      options: { sort: { "_id": -1 } }                                        //Sort The Notifications In Reverse Order
    }).exec();
    
    let allNotifications = user.notifications;                              
    res.render('notifications/index', { allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

//======================================Notifications Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Confirm That Notifications Have Been Read
router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);      //let == var, Find Notifications By Id
    notification.isRead = true;
    notification.save();
    
    res.redirect(`/items/${notification.itemId}`);                      //${} - Allow for multiline strings and string interpolation
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});


//======================================URL======================================//
router.get('*', function (req, res) {
 res.redirect('/');
});


module.exports = router;