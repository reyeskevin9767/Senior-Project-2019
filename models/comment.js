var mongoose = require("mongoose");

//======================================Database Schema For Comments======================================//

var commentSchema = mongoose.Schema({
    text: String,                                               //Comment Itself                                       
    createdAt: { type: Date, default: Date.now},                //When The Comment Was Created                     
    author: {                                                   //Reference The Author From The User Schema
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Comment", commentSchema);