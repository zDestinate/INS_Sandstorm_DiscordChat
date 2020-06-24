//Load config
var config_data = require('../configs.json')

//Get last line
const fs = require('fs');
const readLastLines = require('read-last-lines');

//Discord
var Discord = require("discord.js");
var bot = new Discord.Client();

//Rcon
var Rcon = require("rcon");
var rconConnection = new Rcon(config_data.RconIP, config_data.RconPort, config_data.RconPassword);

//Set your in game chat channel name here
var ChatChannel = config_data.discord.ChatChannel;

//Your insurgency log path file
var LogFilePath = config_data.LogFilePath;


console.log("[SERVER] Server started");

//Rcon
rconConnection.on('auth', function() {
	console.log("[RCON] Authed!");
}).on('response', function(str) {
	console.log("[RCON] Response: " + str);
}).on('end', function() {
	console.log("[RCON] Socket closed!");
}).on('error', function(err){
	try
	{
		rconConnection.connect();
	}
	catch(err)
	{
	}
});

//Establish rcon connection
try
{
	rconConnection.connect();
}
catch(err)
{
	console.log(err);
}


//Discord bot events
//Bot connected to discord and its ready
bot.on('ready', () => {
	console.log('[SS-DISCORD] Successfully Loaded');
	bot.user.setActivity('Insurgency: Sandstorm', { type: 'PLAYING' });
});

//Bot reconnecting
bot.on('reconnecting', () => {
	console.log('[SS-DISCORD] Reconnecting');
});

//When a user on discord send a message
bot.on("message", msg => {
	if(msg.author.bot) return;
	
	//Filter out channel so only the channel from ChatChannel can send message to in game
	if(msg.channel.name != ChatChannel) return;
	
	var username = msg.author.username;
	var message = msg.content;
	
	//Filter out ```
	if(message.indexOf("```") !== -1)
	{
		const send_message = 'An Error Occur```Unable to send that message```';
		msg.channel.send(send_message);
		return;
	}
	
	//Send an rcon message to game
	rconConnection.send('say _DiscordTag_' + username + ' : ' + message);
	
	console.log('[SS-DISCORD] ' + username + ' : ' + message)
});

//Log the file every time the file change to get the message in game and put it in the discord
var TempLastLine;
fs.watch(LogFilePath, { encoding: 'buffer' }, (eventType, filename) => {
	if (eventType == 'change') {
		readLastLines.read(LogFilePath, 1)
		.then((lines) => {
			if((TempLastLine != lines) && (lines.includes("]LogChat: Display: ")))
			{
				lines = lines.replace(/\n|\r/g, "");
				TempLastLine = lines;
				lines = lines.substring(lines.indexOf("]LogChat: Display: ") + 19, lines.length);
				var chatmessage = lines.substring(lines.indexOf("Chat: ") + 6, lines.length);
				lines = lines.substring(0, lines.indexOf("Chat: "))
				
				var steamID;
				
				var TempLine = lines;
				while(true)
				{
					var startOfID = TempLine.indexOf("(") + 1;
					var EndOfID = TempLine.lastIndexOf(")");
					steamID = TempLine.substring(startOfID, EndOfID);
					
					if(/^\d+$/.test(steamID))
					{
						break;
					}
					TempLine = TempLine.substring(startOfID, EndOfID+1);
				}
				
				var PlayerName = lines.substring(0, lines.indexOf(steamID)-1);
				var ChatType = lines.substring(lines.indexOf(steamID) + steamID.length + 1, lines.length);
				
				var DiscordChannel = bot.channels.find(channel => channel.name === ChatChannel);
				if(ChatType.includes('Global'))
				{
					DiscordChannel.send("**[" + steamID + "] " + PlayerName + " :** " + chatmessage);
				}
				else if(ChatType.includes('Team'))
				{
					DiscordChannel.send("**[" + steamID + "] (TEAM) " + PlayerName + " :** " + chatmessage);
				}
			}
		}).catch((error) => {
			console.log(error);
		});
	}
})

//Discord bot token (Require you to create your own discord bot in https://discordapp.com/developers/applications/ )
bot.login(config_data.discord.botToken);