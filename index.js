const express = require('express')
const srvio = require('socket.io');
const http = require('http');
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('./user');
const Message = require("./message");
const { timeStamp } = require('console');
const port=3000;
const app=express()
app.use(cors());
app.use(express.json());

const usrmap=new Map();
const usrarray=[];
const secret=process.env.JWT_SECRET;
const mongouri=process.env.MONGO_URI;

const server = http.createServer(app);
const io=srvio(server,{
      cors: {
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"],
    },
}); 
    

mongoose.connect(mongouri).then(
()=>{

getmessages();

console.log("Connected Database");


io.on("connection",(socket)=>{

    socket.on("asak",()=>{

        socket.emit("asak","on");
    });


socket.on("register",(data)=>{
        io.to(socket.id).emit("all_connected",usrarray);
    if (usrmap.has(data)==false)
    usrmap.set(data,socket.id);
     usrarray.push(data);
     io.emit("user_connect",data);
        console.log(`${data} connected`);
})

socket.on("disconnect",()=>{
    for (const [name,id] of usrmap.entries()){
        if (id==socket.id)
        {
        usrmap.delete(name);
        let haysyindex=usrarray.indexOf(name);
        if (haysyindex!=-1)
        usrarray.splice(haysyindex,1);
        console.log(`${name} disconnected`)
        io.emit("user_disconnect",name);
        }
    }
})
socket.on("user_message",(data)=>{
console.log(usrmap);
   const newmessage=new Message({
    from:data.from,
    to:data.to,
    message:data.msg,
    timestamp:data.timestamp,
   });


   newmessage.save().then(() => {
    //from send message
        io.to(usrmap.get(data.from)).emit("receive_message",{
       from:data.from,
       to:data.to,
       message:data.msg,
       timestamp:data.timestamp,
       });
    //to send message
       io.to(usrmap.get(data.to)).emit("receive_message",{
       from:data.from,
       to:data.to,
       message:data.msg,
       timestamp:data.timestamp,
       });
    console.log("message saved");
});
})
});
//api's------------------------
app.post("/check-auth",(req,res)=>{
   const rc_token=req.headers.authorization?.split(" ")[1];
   try {
       const isverify=jwt.verify(rc_token,secret);
       res.json("Yes");
       console.log("Token success");
   } catch (error) {
    res.json("No");
    console.log("Token error");
   }
});



app.post("/users",(req,res)=>{
const name=req.body.name;
const pass=req.body.password;
const token=jwt.sign({name},secret);
const newperson=new User({name:name,password:pass});
newperson.save().then(()=>
{
getusers().then(()=>{
io.emit("current_users",newusers);
})

console.log(`Saved ${name}`);
res.send({token});

}).catch((e)=>console.log(`Error ${e}`));
});

app.get("/users",(req,res)=>{
getusers().then(()=>{
   res.json(newusers);
})
})

app.get("/messages",(req,res)=>{
    getmessages().then(()=>{
        res.json({f:from,t:to,m:messages,tm:timestamp});
    })
})


//-----------------------

})


server.listen(port);

let newusers=[];
async function getusers(){

    try {
        const pusers=await User.find();
     
        for (let i = 0; i < pusers.length; i++)
            newusers[i]=pusers[i].name;

    } catch (error) {
        console.log(`Error: ${error}`);
    }

}
let from=[];
let to=[];
let messages=[];
let timestamp=[];
async function getmessages() {
try {
    const msgs=await Message.find();
    for (let i = 0; i < msgs.length; i++) {
    {
    from[i]=msgs[i].from;
    to[i]=msgs[i].to;
    messages[i]=msgs[i].message;
      timestamp[i]=msgs[i].timestamp;
    }
        
    }
} catch (error) {
     console.log(`Error: ${error}`);
}
    
}