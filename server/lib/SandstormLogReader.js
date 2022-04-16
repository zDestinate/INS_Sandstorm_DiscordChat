/*
	Created by Destinate
	
	Sandstorm Log Reader is a class to read data from the file.
	It will emit specific data on file change.
*/
const EventEmitter = require('events');
const fs = require('fs');
const readLastLines = require('read-last-lines');

class SandstormLogReader extends EventEmitter
{
	#TempLastLineChat;
	#Players;
	#CurrentMap;
	
	constructor(LogFilePath)
	{
		super();
		
		this.#TempLastLineChat = [];
		this.#Players = [];
		this.#CurrentMap = [];
		
		for(let i = 0; i < LogFilePath.length; i++)
		{
			fs.watch(LogFilePath[i], { encoding: 'buffer' }, (eventType, filename) =>{
				if(eventType == 'change')
				{
					readLastLines.read(LogFilePath[i], 40).then((lines) => {
						if(this.#TempLastLineChat[i] == undefined)
						{
							this.#TempLastLineChat[i] = [];
						}
						
						if(this.#Players[i] == undefined)
						{
							this.#Players[i] = [];
						}
						
						if(this.#CurrentMap[i] == undefined)
						{
							this.#CurrentMap[i] = {};
						}
						
						let TempLine = lines.split(/\r?\n/);
						
						for(const line of TempLine)
						{
							if(this.#TempLastLineChat[i].includes(line))
							{
								continue;
							}
							
							if(line.includes(']LogNet: Login request: '))
							{
								let regExp = /\]LogNet: Login request: (.*)/i;
								let LineInfo = line.match(regExp);
								
								if(LineInfo && (LineInfo.length > 1))
								{
									regExp = /\?Name=(.*) userId: SteamNWI:(.*) platform: (.*)/i;
									let PlayerData = LineInfo[1].match(regExp);
									let PlayerName = PlayerData[1];
									let SteamID = PlayerData[2];
									let Platform = PlayerData[3];
									
									let obj = {};
									obj['name'] = PlayerName;
									obj['steamid'] = SteamID;
									obj['platform'] = Platform;
									
									let bNewPlayer = true;
									for(let j = 0; j < this.#Players[i].length; j++)
									{
										console.log(this.#Players[i][j].steamid);
										
										if(this.#Players[i][j].steamid == SteamID)
										{
											bNewPlayer = false;
											break;
										}
									}
									
									if(bNewPlayer)
									{
										this.#Players[i].push(obj);
										this.emit('player_connected', {index: i, PlayerName, SteamID, Platform, TotalPlayers: this.#Players[i].length});
									}						
								}
							}
							else if(line.includes(']LogNet: UChannel::CleanUp:'))
							{
								let regExp = /UniqueId: SteamNWI:(.*)/i;
								let SteamID = line.match(regExp);
								
								for(let j = 0; j < this.#Players[i].length; j++)
								{
									if(this.#Players[i][j].steamid == SteamID[1])
									{
										let PlayerName = this.#Players[i][j].name;
										let Platform = this.#Players[i][j].platform;
										this.emit('player_disconnected', {index: i, PlayerName, SteamID: SteamID[1], Platform, TotalPlayers: this.#Players[i].length - 1});
										
										this.#Players[i].splice(j, 1);
										break;
									}
								}
							}
							else if(line.includes(']LogChat: Display: '))
							{
								let regExp = /\]LogChat: Display: (.*)/i;
								let LineInfo = line.match(regExp);

								if(LineInfo && (LineInfo.length > 1))
								{
									regExp = /(.*)\((.*)\) /i;
									let PlayerData = LineInfo[1].match(regExp);
									let PlayerName = PlayerData[1];
									let SteamID = PlayerData[2];
									
									regExp = /\) (.*) Chat: (.*)/i;
									let ChatData = LineInfo[1].match(regExp);
									let ChatType = ChatData[1];
									let Message = ChatData[2];
									
									this.emit('message', {index: i, PlayerName, SteamID, ChatType, Message});
								}
							}
							else if(line.includes(']LogGameMode: ProcessServerTravel'))
							{
								let regExp = /\]LogGameMode: ProcessServerTravel: (.*)/i;
								let LineInfo = line.match(regExp);

								if(LineInfo && (LineInfo.length > 1))
								{
									if(LineInfo[1].includes('?restart'))
									{
										if(this.#CurrentMap[i])
										{
											this.emit('map_restart', {index: i, Map: this.#CurrentMap[i].map, Scenario: this.#CurrentMap[i].scenario});
										}
									}
									else
									{
										regExp = /(.*)\?Scenario=([^?]*)\?*/i;
										let MapData = LineInfo[1].match(regExp);
										let Map = MapData[1];
										let Scenario = MapData[2];
										
										this.emit('map_change', {index: i, Map, Scenario});
										
										this.#CurrentMap[i]['map'] = Map;
										this.#CurrentMap[i]['scenario'] = Scenario;
									}
								}
							}
							else if(line.includes("]LogGameMode: Display: State: "))
							{
								let regExp = /\]LogGameMode: Display: State: (.*)/i;
								let LineInfo = line.match(regExp);

								if(LineInfo && (LineInfo.length > 1))
								{
									regExp = /(.*) -> (.*)/i;
									let StateData = LineInfo[1].match(regExp);
									let OldState = StateData[1];
									let NewState = StateData[2];
									
									this.emit('state_change', {index: i, OldState, NewState});
								}
							}
							
							this.#TempLastLineChat[i].push(line);
						}
						
						this.#TempLastLineChat[i] = TempLine;
						
					}).catch((error) => {
						console.log(error);
					});
				}
			});
		}
	}
}

module.exports = SandstormLogReader;