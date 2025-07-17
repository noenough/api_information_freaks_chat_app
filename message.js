const mongoose  = require("mongoose");

const messageShema=mongoose.Schema({
    from:String,
    to:String,
    message:String,
    timestamp: String,
})

module.exports=mongoose.model("message",messageShema);