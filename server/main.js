//Load config
const config_data = require('../configs.json');

//Get last line
const fs = require('fs');
const readLastLines = require('read-last-lines');

//Discord
const Discord = require("discord.js");
var bot = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MEMBERS
	]
});

//Rcon
const Rcon = require("rcon");
var rconConnection = [];

//Chat channel list
var ChatChannel = [];

//Sandstorm log file path
var LogFilePath = [];


console.log("[SERVER] Server started");

//All sandstorm rcon servers
for(let i = 0; i < config_data.servers.length; i++)
{
	var rconTemp = new Rcon(config_data.servers[i].RconIP, config_data.servers[i].RconPort, config_data.servers[i].RconPassword);
	rconConnection.push(rconTemp);
	ChatChannel.push(config_data.servers[i].ChatChannel);
	LogFilePath.push(config_data.servers[i].LogFilePath);
	
	//Rcon
	rconConnection[i].on('auth', function() {
		console.log("[RCON][SERVER %d] Authed!", i);
	}).on('response', function(str) {
		if(str)
		{
			console.log("[RCON][SERVER %d] Response: %s", i, str);
		}
	}).on('end', function() {
		console.log("[RCON][SERVER %d] Socket closed!", i);
	}).on('error', function(err){
		try
		{
			rconConnection[i].connect();
		}
		catch(err)
		{
		}
	});
	
	//Establish rcon connection
	try
	{
		rconConnection[i].connect();
	}
	catch(err)
	{
		console.log("[RCON][SERVER %d] %s", i, err);
	}
}


//Discord bot events
bot.on('error', (e) => {
	console.log('[SS-DISCORD][ERROR] %s', e);
});

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
bot.on("messageCreate", msg => {
	if(msg.author.bot) return;
	
	//Filter out channel so only the channel from ChatChannel can send message to in game
	for(let i = 0; i < ChatChannel.length; i++)
	{
		if(msg.channel.name != ChatChannel[i]) continue;
		
		let username = msg.author.username;
		let message = msg.content;
		
		//Filter out ```
		if(message.indexOf("```") !== -1)
		{
			const send_message = 'An Error Occur```Unable to send that message```';
			msg.channel.send(send_message);
			continue;
		}
		
		//Send an rcon message to game
		rconConnection[i].send('say _DiscordTag_' + username + ' : ' + message);
		
		console.log('[SS-DISCORD][SERVER %d] %s : %s', i, username, message);
	}
});

//Log the file every time the file change to get the message in game and put it in the discord
var TempLastLine = [];
for(let i = 0; i < LogFilePath.length; i++)
{
	fs.watch(LogFilePath[i], { encoding: 'buffer' }, (eventType, filename) => {
		if (eventType == 'change') {
			readLastLines.read(LogFilePath[i], 1)
			.then((lines) => {
				if(TempLastLine[i] == undefined)
				{
					TempLastLine.push("");
				}
				
				if((TempLastLine[i] != lines) && (lines.includes("]LogChat: Display: ")))
				{
					lines = lines.replace(/\n|\r/g, "");
					TempLastLine[i] = lines;
					lines = lines.substring(lines.indexOf("]LogChat: Display: ") + 19, lines.length);
					let chatmessage = lines.substring(lines.indexOf("Chat: ") + 6, lines.length);
					lines = lines.substring(0, lines.indexOf("Chat: "))
					
					let steamID;
					
					let TempLine = lines;
					while(true)
					{
						let startOfID = TempLine.indexOf("(") + 1;
						let EndOfID = TempLine.lastIndexOf(")");
						steamID = TempLine.substring(startOfID, EndOfID);
						
						if(/^\d+$/.test(steamID))
						{
							break;
						}
						TempLine = TempLine.substring(startOfID, EndOfID+1);
					}
					
					let PlayerName = lines.substring(0, lines.indexOf(steamID)-1);
					let ChatType = lines.substring(lines.indexOf(steamID) + steamID.length + 1, lines.length);
					
					let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[i]);
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
	});
}

//Discord bot token (Require you to create your own discord bot in https://discordapp.com/developers/applications/ )
bot.login(config_data.discord.botToken);

function exitHandler(options, exitCode)
{
	bot.destroy();
	
    if (options.exit) process.exit();
}

//Do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));