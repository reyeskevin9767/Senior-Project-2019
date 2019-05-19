var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var bcrypt = require("bcrypt-nodejs");

//======================================Database Schema For Users======================================//

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    image: String,
    imageId: String,
    firstname: String,
    lastname: String,
    gender: {type: String, default: "Other"},
    university: {type: String, default: "TAMUK"},
    year: {type: String, default: "Freshman"},
    profession: {type: String, default: "Student"},
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false},
    isStudent : {type: Boolean, default: false},
    notifications: [                                        //Reference The Notifications From The Notification Schema
    {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Notification'
 }
 ],
    followers: [                                            //Reference The User From The User Schema
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);