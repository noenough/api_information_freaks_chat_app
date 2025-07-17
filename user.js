const mongoose  = require("mongoose");

const userchema=new mongoose.Schema({
name: {
type:String,
unique:true,
},
password: String,
})

module.exports=mongoose.model("User",userchema);