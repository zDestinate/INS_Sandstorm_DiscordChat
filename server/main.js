//Load config
const config_data = require('../configs.json');

//Read sandstorm log
const SandstormLogReader = require('./lib/SandstormLogReader');

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
		console.log("[RCON][SERVER %d] Connected", i);
	}).on('response', function(str) {
		if(str)
		{
			console.log("[RCON][SERVER %d] Response: %s", i, str);
		}
	}).on('end', function() {
		console.log("[RCON][SERVER %d] Disconnected", i);
		setTimeout(() => {
			try
			{
				rconConnection[i].connect();
			}
			catch(err)
			{
			}
		}, 4000);
	}).on('error', function(err){
		setTimeout(() => {
			try
			{
				rconConnection[i].connect();
			}
			catch(err)
			{
			}
		}, 4000);
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
	
	let username = msg.author.username;
	let message = msg.content;
	
	//Filter out channel so only the channel from ChatChannel can send message to in game
	for(let i = 0; i < ChatChannel.length; i++)
	{
		if(msg.channel.name != ChatChannel[i]) continue;
		
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


//Using sandstorm log reader to keep track of the log
SandstormLog = new SandstormLogReader(LogFilePath, config_data.logreader.LineToReadPerCheck);

SandstormLog.on('message', ({index, PlayerName, SteamID, ChatType, Message}) => {
	let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[index]);
	if(ChatType.includes('Global'))
	{
		DiscordChannel.send(`**[${SteamID}] ${PlayerName} :** ${Message}`);
	}
	else if(ChatType.includes('Team'))
	{
		DiscordChannel.send(`**[${SteamID}] (TEAM) ${PlayerName} :** ${Message}`);
	}
	
	console.log('[SS-LOG][SERVER %d] %s : %s', index, PlayerName, Message);
});

SandstormLog.on('player_connected', ({index, PlayerName, SteamID, Platform}) => {
	let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[index]);
	DiscordChannel.send(`**[${SteamID}] ${PlayerName}** has connected to the game on **${Platform}** platform.`);
	
	console.log('[SS-LOG][SERVER %d] %s connected', index, PlayerName);
});

SandstormLog.on('player_disconnected', ({index, PlayerName, SteamID, Platform}) => {
	let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[index]);
	DiscordChannel.send(`**[${SteamID}] ${PlayerName}** has disconnected from the game on **${Platform}** platform.`);
	
	console.log('[SS-LOG][SERVER %d] %s disconnected', index, PlayerName);
});

SandstormLog.on('map_change', ({index, Map, Scenario}) => {
	let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[index]);
	DiscordChannel.send(`Map changed to **${Map}**`);
	
	console.log('[SS-LOG][SERVER %d] Map changed to %s %s', index, Map, Scenario);
});

SandstormLog.on('map_restart', ({index, Map, Scenario}) => {
	let DiscordChannel = bot.channels.cache.find(channel => channel.name === ChatChannel[index]);
	DiscordChannel.send(`Replay map **${Map}**`);
	
	console.log('[SS-LOG][SERVER %d] Replay map %s %s', index, Map, Scenario);
});


//Discord bot token (Require you to create your own discord bot in https://discordapp.com/developers/applications/ )
bot.login(config_data.discord.botToken).catch(console.error);

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