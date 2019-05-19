var express = require("express");
var router = express.Router();
var Item    = require("../models/item");
var middleware = require("../middleware");
var Comment    = require("../models/comment");    
var Review = require("../models/reviews");
var Notification = require("../models/notification");
var User      = require("../models/user");
var multer = require('multer');

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

//=====================================Item's Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show All The Items
router.get("/", function(req, res){
    var perPage = 9;                                                           //Twelve Items Per Page
    var pageQuery = parseInt(req.query.page);                                   //Parses A String Argument And Returns An Integer
    var pageNumber = pageQuery ? pageQuery : 1;                                 //How Many Pages Will Be In The Paganation
    if(req.query.search){
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      Item.find({$or:[{ name: regex }, {type: regex}, {time: regex}, {description: regex}, {day: regex}, {location: regex}, {price: regex}, {"author.username":regex}, {bookAuthor: regex}]}).skip((perPage * pageNumber + 1) - perPage).limit(perPage).sort({createdAt:-1}).exec(function (err, allItems) {
       if(err){
        req.flash('error', 'Unable To Found Item Through Search Bar');
        return res.redirect('back');
      }
      Item.countDocuments({$or:[{ name: regex }, {type: regex}, {description: regex},{time: regex}, {day: regex}, {location: regex}, {price: regex}, {"author.username":regex}, {bookAuthor: regex}]}).exec(function (err, count) {
        if (err) {
          req.flash('error', 'Unable To Found Item Through Search Bar');
          return res.redirect('back');
        } else {
          if (allItems.length === 0) {
            req.flash('error', 'No Items Were Found During The Search');
            return res.redirect('/items');
          }
                    res.render("items/index", {                                 //Used For Pagination
                      items: allItems,
                      current: pageNumber,
                      pages: Math.ceil(count / perPage),
                      search: req.query.search
                    });
                  }
                });
    });
    } else {
        // get all items from DB
        Item.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).sort({createdAt:-1}).exec(function (err, allItems) {
          if(err){
            req.flash('error', 'Unable To Found Item Through Search Bar');
            return res.redirect('back');
          }
          Item.countDocuments().exec(function (err, count) {
            if (err) {
             req.flash('error', 'Unable To Found Item Through Search Bar');
           } else {
                    res.render("items/index", {                         //Used For Pagination
                     items: allItems,
                     current: pageNumber,
                     pages: Math.ceil(count / perPage),
                        search: false                                   //When No Input When Submitting The Search Button
                      });
                  }
                });
        });
      }
    });

//=====================================Item's Create Route======================================//
//POST ROUTE - POST HTTP Request - Create An Item
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
req.body.item.blog = req.sanitize(req.body.item.blog);
cloudinary.v2.uploader.upload(req.file.path, async function(err,result) {           //Use Cloudinary API
  if (err) {
    req.flash("error", "Unable To Upload An Image, Try Later.");
    req.redirect("back");
  }
  req.body.item.image = result.secure_url;                                          //Add Secure URL and Public Id To Item
  
  req.body.item.imageId = result.public_id;
  
  req.body.item.author = {                                                          //Add Author To Item
    id: req.user._id,
    username: req.user.username
  };    
  
  try {
      let item = await Item.create(req.body.item);                                  //let = var, Add Username and Item Id To Notifications
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        itemId: item.id
      };
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);              //Create A New Notification
        follower.notifications.push(notification);                                  //Push Notifications To Follers
        follower.save();
      }

      res.redirect('/items/' + item.id);                                            //Redirect Back To Items Page
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  });
});

//=====================================Item's New Route======================================//
//NEW ROUTE - GET HTTP Request - Show A New Form For Items
router.get("/new", middleware.isLoggedIn, function(req, res){
  res.render("items/new");
});

//=====================================Item's Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show More Detail Of Item
router.get("/:id", function (req, res) {
    Item.findById(req.params.id).populate("comments").populate({            //Find Item By Id And Populate With Comments
      path: "reviews",
        options: {sort: {createdAt: -1}}                                    //Sorted In Reverse Order
      }).exec(function (err, foundItem) {
        if(foundItem){
        if (err) {
          req.flash("error", "Unable To Show More Item Details.");
          req.redirect("/");
        } else {
          res.render("items/show", {item: foundItem});
        }
        }else{
          req.flash("error", "Material No Longer Exists");
          res.redirect("back");
        }
      });
    });

//=====================================Item's Edit Route======================================//
//EDIT ROUTE - GET HTTP Request - Edit The Item
router.get("/:id/edit", middleware.checkItemsOwnership, function(req,res){
    Item.findById(req.params.id, function(err, foundItem){                      //Find Item By Id
      if(err){
        req.flash("error", "Unable To Edit Item.");
        req.redirect("back");
      }else{
        res.render("items/edit", {item: foundItem});  
      }
    });
  });

//=====================================Item's Update Route======================================//
//UPDATE ROUTE - PUT HTTP Request - Update The Item
router.put("/:id", upload.single('image'), function(req, res){
req.body.item.blog = req.sanitize(req.body.item.blog);
    delete req.body.item.rating;                                                //Delete The Rating When The Item Is Update
    Item.findById(req.params.id, async function(err, item){                     //Find Item By Id
      if(err){
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        if (req.file) {
          try {
                  await cloudinary.v2.uploader.destroy(item.imageId);           //Destroy ImageId From Cloudinary
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  item.imageId = result.public_id;                              //Update New Public Id and Secure URL For New Item
                  item.image = result.secure_url;
                } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
                }
              }
              
            item.name = req.body.item.name;                                     //Update The Different Fields And Saving Into Database
            item.description = req.body.item.description;
            item.price = req.body.item.price;
            item.bookAuthor = req.body.item.bookAuthor;
            item.type = req.body.item.type;
            item.location = req.body.item.location;
            item.time = req.body.item.time;
            item.day = req.body.item.day;
            item.status = req.body.item.status;
            item.save();
            
            req.flash("success","Successfully Updated!");
            res.redirect("/items/" + item._id);
          }
        });
  });

//=====================================Item's Destroy Route======================================//
//DESTROY ROUTE - DELETE HTTP Request - Destroy The Item
router.delete('/:id', middleware.checkItemsOwnership, function (req, res) {
  Item.findById(req.params.id, async function (err, item) {                         //Find Item By Id
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      Comment.remove({"_id": {$in: item.comments}}, function (err) {                //Remove Comment By Id
        if (err) {
          req.flash("error", "Unable To Delete Comment.");
          return res.redirect("/items");
        }
        Review.remove({"_id": {$in: item.reviews}}, async function (err) {          //Remove Review By Id
          if (err) {
            req.flash("error", "Unable To Delete Review.");
            return res.redirect("/items");
          }
          try {
            await cloudinary.v2.uploader.destroy(item.imageId);                 //Need Try-Catch To Deal With Cloudinay And Musy Be Execute Last
            item.remove();
            req.flash('success', 'Item Deleted Successfully');
            res.redirect('/items');
          } catch (err) {
            if (err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
          }
        });
      });
    }
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;