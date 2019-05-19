var Item = require("../models/item");
var Comment = require("../models/comment");
var Review = require("../models/reviews");

var middlewareObj = {};


//======================================Middleware For Items Ownership======================================//

middlewareObj.checkItemsOwnership = function(req, res, next) {              //Checking The Items Ownership
    if(req.isAuthenticated()){                                             //Check If User Has An Account
        Item.findById(req.params.id, function(err, foundItem){          
            if(err){
                req.flash("error", "Item Not Found");
                res.redirct("back");
            } else {
            if(foundItem.author.id.equals(req.user._id) || req.user.isAdmin){   //Check If The Item Belongs To The Owner Or Admin
                next();  
            }else {
                req.flash("error", "Access Denied");
                res.redirect("back");
            }
        }
    });
    } else {
        req.flash("error", "Please Login to Have Access");
        res.redirect("back");
    }
};

//======================================Middleware For Comment Ownership======================================//

middlewareObj.checkCommentOwnership = function(req, res, next) {                        
     if(req.isAuthenticated()){                                                          //Check If User Has An Account
            Comment.findById(req.params.comment_id, function(err, foundComment){        //Checking The Comments Ownership
                if(err){
                    res.redirct("back");
                } else {
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){        //Check If The Comment Belongs To The Owner Or Admin
              next();  
          }else {
            req.flash("error", "Permission Denied");
            res.redirect("back");
        }
        
    }
});
        } else {
            req.flash("error", "Please Login to Have Access");
            res.redirect("back");
        }
    };

//======================================Middleware For Review Ownership======================================//

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){                                                          //Check If User Has An Account
        Review.findById(req.params.review_id, function(err, foundReview){               //Checking The Comments Ownership
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {    //Check If The Review Belongs To The Owner Or Admin
                    next();
                } else {
                    req.flash("error", "Permission Denied");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Please Login to Have Access");
        res.redirect("back");
    }
};

//======================================Middleware For Review Existence======================================//

middlewareObj.checkReviewExistence = function (req, res, next) {                            //Check If User Has An Account
    if (req.isAuthenticated()) {
        Item.findById(req.params.id).populate("reviews").exec(function (err, foundItem) {   //Found Existing Reviews
            if (err || !foundItem) {
                req.flash("error", "Item not found.");
                res.redirect("back");
            } else {
                var foundUserReview = foundItem.reviews.some(function (review) {            //Check If The User Id Exists In The Reviews
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You Already Wrote A Review For Item.");
                    return res.redirect("/item/" + foundItem._id);
                }
                // if the review was not found, go to the next middleware
                next();                                                                     //Go To Next Middleware
            }
        });
    } else {
        req.flash("error", "Please Login to Have Access");
        res.redirect("back");
    }
};

//======================================Middleware For Check User State======================================//

middlewareObj.isLoggedIn = function(req, res, next){                                    //Check If User Is Currently Log On   
    if(req.isAuthenticated() && req.user.isStudent){                                                          //Check If User Has An Account
        return next();
    }
    req.flash("error", "Please Login To Have Access Or Email Team For Full Access To Features");
    res.redirect("/login");
};

module.exports = middlewareObj;