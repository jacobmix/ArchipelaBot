# ArchipelaBot
A Discord bot designed to provide Archipelago-specific functionality.

## Current Features
- Connect to a running Archipelago server as a spectator and print messages to a Discord channel
- Messages use colored text where different items types get different colors
- Works for sync & async games

# Self-Hosting

## Prerequisites
- `node` and `npm` should be installed to run the bot and install dependencies

## Configuration
A `config.json` file is required to be present in the base directory of the repository. This file should contain
your Discord bot's secret key.

Optionally, you can provide server connection info that will be used if not provided through the Discord 
ap-conenct command arguments.

Example config:
```json
{
  "token": "discord-bot-token",
  "clientId": "application-client-id",

  // Can be used to specify AP server info so you don't have to provide arguments to the ap-connect command.
  "serverAddress": "127.0.0.1",
  "port": "12345",
  "slotName": "slotname",
  "password": "secret"
}
```

If you intend to create your own bot on Discord using the code in this repository, your bot will need
permissions granted by the permissions integer `274878032960`.

The following permissions will be granted
to ArchipelaBot:
- View Channels
- Send Messages
- Send Messages in Threads
- Manage Messages
- Embed Links
- Attach Files
- Add Reactions
- Read Message History

## Setup
```shell script
# Clone the repo
git clone https://github.com/evilwb/ArchipelaBot.git

# Enter its directory
cd ArchipelaBot

# Install required packages
npm install

# Set up your config.json file
vim config.json

# Run the bot
node bot.js
```

# Archipelago Setup

## Overview

Here’s the pin I use on my server for Archipelago:
> - IP/DDnS & Port: __IP_HERE:38281 (No Passwords)__
>   - ``/connect IP_HERE:38281``
> - Clique: http://clique.pharware.com (Make sure it's not HTTPS. **HTTP ONLY!** NO ***S***! May need to paste link into incognito)
> - Install latest: <https://github.com/ArchipelagoMW/Archipelago/releases> 
>   - For clients, and game support. (You mostly need to run the game THEN client or only the client. But when you connect can be different)
>   - Most games will prompt for name, and password after putting in IP and Port. (Press ENTER. Don't use the ``Command:`` button)
>   - Else connect with: ``<SLOT_NAME>:<PASSWORD_OR_None>@<SERVER_IP>:<SERVER_PORT>`` or ``/connect <SERVER_IP>:<SERVER_PORT> <SLOT_NAME> password:<PASSWORD>``
> - Archipelago Discords:
>   - Archipelago: https://discord.gg/8Z65BR2
>   - Archipelago Manual: https://discord.gg/T5bcsVHByx
>   - Archipelago Mature: https://discord.gg/Sbhy4ykUKn
> - News, and APWorlds: https://multiworld.news/index.html | <https://multiworld.news/apworlds.html>
> - AP log/chat overlay for OBS: <https://github.com/LegendaryLinux/APSpectator> Use: [FIX](https://github.com/jacobmix/APSpectator/tree/wss) (CSS setup [below](https://github.com/jacobmix/ArchipelaBot/tree/master?tab=readme-ov-file#overlay-setup))
> - Site:
>   - Home: <https://archipelago.gg/>
>   - Sitemap: <https://archipelago.gg/sitemap>
> - Official Games: <https://archipelago.gg/games>
>   - Check the game's Setup Guide webpage or Discord channel for how to setup game, tacker/mod/ect.
> - Detailed & Weighted options yaml: <https://archipelago.gg/weighted-options>
>   - Make a Yaml from here, export, and send to host. They need it placed here: ``C:\ProgramData\Archipelago\Players`` (Pick just one game or what you play is random)
>   - You can combine games/yamls with ``---`` just use different ``name``. (There's more advanced options explained below)
>   - Note: If using a custom/non-official APWorld you need the same .apworld files as host used to generate.
>   - Click on an .apworld file to install it to ``C:\ProgramData\Archipelago\custom_worlds`` if it fails move to ``C:\ProgramData\Archipelago\lib\worlds`` instead. (Remove duplicates)
>   - It's also important to have the proper rom/host.yaml setting/ect in root.
>   - Above is also needed to generate yaml with "Generate Template Options" you can then edit. Also check Discord for the right corresponding mod/ect files.
> - Advanced yaml options: <https://archipelago.gg/tutorial/Archipelago/advanced_settings/en>
> - Planning settings (force item/locations): <https://archipelago.gg/tutorial/Archipelago/plando/en>
> - If statements for option if seed rolls in certain ways: <https://archipelago.gg/tutorial/Archipelago/triggers/en>
> - Check yaml for errors here: <https://archipelago.gg/check>
>   - Don't use Tab indents. Use two normal spaces. Also try using "quotation marks" around stuff that isn't plain numbers or true/false.

## player, and host YAML settings

Adding a Clique world to your yaml example (Note: Slot name can only be up to 16 characters):  
```
requires:
  version: 0.4.6 # Version of Archipelago required for this yaml to work as expected.
  plando: items

Teraria:
  ...OTHER SETTINGS HERE
  plando_items: 
    - items: 
        "Hardmode": 1
      world: 
        - xXxPlayerSlayer25xXx_button
      locations: 
        - "The Big Red Button"
      force: true
description: "Generated by https://archipelago.gg."
game: Terraria
name: xXxPlayerSlayer25xXx

---

Clique:
  hard_mode: true
description: "Generated by https://archipelago.gg."
game: Clique
name: xXxPlayerSlayer25xXx_button
```  
Note: Host needs ``plando_options: "bosses, items"`` in their host.yaml  

## Bot info

Bot in Archipelago-Log channel is a modified version of this ArchipelaBot fork:  
<https://github.com/evilwb/ArchipelaBot/commit/794ea7a5ac9f4a1f0a718b7c97689d13a4131258>  
Also here's the spectator yaml the bot uses (won’t see responses to player hints):  
```
name: Spectator
game: Archipelago
requires:
  version: 0.4.6
Archipelago: {}
```

Also here's my bat file to auto generate a new seed, host it, and also launch my bot bat:  
```bat
TITLE ArchipelaBot
setlocal enabledelayedexpansion

:: Go to "...\Archipelago\output" & Generate new AP:
cd "C:\ProgramData\Archipelago\output"
start "ArchipelagoGenerate" /wait "C:\ProgramData\Archipelago\ArchipelagoGenerate.exe"

:: Find newest .zip
for /f "eol=: delims=" %%F in ('dir /b /od *.zip') do (
    set "newest.zip=%%F"
)
:: Extract newest AP_#.ZIP
7z x "C:\ProgramData\Archipelago\output\%newest.zip%" -o"C:\ProgramData\Archipelago\output" -y
:: Find newest .archipelago file
for /f "eol=: delims=" %%F in ('dir /b /od *.archipelago') do (
    set "newest.archipelago=%%F"
)
:: Run newest .archipelago file to start server
start "ArchipelagoServer" "C:\ProgramData\Archipelago\output\%newest.archipelago%"

:: Run ArchipelaBot (Discord Bot)
timeout 10
cd "C:\C_stuff\ArchipelaBot"
start "ArchipelaBot" /b cmd /c "C:\C_stuff\ArchipelaBot\start.bat"
```
Bot bat:  
```bat
node scripts/registerSlashCommands.js
node bot.js
```
If you want the bat to ask if it should host or crate a new seed:  
```bash
@echo off
TITLE Archipelago
setlocal enabledelayedexpansion

:: Run server or not
echo Do you want to run the Archipelago server locally? (Y/N)
set /p runRest=
if /i "%runRest%" NEQ "Y" (
    goto :end
)

:: Go to "...\Archipelago\output"
cd "C:\ProgramData\Archipelago\output"

:: Check for .zip files
set zipFilesExist=false
for %%F in (*.zip) do (
    set zipFilesExist=true
    goto :checkComplete
)
:checkComplete

if "%zipFilesExist%" == "true" (
    echo Zip files found. Do you want to run ArchipelagoGenerate, and generate new a seed? (Y/N)
    set /p userChoiceGenerateAP=
    if /i "%userChoiceGenerateAP%" == "Y" (
        start "ArchipelagoGenerate" /wait "C:\ProgramData\Archipelago\ArchipelagoGenerate.exe"
    ) else (
        echo Skipping ArchipelagoGenerate...
    )
) else (
    echo No zip files found. Running ArchipelagoGenerate...
    start "ArchipelagoGenerate" /wait "C:\ProgramData\Archipelago\ArchipelagoGenerate.exe"
)

:: Find newest .zip
for /f "eol=: delims=" %%F in ('dir /b /od *.zip') do (
    set "newestzip=%%F"
)

:: Extract newest .zip
if defined newestzip (
    7z x "C:\ProgramData\Archipelago\output\!newestzip!" -o"C:\ProgramData\Archipelago\output" -y
)

:: Find newest .archipelago file
for /f "eol=: delims=" %%F in ('dir /b /od *.archipelago') do (
    set "newestarchipelago=%%F"
)

:: Run newest .archipelago file to start server
if defined newestarchipelago (
    start "ArchipelagoServer" /b cmd /c "C:\ProgramData\Archipelago\output\!newestarchipelago!"
)

:end
endlocal
```

Discord ArchipelaBot : <https://github.com/evilwb/ArchipelaBot/commit/794ea7a5ac9f4a1f0a718b7c97689d13a4131258>  
(Remember to remove ``\\`` line from ``config.json``.)  
Discord online bot manager: <https://discord.com/developers/applications>  
Write to txt file: "Application ID" & "Public Key" & "Client Secret". Under "Bot" Give "Intents"  
``bot.js`` i replaced ``client.once(Events.ClientReady, async () => {`` with the full *tweaked* command basically.  
Code here: <https://github.com/jacobmix/ArchipelaBot/blob/master/bot.js>  
Note:  Change ``const channel = client.channels.cache.get('CHANNEL_ID_HERE');`` to your own channel ID:  
(might have to restart Discord after bot joins your server to see slash commands)  

## Tools & Frameworks

Some stuff you might need installed or checkout for running or compiling bot/games/code:  
Git: <https://www.git-scm.com/downloads>  
Node.js & npm: <https://nodejs.org/en/download/prebuilt-installer>  
Python 3.11.x (Do not get 3.12.0 or above yet. Or below 3.8.0): <https://www.python.org/downloads/release/python-3119/>  
Environment editor: <https://www.rapidee.com/en/download>  
.NET: <https://versionsof.net/framework/>  
MSYS2 (CMake & Mingw-w64): <https://www.msys2.org/>  

## Overlay setup

AP log/chat overlay browser source for OBS: <https://github.com/LegendaryLinux/APSpectator>  
(This doesn't have colors for progression or such so you can stick with a text client if you wanna keep that)  
Set URL to: `file:///C:/Users/.../APSpectator-master/public/index.html?server=IP_HERE:38281&player=PLAYER_HERE&hideui=1`  
Browser Source CSS to remove margin/padding/border, and makes it slightly see-through:  
```css
body {
    background-color: rgba(0, 0, 0, 0);
    margin: 0;
    overflow: hidden;
}

#main-content {
    border: 0;
    padding: 0;
    margin: 0;
}

#console-output-wrapper {
    overflow: hidden;
    background-color: rgba(0, 0, 0, 75%);
}
```
Defualt styles:
```css
.console-message-player-other {
    color: #52b44c;
}

.console-message-player-self {
    color: #ffa565;
    font-weight: bold;
}

.console-message-item {
    color: #fc5252;
}

.console-message-location {
    color: #5ea2c1;
}
```  
You can change other elements by styling the following CSS classes:

| CSS Class                           | Explanation
| ----------------------------------- | -----------
| `.console-message-player-self`      | Your player name
| `.console-message-player-other`     | Other player names
| `.console-message-location`         | Location names
| `.console-message-item`             | Items (all types)
| `.console-message-item-advancement` | Advancement items
| `.console-message-item-useful`      | Useful items
| `.console-message-item-trap`        | Trap items
| `.console-message-item-normal`      | Items that aren't in any of the above categories
| `.console-message-entrance`         | Entrance names (seen in hints)

For more details, see [console.css](https://github.com/jacobmix/APSpectator/blob/wss/public/styles/console.css).  For a sample that updates colors to match common client colors, see [commonClient.css](https://github.com/jacobmix/APSpectator/blob/wss/public/styles/commonClient.css)
