// This line MUST be first, for discord.js to read the process envs!
require('dotenv').config();
const xlg = require("./xlogger");
const Discord = require("discord.js");
const client = new Discord.Client();
const info_color = 37809;
const log_color = 6969;

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
    // no messages from bots
    if (message.author.bot) return;
    // get ehoez guild
    var appGuild = client.guilds.cache.get("717592986153779201");
    if (!appGuild) return console.log("ehoez guild not available");
    // check for bot perms
    if (!appGuild.me.permissions.has("ADMINISTRATOR")) return console.log("inadequate perms");
    // check or make application category (by name)
    var appCat = appGuild.channels.cache.find(cha => cha.type == "category" && cha.name == "applications");
    if (!appCat) {
        appCat = await appGuild.channels.create("applications", { type: "category" }).catch(console.error);
    }
    // check or make applications log (by name)
    var appLog = appGuild.channels.cache.find(ch => ch.type === "text" && ch.name === "application-log");
    if (!appLog) {
        appLog = await appGuild.channels.create(`application-log`, {
            type: "text",
            parent: appCat
        }).catch(console.error);
    }
    /* ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     * ┃if someone dms (submitting application) ┃
     * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     */
    if (message.channel.type === "dm") {
        // **FOR NOW** ignoring messages that have no content (i think that is what images and embed look like)
        if (!message.content || message.content === "" || message.content === null) return;
        // checking for user's application channel if they have one
        let appChannel = appGuild.channels.cache.find(cha => cha.name === `applic-${message.author.id}`);
        if (appChannel) {
            let appChannel = appGuild.channels.cache.find(cha => cha.name == `applic-${message.author.id}`);
            await appChannel.send(`**Applicant** ▚\n${message.content}`).catch(xlg.error);
            await appLog.send({
                embed: {
                    color: log_color,
                    description: `${message.author} added to their application (${appChannel})`
                }
            }).catch(xlg.error);
            return;
        } else {
            appChannel = await appGuild.channels.create(`applic-${message.author.id}`, {
                type: "text",
                parent: appCat
            }).catch(xlg.error);
            await appChannel.send({
                embed: {
                    description: `**Application By:** ${message.author}\n\nReply to the application with a question or response, or send one of \`accept\`, \`reject\`, or \`close\` to carry out further actions.\n\nSend a reason message after \`close|reject\` to attach a reason to the rejection dm. \`accept|reject|close\` will delete this channel.`
                }
            }).then(appChannel.send(`${message.content}`)).catch(xlg.error);
            await message.author.send({
                embed: {
                    color: log_color,
                    description: `Hi, and thank you for submitting an application with me. Your message will be used as your application and has been sent.\n\nWhile you wait for a staff member to review your application, **please make sure you have everything in the checklist**. Application requirements can also be found in ${appGuild.channels.cache.get("765263778157690890") || "#apply"}.\n\nIf you wish to add something to your application, please just send another dm to me.`,
                    fields: [
                        {
                            name: "Checklist",
                            value: "1. Region\n2. Rank\n3. IGN\n4. Top 3 Past Clans\n5. Age\n6. Can you VC\n7. Can you scrim daily\n8. Are you experienced\n9. Send an SS of your stats/account to @Kiya💗 (NA), @my babygirl (EU)"
                        }
                    ]
                }
            }).catch(xlg.error)
            await appLog.send({
                embed: {
                    color: info_color,
                    description: `${message.author} submitted an application (${appChannel})`
                }
            }).catch(xlg.error);
            return;
        }
    }
    /* ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     * ┃if message in application ticket channel (managing applications) ┃
     * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     */
    if (message.channel.type == "text" && message.guild.id == appGuild.id && message.channel.name.startsWith("applic-")) {
        let cnParts = message.channel.name.split("-");
        if (cnParts[1].length == 18) {
            let recip = await stringToUser(client, cnParts[1]);
            if (!recip) {
                await message.channel.send({
                    embed: {
                        color: 16711680,
                        description: `The user this ticket channel is designated to is no longer available. You may delete this channel.`
                    }
                }).catch(xlg.error);
                await appLog.send({
                    embed: {
                        color: log_color,
                        description: `Message failed to send to user in ${message.channel}`
                    }
                }).catch(xlg.error);
                return;
            }
            if (message.content.toLocaleLowerCase().startsWith("close")) {
                await recip.send({
                    embed: {
                        title: "Closed",
                        description: `Your application has been closed by the reviewers without further action.`,
                        fields: [
                            {
                                color: 16750899,
                                name: "Reason",
                                value: `${message.content.split(" ").slice(1).join(" ") || "none"}`
                            }
                        ]
                    }
                }).catch(xlg.error);
                await message.channel.delete("application closed");
                await appLog.send({
                    embed: {
                        color: log_color,
                        description: `Application of ${recip} **closed** by ${message.author}`
                    }
                }).catch(xlg.error);
                return;
            }
            if (message.content.toLocaleLowerCase().startsWith("reject")) {
                await recip.send({
                    embed: {
                        title: "Rejected",
                        description: `Your application has been rejected by the reviewers. You may appeal, but spamming appeals will get you banned.`,
                        fields: [
                            {
                                color: 16711680,
                                name: "Reason",
                                value: `${message.content.split(" ").slice(1).join(" ") || "none"}`
                            }
                        ]
                    }
                }).catch(xlg.error);
                await message.channel.delete("application rejected");
                await appLog.send({
                    embed: {
                        color: log_color,
                        description: `Application of ${recip} **rejected** by ${message.author}`
                    }
                }).catch(xlg.error);
                return;
            }
            if (message.content.toLocaleLowerCase().startsWith("accept")) {
                await recip.send({
                    embed: {
                        color: 65280,
                        title: "Accepted",
                        description: `Your application has been accepted by the reviewers. If the staff do not give you the necessary team roles, please ask for them in a chat.`
                    }
                }).catch(xlg.error);
                await message.channel.delete("application accepted");
                await appLog.send({
                    embed: {
                        color: log_color,
                        description: `Application of ${recip} **accepted** by ${message.author}`
                    }
                }).catch(xlg.error);
                return;
            }
            recip.send({
                embed: {
                    description: `Replied to by: ${message.author}`
                }
            }).then(recip.send(message.content)).catch(console.error);
            await appLog.send({
                embed: {
                    color: log_color,
                    description: `${message.author} replied to application of ${recip}`
                }
            }).catch(xlg.error);
        }
    }
});

client.login(process.env.TOKEN).catch(xlg.error);


