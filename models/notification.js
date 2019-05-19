var mongoose = require("mongoose");

//======================================Database Schema For Notification======================================//

var notificationSchema = new mongoose.Schema({
	username: String,
	itemId: String,
	isRead: { type: Boolean, default: false }
});  

module.exports = mongoose.model("Notification", notificationSchema);