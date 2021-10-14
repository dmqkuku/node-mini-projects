const http = require("http");

const Chat = {
	data(){
		return {
			isAuthorized : false
			, id : ''
			, password : ''
			, serverMsg : ''
			, isPermissionDenied : false
			, chatlogs : []
			, chatInput : ''
			, wsStatus : ''
			, statusMsg : ''
		
		}
	},
	methods : {
		sendLoginReq(){
			const that = this;
			const id = that.id;
			const password = that.password;
			const param = {
				"id" : id,
				"password" : password
			}
			axios
			    .post("/api/user/login", param)
			    .then((response) => {
			    	const {permission, msg} = response.data
				if(permission === '200'){
					that.isPermissionDenied = false
					that.isAuthorized = true
					that.connectWs();
				}else{
					that.serverMsg = msg;
					that.isPermissionDenied = true
					that.isAuthorized = false
				}
			    
			    }).catch((error) => {
			    	console.log(error)
			    })
			
		},
		connectWs(){
			const that = this;
			that.socket = new WebSocket("ws://192.168.1.14:3000")
			that.socket.onopen = () => {
				that.wsStatus = '200'
				that.statusMsg = "Info : Connection Opened!"
			}
			that.socket.onmessage = function(event){
				console.log(event.data);
				const {id, msg, key} = JSON.parse(event.data);
				console.log(id, msg, key)
				if(!id || !msg || !key){
					alert("Invalid Data!")
					that.disconnectWs()
				}else{
					that.chatlogs.push({
						"id" : id, "msg" : msg, "key" : key
					})
				}
			}
			that.socket.onerror = function(event){
				console.log("error!")
				that.wsStatus = "0"
				that.statusMsg = "Error : Error is Occured during websocket"
			}
		},
		disconnectWs(){
			const that = this;
			that.socket.close()
			that.wsStatus = "0"
			that.statusMsg = "Info : Connection Closed"
		},
		sendChat(){
			const that = this;
			if(that.wsStatus == 200 && that.chatInput){
				that.socket.send(that.chatInput)
				that.chatInput = "";
			}
		}
	}

}
const app = Vue.createApp(Chat)

app.component("chat-item", {
	props : ["id", "msg", "key" ]
	,template : `<p>[{{id}}] : {{msg}}</p>`
})

app.mount("#vue-chat")
