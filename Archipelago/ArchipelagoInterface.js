const { Client, ITEMS_HANDLING_FLAGS, COMMON_TAGS, SERVER_PACKET_TYPE, ConnectionStatus } = require('archipelago.js');
const { User } = require('discord.js');
const { v4: uuid } = require('uuid');

class ArchipelagoInterface {
  /**
   * @param textChannel discord.js TextChannel
   * @param {string} host
   * @param {Number} port
   * @param {string} slotName
   * @param {string|null} password optional
   */
  constructor(textChannel, host, port, slotName, password = null) {
    this.textChannel = textChannel;
    this.messageQueue = [];
    this.players = new Map();
    this.APClient = new Client();

    this.slotName = slotName;
    this.host = host;
    this.port = port;
    this.password = password;

    this.allowReconnect = true; // Prevent reconnect after manual disconnect or goal clear
    this.reconnecting = false; // Prevent multiple simultaneous loops
    this.reconnectNotified = false; // Prevent spamming channel
    this.reconnectDelay = 10000; // 10s retry delay (adjustable)

    // Controls which messages should be printed to the channel
    this.showHints = true;
    this.showItems = true;
    this.showProgression = true;
    this.showChat = false;

    this.connectToServer();
  }

  /**
   * Helper to get connection info for APClient
   */
  getConnectionInfo() {
    return {
      hostname: this.host,
      port: this.port,
      uuid: uuid(),
      game: '',
      name: this.slotName,
      password: this.password,
      version: { major: 0, minor: 6, build: 3 },
      tags: [COMMON_TAGS.TEXT_ONLY],
      items_handling: ITEMS_HANDLING_FLAGS.LOCAL_ONLY,
    };
  }

  /**
   * Connect to the Archipelago server
   */
  connectToServer() {
    const connectionInfo = this.getConnectionInfo();

    this.APClient.connect(connectionInfo).then(() => {
      // Start handling queued messages
      this.queueTimeout = setTimeout(this.queueHandler, 2000);

      // Set up packet listeners
      // this.APClient.addListener(SERVER_PACKET_TYPE.PRINT, this.printHandler);
      this.APClient.addListener(SERVER_PACKET_TYPE.PRINT_JSON, this.printJSONHandler);

      // Handle unexpected disconnects
      this.APClient.addListener('disconnect', () => {
        console.warn("APClient disconnected!");
        this.handleDisconnect();
      });

      this.APClient.addListener('close', () => {
        console.warn("APClient connection closed!");
        this.handleDisconnect();
      });

      // Inform the user ArchipelaBot has connected to the game
      this.textChannel.send('✅ Connection established.');
    }).catch(async (err) => {
      console.error('Error while trying to connect with connectionInfo:');
      console.error(connectionInfo);
      console.error('With trace:');
      console.error(err);
      await this.textChannel.send('❌ Failed to connect to AP server:\n' +
        `\`\`\`${JSON.stringify(err)}\`\`\``);
      this.handleDisconnect();
    });
  }

  // Handle disconnects, and try to reconnect if not finished or manually disconnected with command.
  handleDisconnect = async () => {
    if (!this.allowReconnect) return;
    if (this.reconnecting) return;

    this.reconnecting = true;
    let attempt = 1;

    // Notify Discord once that we lost connection
    if (!this.reconnectNotified) {
      try {
        await this.textChannel.send(`⚠️ Connection lost. Attempting to reconnect...`);
      } catch (err) {
        console.error("Failed to send disconnect notification to Discord:", err);
      }
      this.reconnectNotified = true;
    }

    while (this.allowReconnect) {
      console.log(`APClient reconnect attempt #${attempt}...`);

      try {
        const connectionInfo = this.getConnectionInfo();
        await this.APClient.connect(connectionInfo);

        // Successful reconnect
        this.reconnecting = false;
        this.reconnectNotified = false; // reset flag for future disconnects

        console.log(`✅ Reconnected to AP server on attempt #${attempt}`);

        try {
          await this.textChannel.send(`✅ Reconnected to AP server.`);
        } catch (err) {
          console.error("Failed to send reconnect notification to Discord:", err);
        }

        return;
      } catch (err) {
        console.error(`Reconnect attempt #${attempt} failed:`, err);
        attempt++;
        await new Promise(r => setTimeout(r, this.reconnectDelay));
      }
    }

    this.reconnecting = false;
  };

  /**
   * Send queued messages to the TextChannel in batches of five or less
   * @returns {Promise<void>}
   */
  queueHandler = async () => {
    let messages = [];

    for (let message of this.messageQueue) {
      switch (message.type) {
        case 'hint':
          // Ignore hint messages if they should not be displayed
          if (!this.showHints) { continue; }

          // Replace player names with Discord User objects
          for (let alias of this.players.keys()) {
            if (message.content.includes(alias)) {
              message.content = message.content.replace(alias, this.players.get(alias));
            }
          }
          break;

        case 'item':
          // Ignore item messages if they should not be displayed
          if (!this.showItems) { continue; }
          break;

        case 'progression':
          // Ignore progression messages if they should not be displayed
          if (!this.showProgression) { continue; }
          break;

        case 'chat':
          // Ignore chat messages if they should not be displayed
          if (!this.showChat) { continue; }
          break;

        default:
          console.warn(`Ignoring unknown message type: ${message.type}`);
          break;
      }

      messages.push(message.content);
    }

    // Clear the message queue
    this.messageQueue = [];

    // Send messages to TextChannel in batches of five, spaced two seconds apart to avoid rate limit
    while (messages.length > 0) {
      await this.textChannel.send(messages.splice(0, 5).join('\n'));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Set timeout to run again after two seconds
    this.queueTimeout = setTimeout(this.queueHandler, 2000);
  };

  /**
   * Listen for a print packet and add that message to the message queue
   * @param {Object} packet
   * @returns {Promise<void>}
   */
  printHandler = async (packet) => {
    this.messageQueue.push({
      type: packet.text.includes('[Hint]') ? 'hint' : 'chat',
      content: packet.text,
    });
  };

  /**
   * Listen for a printJSON packet, convert it to a human-readable format, and add the message to the queue
   * @param {Object} packet
   * @param {String} rawMessage
   * @returns {Promise<void>}
   */
  printJSONHandler = async (packet, rawMessage) => {
    console.log("Raw Message:\n" + rawMessage);
    let message = { type: 'chat', content: '' };

    /* ---------------------------------------------------------------
       TEAM CLEAR DETECTION (using rawMessage text)
    --------------------------------------------------------------- */
    if (rawMessage.includes("has completed all of their games")) {
      this.allowReconnect = false; // Prevent reconnect after team clear

      // Announce immediately
      try {
        await this.textChannel.send(
          `🎉 **${rawMessage.trim()}** 🎉\n` +
          `The Archipelago session will automatically disconnect in **60 seconds**.`
        );
      } catch (err) {
        console.error("Failed to send team-clear message:", err);
      }

      // Perform delayed disconnect
      setTimeout(async () => {
        try {
          await this.textChannel.send(`⏳ Disconnecting Archipelago session now...`);
        } catch { }

        try {
          clearTimeout(this.queueTimeout);
          this.APClient.disconnect();
        } catch (e) {
          console.error("Error disconnecting:", e);
        }

        // Cleanup interface reference
        try {
          if (this.textChannel.client.tempData.apInterfaces.has(this.textChannel.id)) {
            this.textChannel.client.tempData.apInterfaces.delete(this.textChannel.id);
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }, 60_000);

      return; // Stop further handling
    }
    /* ---------------------------------------------------------------
       END TEAM CLEAR DETECTION
    --------------------------------------------------------------- */


    // If not an ItemSend / ItemCheat / Hint packet, just forward raw text
    if (!['ItemSend', 'ItemCheat', 'Hint'].includes(packet.type)) {
      message.content = rawMessage;
      this.messageQueue.push(message);
      return;
    }

    message.content += "```ansi\n";

    packet.data.forEach((part) => {
      // plain text section
      if (!part.hasOwnProperty('type') && part.hasOwnProperty('text')) {
        message.content += part.text;
        return;
      }

      switch (part.type) {
        case 'player_id':
          message.content += '\u001b[1;37m' +
            this.APClient.players.alias(parseInt(part.text, 10)) +
            '\u001b[0m';
          break;

        case 'item_id':
          const itemName = this.APClient.players
            .get(packet.receiving)
            .item(parseInt(part.text, 10));

          // Color progression / useful / filler
          switch (part?.flags) {
            case 0b001:
              message.content += "\u001b[1;4;33m"; // progression
              break;
            case 0b010:
              message.content += "\u001b[1;34m"; // useful
              break;
            case 0b100:
              message.content += "\u001b[1;35m"; // trap
              break;
            default:
              message.content += "\u001b[1;36m"; // filler
              break;
          }

          message.content += `${itemName}`;
          message.content += "\u001b[0m";

          // Identify as item or progression
          if (part?.flags === 0b001) message.type = 'progression';
          else if (message.type !== 'progression') message.type = 'item';
          break;

        case 'location_id':
          const locationName = this.APClient.players
            .get(packet.item.player)
            .location(parseInt(part.text, 10));
          message.content += `\u001b[1;32m${locationName}\u001b[0m`;
          break;

        case 'color':
          message.content += part.text;
          break;

        default:
          console.warn(
            `Ignoring unknown message type ${part.type} with text "${part.text}".`
          );
          return;
      }
    });

    // Identify hint messages
    if (rawMessage.includes('[Hint]')) {
      message.type = 'hint';
    }

    message.content += "\n```";

    console.log("Processed Message of type " + message.type);
    console.log(message.content);

    this.messageQueue.push(message);
  };

  /**
   * Associate a Discord user with a specified alias
   * @param {string} alias
   * @param {User} discordUser
   * @returns {*}
   */
  setPlayer = (alias, discordUser) => this.players.set(alias, discordUser);

  /**
   * Disassociate a Discord user with a specified alias
   * @param alias
   * @returns {boolean}
   */
  unsetPlayer = (alias) => this.players.delete(alias);

  /**
   * Determine the status of the ArchipelagoClient object
   * @returns {ConnectionStatus}
   */
  getStatus = () => this.APClient.status;

  /** Close the WebSocket connection on the ArchipelagoClient object */
  disconnect = () => {
    this.allowReconnect = false; // Prevent reconnect on manual disconnect
    clearTimeout(this.queueTimeout);
    this.APClient.disconnect();
  };
}

module.exports = ArchipelagoInterface;
