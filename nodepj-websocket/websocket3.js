const express = require("express");
const path = require("path");
const http = require("http");
const session = require("express-session");
const uuid = require("uuid");
const fs = require("fs");
const WebSocket = require("ws");
const { WSASERVICE_NOT_FOUND } = require("constants");

const app = express();
const sessionParser = session({
    saveUninitialized :false
    ,secret : "$eCuRiTy2"
    ,resave : false

})
const port = 3000;

app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));
app.use(sessionParser);

//user control
const ws_map = new Map();
const valid_user_map = new Map();
const curr_users = {};
//user control

//read file and setting valid user
const files = fs.readdirSync(path.join(__dirname + "/key")).filter( fn => fn.endsWith(".txt"));

files.forEach(function (file){
    const fileCont = fs.readFileSync(path.join(__dirname + "/key/" + file), "utf-8");
    const titles = fileCont.split("\n")[0];
    
    if(titles.split(",")[0].trim() === 'Id' && titles.split(',')[1].trim() === 'Password'){
        const rows = fileCont.split("\n");
        let idx = 0;

        for(const row of rows){
            if(idx != 0  && row){
                const id = row.split(",")[0].trim();
                const password = row.split(",")[1].trim();
                valid_user_map.set(id, password);
                console.log(`${id} : ${password}`);
            }

            idx += 1;

        }

    }else{
        console.log(`InvalidFiles! ${file}`);
    }

})
//read file and setting valid user

//http-server
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"))
})

app.post("/api/user/login", function(req, res){
    const {id, password} = req.body;

    //if valid user
    if(valid_user_map.has(id) && valid_user_map.get(id) == password && (!curr_users[id] || curr_users[id] == 0)){
        const uid = uuid.v4();
        console.log(`Updating Session for User ${id}`);

        req.session.userIdentity = uid;
        req.session.userid = id;
        curr_users[id] = 1;
        //respond
        res.send({
            permission : "200",
            msg : "Permission Granted"
        })
        console.log(`${id} is Permitted`)
        //if invalid user
    }else{
        //respond
        res.send({
            permission : "403",
            msg : "Permission Denied"

        })
        console.log(`${id} is denied`)
    }
})

app.delete("/api/user/logout", function(request, response){

})
const server = http.createServer(app);
//http-server
//webscoket
const websocket = new WebSocket.Server({
    clientTracking :true,
    noServer : true
})

server.on("upgrade", function(request, socket, head){
    console.log("Parsing Session From Request...");

    sessionParser(request, {}, () => {
        if(!request.session.userIdentity){
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        console.log("Session Is Parsed");

        websocket.handleUpgrade(request, socket, head, (wws) => {
            websocket.emit("connection", wws, request);
        })
    })
})

websocket.on("connection", function(wws, request){
    const userIdentity = request.session.userIdentity;
    const id = request.session.userid;
    console.log(request.session);
    ws_map.set(userIdentity, wws);

    wws.on("message", function(message){
        console.log(`Received Message ${message} from user ${userIdentity}`);
        try{
            Set.prototype.forEach.call(websocket.clients, (client) => {
                if(client.readyState === WebSocket.OPEN){
                    const ip = client._socket.remoteAddress;
                    client.send(JSON.stringify({
                        "msg" : message + ""
                        ,"key" : userIdentity
                        ,"id": id + ""
                    }))
                }
            })
        }catch(error ){
            console.log(error);
        }
    })

    wws.on("close", function(){
        ws_map.delete(userIdentity);
        delete curr_users[id];
    })

})

server.listen(3000, function(){
    console.log(`Server is listening from 192.168.1.14:3000`)
})
//websocket
