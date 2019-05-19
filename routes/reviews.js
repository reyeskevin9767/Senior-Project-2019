var express = require("express");
var router = express.Router({mergeParams: true});
var Item = require("../models/item");
var Review = require("../models/reviews");
var middleware = require("../middleware");

//=====================================Review's Index Route======================================//
//INDEX ROUTE - GET HTTP Request - Show All The Reviews
router.get("/", function (req, res) {
    Item.findById(req.params.id).populate({                 //FInd Item By Id And Populate With Reviews
        path: "reviews",
        options: {sort: {createdAt: -1}}                    //Sort By The Latest Entry
    }).exec(function (err, item) {
        if (err || !item) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {item: item});
    });
});

//=====================================Review's New Route======================================//
//NEW ROUTE - GET HTTP Request - Show The New Form For Reviews
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {    //CheckReviewExistence Used To Check If User Already Reviewed An Item
    Item.findById(req.params.id, function (err, item) {                         //Find Item By Id
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {item: item});
    });
});

//=====================================Review's Create Route======================================//
//CREATE ROUTE - GET HTTP Request - Show The New Form For Reviews
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {      //CheckReviewExistence Used To Check If User Already Reviewed An Item
req.body.review.blog = req.sanitize(req.body.review.blog);
    Item.findById(req.params.id).populate("reviews").exec(function (err, item) {        //Find Item By ID And Populate With Reviews
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {                         //Create The Reviews
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated item to the review
            review.author.id = req.user._id;                                            //Add Author,Username, and Item To Review
            review.author.username = req.user.username;
            review.item = item;
            review.save();                                                              //Save Review
            
            item.reviews.push(review);                                                  //Push Review To Item
            item.rating = calculateAverage(item.reviews);                               //Caculate The New Average
            item.save();                                                                //Save Item
            
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/items/' + item._id);
        });
    });
});

//=====================================Review's Edit Route======================================//
//EDIT ROUTE - GET HTTP Request - Edit The Review
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {                 //Find Review By Id
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {item_id: req.params.id, review: foundReview});
    });
});

//=====================================Review's Update Route======================================//
//UPDATE ROUTE - PUT HTTP Request - Update The Review
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
req.body.review.blog = req.sanitize(req.body.review.blog);
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {    //Find Review By Id and Update
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Item.findById(req.params.id).populate("reviews").exec(function (err, item) {        //Find Item By Id and Populate By Reviews
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            
            item.rating = calculateAverage(item.reviews);                                   //Recalculate Item Review Average
            item.save();                                                                    //Save Item
            
            req.flash("success", "Your Review Was Successfully Edited.");
            res.redirect('/items/' + item._id);
        });
    });
});

//=====================================Review's Destroy Route======================================//
//DESTROY ROUTE - DELETE HTTP Request - Delete The Review
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {                     //Find Review By Id And Review
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        //Find Item By Id And Update, Pull Reviews Out By Id From The Populate Reviews
        Item.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, item) {    //
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }

            item.rating = calculateAverage(item.reviews);                   //Recalculate The Item Average
            item.save();                                                    //Save Item
            
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/items/" + req.params.id);
        });
    });
});


//=====================================Calculate Average======================================//
function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;