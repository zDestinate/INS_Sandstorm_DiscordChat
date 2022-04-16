# Sandstorm Log Reader

This is a class that I created to read the sandstorm log file using `fs`. Based on the data we get from the file, we will use observer pattern to emit specific information we want.<br><br><br>


- `player_connected` This will trigger when a new player is connected to the server
	- `index` The index of the log file because we watch multiple log files to support multiple severs
	- `PlayerName` The name of the new player that just connected to the server
	- `SteamID` SteamID64 of the new player that just connected to the server
	- `Platform` The platform they used to connected to the server (Steam, Xbox, PS5, etc...)
	- `TotalPlayers` Current total players including the new player

- `player_disconnected` A player that disconnected from the server
	- `index`
	- `PlayerName`
	- `SteamID`
	- `Platform`
	- `TotalPlayers` Current total players after the player disconnected
	
- `message` This will trigger when someone send a chat message
	- `index`
	- `PlayerName`
	- `SteamID`
	- `ChatType` The message type, whenever the message is a team message, global message, or spectator
	- `Message` The message that the player sent
	
- `map_restart` A map restart/replay
	- `index`
	- `Map` Map name
	- `Scenario` Scenario name
	
- `map_change` A new map that we changing to
	- `index`
	- `Map` New map name
	- `Scenario` New scenario name
	
- `state_change` Game state changed. Game state like game over, preround, pregame, etc...
	- `index`
	- `OldState` The previous state
	- `NewState` The new state that we just changed to