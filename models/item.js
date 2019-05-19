var mongoose = require("mongoose");
//======================================Database Schema For Items======================================//
var itemSchema = new mongoose.Schema({
    name:   String,
    price:  String,
    image:  String,
    imageId: String,
    description: String,
    type: String,
    status: String,
    location: String,
    time: String,
    day: String,
    bookAuthor: String,
    createdAt: { type: Date, default: Date.now},
    author: {                                               //Reference The Author From The User Schema
        id: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [                                             //Reference The Comments From The Comment Schema
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }
    ],
    reviews: [
    {
            type: mongoose.Schema.Types.ObjectId,           //Reference The Reviews From The Review Schema
            ref: "Review"
        }
        ],
        rating: {                                               
            type: Number,
            default: 0
        }
    });

module.exports = mongoose.model("Item", itemSchema);