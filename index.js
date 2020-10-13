// This line MUST be first, for discord.js to read the process envs!
require('dotenv').config();
const Discord = require("discord.js");
const client = new Discord.Client();

/**
 * Executes a RegExp on a string and returns last result of first search if successful
 *
 * @param {string} str String to search in
 * @param {RegExp} regex RegExp to search with
 * @returns
 */
function extractString(str, regex) {
    let result = regex.exec(str);
    if (!result)
        return undefined;
    return result[result.length - 1];
}

/**
 * Extracts the id from a string and the fetches the User
 *
 * @export
 * @param {object} client the client
 * @param {string} text Text to extract id from
 * @returns User
 */
async function stringToUser(client, text) {
    text = extractString(text, /<@!?(\d*)>/) || text;
    try {
        return await client.users.fetch(text) || undefined;
    } catch (e) {
        return undefined;
    }
}

client.on("ready", async () => {
    console.log("ready");
    client.user.setPresence({ activity: { name: 'dms | read #apply', type: "WATCHING" }, status: "online" }).catch(console.error);
});

client.on("message", async (message) => {
    if (message.author.bot) return;
    if (!client.guilds.cache.get("717592986153779201")) return console.log("hoez guild not available");
    var appGuild = client.guilds.cache.get("717592986153779201");
    if (!appGuild.me.permissions.has("ADMINISTRATOR")) return console.log("inadequate perms");
    if (message.channel.type === "dm") {
	if (appGuild.channels.cache.find(cha => cha.name === `applic-${message.author.id}`)) {
	    let appChannel = appGuild.channels.cache.find(cha => cha.name == `applic-${message.author.id}`);
            return appChannel.send(message.content);
	}
	if (!appGuild.channels.cache.find(cha => cha.name === `applic-${message.author.id}`)) {
            if (!appGuild.channels.cache.find(cha => cha.type == "category" && cha.name == "applications")) await appGuild.channels.create("applications", {type: "category"});
            let appChannel = await appGuild.channels.create(`applic-${message.author.id}`, {type: "text", parent: appGuild.channels.cache.find(cha => cha.type == "category" && cha.name == "applications")});
        return appChannel.send({
                embed: {
                    description: `**Application Filed Under:** ${message.author}\n\nReply to the application with a question or response, or send one of \`accept\`, \`reject\`, or \`close\` to carry out further actions.`
                }
            })
            .then(appChannel.send(`${message.content}`));
	}
    }
    if (message.channel.type == "text" && message.guild.id == appGuild.id && message.channel.name.startsWith("applic-")) {
        let cnParts = message.channel.name.split("-");
        if (cnParts[1].length == 18) {
            let recip = await stringToUser(client, cnParts[1]);
            if (!recip) return message.channel.send("**The user this ticket channel is designated to is no longer available. You may delete this channel.**");
            if (message.content == "close") {
                recip.send({
                    embed: {
                        title: "Closed",
                        description: `Your application has been closed by the reviewers without further action.`,
                        fields: [
                            {
                                name: "Reason",
                                value: "none"
                            }
                        ]
                    }
                }).catch(console.error);
                message.channel.delete("application closed");
                return;
            }
            if (message.content == "reject") {
                recip.send({
                    embed: {
                        title: "Rejected",
                        description: `Your application has been rejected by the reviewers.`,
                        fields: [
                            {
                                name: "Reason",
                                value: "none"
                            }
                        ]
                    }
                }).catch(console.error);
                message.channel.delete("application rejected");
                return;
            }
            if (message.content == "accept") {
                recip.send({
                    embed: {
                        title: "Accepted",
                        description: `Your application has been accepted by the reviewers.`
                    }
                }).catch(console.error);
                message.channel.delete("application accepted");
                return;
            }
            recip.send({
                embed: {
                    description: `**REPLY**\nReplied to by: ${message.author}`
                }
            }).then(recip.send(message.content));
        }
    }
});

client.login(process.env.TOKEN).catch(console.error);


