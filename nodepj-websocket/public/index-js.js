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
			, currUsers : []
			, currUserCount : 0
		
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
			    	const {permission, msg, currUsers} = response.data
				if(permission === '200'){
					that.isPermissionDenied = false
					that.isAuthorized = true
					that.connectWs();
					//displaying curr Users
					that.currUserCount = that.currUsers.length;
					for(const key in currUsers){
						if(!that.currUsers.includes(key)){
							that.currUsers.push(key)
							that.currUserCount += 1
						}
					}
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
				const {id, msg, key, currUsers} = JSON.parse(event.data);
				console.log(id, msg, key)
				if(!id || !msg || !key){
					alert("Invalid Data!")
					that.disconnectWs()
				}else{
					const isMine = id === that.id;
					const isNotMine = id !== that.id
					that.chatlogs.push({
						"id" : id, "msg" : msg, "key" : key, "isMine" : isMine, "isNotMine" : isNotMine
					})
					//displaying curr Users
					that.currUserCount = that.currUsers.length;
					for(const key in currUsers){
						if(!that.currUsers.includes(key)){
							that.currUsers.push(key)
							that.currUserCount += 1;
						}
					}
					that.autoScroll()
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
		},
		autoScroll(){
			this.$nextTick(() => {
				const chatLength = this.chatlogs.length;
				this.$el.querySelector("#chatBox").scrollTo({behavior : "smooth", top : chatLength * 50})
			})
		}
	}

}
const app = Vue.createApp(Chat)

app.component("chat-item", {
	props : ["id", "msg", "key" ]
	,template : `<div><p>[{{id}}] : {{msg}}</p></div>`
})

app.mount("#vue-chat")

