# Insurgency Sandstorm DiscordChat
This let your discord bot send message to your insurgency sandstorm in game chat.<br>
You have to use this with [Advanced Chat](https://insurgencysandstorm.mod.io/advanced-chat) mod<br><br>

### How does it work?

The discord bot will automatic read your sandstorm log and get the chat log part and put it in your discord.<br>
The bot will also be using rcon to send the message to the game server. Everytime you type something in your discord chat, it will grab the chat message and rcon it to your sandstorm server.<br><br><br>



### Installation and Configuration

You must have this in your `Engine.ini` file in your sandstorm to have the log output the chat.

```
[Core.Log]
LogGameplayEvents=Log
LogNet=Log
LogObjectives=Log
LogGameMode=Log
```

Your sandstorm server startup must have this parameter `-LogCmds="LogGameplayEvents Log"`<br><br>

To use this bot, you must install [nodejs and npm](https://nodejs.org/en/download/) on your server. You can try and test it on your computer but don't recommend because your bot will need to run 24/7. The moment you close your bot, users on discord won't able to send any chat message to in-game or receive any message.<br><br>

You will need to `npm install` in the main directory where your `configs.json` is locate to install the require lib for this discord bot.<br>
Make sure you edit your [configs.json](https://github.com/zWolfi/INS_Sandstorm_DiscordChat/blob/master/configs.json) file and put in your server rcon IP, port, password, your bot token, and your sandstorm log file path.<br>
Make sure you have the right text channel of your discord server and the log file path exist. Otherwise, you will get an error.<br><br>

After all that, all you have to do is to run the main.js by doing `npm start` in the main directory or `node main.js` where your main.js file is locate. Don't forget that you will have to invite your bot to your discord server. Bot will show up in your discord server and you will have to give the permission to the bot strictly. Otherwise the bot will send all the messages from all the text channel to in game chat.<br><br><br>


### Discord Bot Configuration

Make sure your discord bot has all intents enabled if you are getting intents error.<br><br>
![image](https://user-images.githubusercontent.com/1011211/179432565-0a17f4a2-0455-4c40-b3ee-c0da39e3ec8b.png)
<br><br><br>



### Multiple Server Configuration

To add another server, all you need to do is add another object in the `servers` property of the `configs.json` file. You must configurate the rcon, chat channel, and the file path for that server too. You can have as many server as you want.<br><br>
**Example:**<br>
```json
{
	"logreader": {
		"LineToReadPerCheck": 40
	},
	"discord": {
		"botToken": "your discord bot token from https://discordapp.com/developers/applications/ "
	},
	"servers": [{
			"RconIP": "127.0.0.1",
			"RconPort": 27015,
			"RconPassword": "your password here",
			"LogFilePath": "/var/sandstorm/Insurgency/Saved/Logs/Insurgency.log",
			"ChatChannel": "ss-ingame-chat"
		},
		{
			"RconIP": "127.0.0.1",
			"RconPort": 28015,
			"RconPassword": "your password here",
			"LogFilePath": "/var/sandstorm2/Insurgency/Saved/Logs/Insurgency.log",
			"ChatChannel": "ss-ingame-chat2"
		}
	]
}
```
