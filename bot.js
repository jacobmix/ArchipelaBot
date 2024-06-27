const { Client, Events, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const config = require('./config.json');
const { cachePartial } = require('./lib');
const { generalErrorHandler } = require('./errorHandlers');
const fs = require('fs');

const ArchipelagoInterface = require('./Archipelago/ArchipelagoInterface');
const { SlashCommandBuilder, User } = require('discord.js');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3');
const { ITEMS_HANDLING_FLAGS, COMMON_TAGS, SERVER_PACKET_TYPE, ConnectionStatus } = require('archipelago.js');
//const { Client, ITEMS_HANDLING_FLAGS, COMMON_TAGS, SERVER_PACKET_TYPE, ConnectionStatus } = require('archipelago.js');
const { v4: uuid } = require('uuid');

// Catch all unhandled errors
process.on('uncaughtException', (err) => generalErrorHandler(err));
process.on('unhandledRejection', (err) => generalErrorHandler(err));

const client = new Client({
  partials: [ Partials.GuildMember, Partials.Message ],
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent],
});
client.messageListeners = [];
client.channelDeletedListeners = [];
client.slashCommandCategories = [];

client.tempData = {
  apInterfaces: new Map(),
};

// Load channelDeleted listeners
fs.readdirSync('./channelDeletedListeners').filter((file) => file.endsWith('.js')).forEach((listenerFile) => {
  const listener = require(`./channelDeletedListeners/${listenerFile}`);
  client.channelDeletedListeners.push(listener);
});

// Load slash command category files
fs.readdirSync('./slashCommandCategories').filter((file) => file.endsWith('.js')).forEach((categoryFile) => {
  const slashCommandCategory = require(`./slashCommandCategories/${categoryFile}`);
  client.slashCommandCategories.push(slashCommandCategory);
});

// Run channelDelete events through their listeners
client.on(Events.ChannelDelete, async(channel) => {
  client.channelDeletedListeners.forEach((listener) => listener(client, channel));
});

// Run the interactions through the interactionListeners
client.on(Events.InteractionCreate, async(interaction) => {
  // Handle slash command interactions independently of other interactions
  if (interaction.isChatInputCommand()) {
    for (const category of client.slashCommandCategories) {
      for (const listener of category.commands) {
        if (listener.commandBuilder.name === interaction.commandName) {
          return listener.execute(interaction);
        }
      }
    }

    // If this slash command has no known listener, notify the user and log a warning
    return interaction.reply('Unknown command.');
  }
});

// Use the general error handler to handle unexpected errors
client.on(Events.Error, async(error) => generalErrorHandler(error));

client.once(Events.ClientReady, async () => {
  // Login and initial setup successful
  console.info(`Connected to Discord. Active in ${client.guilds.cache.size} guilds.`);

  // run command after startup?
  const channel = client.channels.cache.get('1236668389796089877');

    //async execute() {
        serverAddress = null;
        port = null;
        slotName = null;
        password = null;

        if (serverAddress === null) {
          serverAddress = config.serverAddress ?? "127.0.0.1";    
        }
        if (port === null) {
          port = Number(config.port) ?? 12345;
        }
        if (slotName === null) {
          slotName = config.slotName ?? "no name";
        }
        if (password === null) {
          password = config.password ?? null;
        }

        if (client.tempData.apInterfaces.has(channel.id)) {
          return channel.send({
            content: 'An Archipelago game is already being monitored in this channel ' +
              'and must be disconnected before a new game can be monitored.',
            ephemeral: true,
          });
        }

        if (serverAddress === 'archipelago.gg') {
          return channel.send({
            content: 'This bot connot be used with the official Archipelago server. ' +
              'Please to a self hosted server.',
            ephemeral: true,
          });
        }
        

  APInterface = new ArchipelagoInterface(channel, config.serverAddress, Number(config.port), config.slotName, config.password);
  
        // Check if the connection was successful every half second for five seconds
        for (let i=0; i<10; ++i){
          // Wait half of a second
          await new Promise((resolve) => (setTimeout(resolve, 500)));

          if (APInterface.APClient.status === 'Connected') {
            client.tempData.apInterfaces.set(channel.id, APInterface);
            await channel.send({
              content: `Connected to ${config.serverAddress} with slot ${config.slotName}.`,
              ephemeral: false,
            });

	        // Set the APInterface to show all kinds of messages
            client.tempData.apInterfaces.get(channel.id).showItems = true;
            client.tempData.apInterfaces.get(channel.id).showProgression = true;
            client.tempData.apInterfaces.get(channel.id).showHints = true;
            client.tempData.apInterfaces.get(channel.id).showChat = true;
            return channel.send({
                content: 'Showing item, progression, hint, and chat messages.',
                ephemeral: false,
            });

            // TODO: The following does not work. status doesn't seem to be a good way to check 
            // for disconnects. Replace with auto reconnect behavior based on some pinging method. 
            // Until then, the following will run forever.

            // Make this run until not longer connected to the AP server.
	          while (APInterface.APClient.status === 'Connected') {	
              //console.log("Still connected to server");
              await new Promise((resolve) => (setTimeout(resolve, 5000)));
		        }

            await channel.send({
		          content: `Disconnected from AP server at ${config.serverAddress}.`,
		          ephemeral: false,
		        });

            return setTimeout(() => {
              console.log("Lost connection with AP server.");
              if (client.tempData.apInterfaces.has(channel.id)) {
                client.tempData.apInterfaces.get(channel.id).disconnect();
                client.tempData.apInterfaces.delete(channel.id);
              }
            }, 5000);
          }
        }
        
		// If the client fails to connect, notify the user
        return interaction.reply({
          content: `Unable to connect to AP server at ${config.serverAddress}.`,
          ephemeral: false,
        });
	//}
});

client.login(config.token);
