var mongoose = require("mongoose");

//======================================Database Schema For Reviews======================================//

var reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: "Please provide a rating (1-5 stars).",           //Making The Star Rating Required
        min: 1,
        max: 5,
        validate: {                                                 //Adding Validation To See If The Entry Is An Integer
            validator: Number.isInteger,                            
            message: "{VALUE} is not an integer value."
        }
    },
    text: {                                                         
        type: String                                                
    },
    author: {                                                       //Reference The Author From The User Schema
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    item: {                                                         //Reference The Item From The Item Schema
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }
}, {
    timestamps: true                                                //If Timestamps Are Set To True, Mongoose Assigns createdAt and updatedAT fields To
});                                                                 //createdAt and updatedAT fields To Schema

module.exports = mongoose.model("Review", reviewSchema);