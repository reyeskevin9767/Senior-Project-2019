var express = require("express");
var router  = express.Router({mergeParams: true});
var Item    = require("../models/item");
var Comment = require("../models/comment");
var middleware = require("../middleware");


//======================================Commments Routes======================================//

//======================================Commment's Show Route======================================//
//SHOW ROUTE - GET HTTP Request - Show The New Comment Form
router.get("/new", middleware.isLoggedIn, function(req,res){
    Item.findById(req.params.id, function(err,item){                    //Found The Item By Id
        if(err){
            req.flash("error", "Unable To Show Comment Form");
        } else{
            res.render("comments/new", {item: item});
        }
    });
});

//======================================Commment's Create Route======================================//
//CREATE ROUTE -POST HTTP Request - Show The New Comment Form
router.post("/", middleware.isLoggedIn, function(req, res){
    req.body.comment.blog = req.sanitize(req.body.comment.blog);
    Item.findById(req.params.id, function(err, item) {                      //Found The Item By Id
        if(err){
            req.flash("error", "Comment Was Not Successfully Added");
            res.redirect("back");
        } else {
             Comment.create(req.body.comment, function(err, comment){       //Create The Comment
               if(err){
                  req.flash("error", "Comment Was Not Successfully Added");
              } else {
                     comment.author.id = req.user._id;                      //Add Username And Id To Comment
                     comment.author.username = req.user.username;
                     comment.save();                                        //Save The Comment
                     item.comments.push(comment);                           //Push The Comments Into Item
                     item.save();                                           //Save Item
                     
                     req.flash("success", "Comment Added Successfully");
                     res.redirect('/items/' + item._id);
                 }
             });
         }
     });
});

//======================================Commment's Edit Route======================================//
//EDIT ROUTE - GET HTTP Request - Show Edit Form
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req,res){
    Comment.findById(req.params.comment_id, function(err,foundComment){                 //Found The Comment By Id
        if(err){
            req.flash("error", "Unable To Edit Comment");
            res.redirect("back");    
        } else{
            res.render("comments/edit", {item_id: req.params.id, comment: foundComment});
        }
    });
});


//======================================Commment's Update Route======================================//
//UPDATE ROUTE - PUT HTTP Request - Update Comment With New Information
router.put("/:comment_id", middleware.checkCommentOwnership, function(req,res){
    req.body.comment.blog = req.sanitize(req.body.comment.blog);
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updateComment){    //Found & Update The Comment By
     if(err){
        req.flash("error", "Unable To Update Comment");
        res.redirect("back");
    } else{
     res.redirect("/items/" + req.params.id );
 }
});
});

//======================================Commment's Destroy Route======================================//
//DESTROY ROUTE - DELETE HTTP Request - Delete Comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req,res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){                                     //Found & Remove The Comment By Id
     if(err){
         req.flash("error", "Unable To Delete Comment");
         res.redirect("back");
     } else{
         req.flash("success", "The Comment Has Been Deleted");
         res.redirect("/items/" + req.params.id);
     }
 });
});

module.exports = router;

