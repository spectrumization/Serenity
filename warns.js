const Discord = require('discord.js');
const punishments = require('../punishments.json');
module.exports = {
    name: 'warn',
    description: 'Warns a user',
    type: 'Mod',
    async execute(message, args, client, con) {

        var Messages = [];
        var userInput = args[0];
        var punishmentKeys = Object.keys(punishments);
        var punishmentOptions = "";
        var specifiedPunishment;
        const warnchat = client.channels.cache.find(channel => channel.id === "795379430210011146");
        const banchat = client.channels.cache.find(channel => channel.id === "795379430210011146");
        var muteRole = message.guild.roles.cache.find(role => role.id === "796877729760935966");

        const noUserEmbed = new Discord.MessageEmbed()
            .setColor('#ff1420')
            .addField('No user!', "You didn't provided a tagged user or user ID")
        const modOptions = new Discord.MessageEmbed()
            .setColor('#ffb0f1')
            .setTitle("Please select a mod type by typing the corresponding number!")
            .setTimestamp(Date.now())
        const timeoutEmbed = new Discord.MessageEmbed()
            .setColor('#ff1420')
            .addField('Warning Timed Out!', "You didn't respond fast enough.")
        const invalidChoiceEmbed = new Discord.MessageEmbed()
            .setColor('#ff1420')
            .addField('Invalid Choice', "That's an invalid choice, please try again and enter **only** the number of the choice you wish to select")
        const warningEmbed = new Discord.MessageEmbed()
            .setColor('#ffff00')
        const muteEmbed = new Discord.MessageEmbed()
            .setColor('#000000')
        const kickEmbed = new Discord.MessageEmbed()
            .setColor('#ff7700')
        const banEmbed = new Discord.MessageEmbed()
            .setColor('#ff0000')
        const confirmEmbed = new Discord.MessageEmbed()
            .setColor('#00ff00')
            .addField('Processed', "The punishment has now been processed")
        const dmEmbed = new Discord.MessageEmbed()
            .setColor('#febaff')

        Messages.push(message);

        if (!message.member.roles.cache.has('795382249872687134') && !message.member.hasPermission('ADMINISTRATOR')) {
            message.channel.send("Error not correct rank to use the warn commands").then(async (m) => { Messages.push(m); messageCleanup(); });
            return;
        }

        con.connect((err) => {
            if (err) { console.log(err); return; }
        })

        targetUser = message.mentions.users.first();
        if (!targetUser && userInput !== "") { if (client.guilds.resolve("785686835203932210").members.cache.has(userInput)) targetUser = await client.users.fetch(userInput); }
        if (!targetUser) {
            message.channel.send(noUserEmbed).then((m) => (Messages.push(m)));
            messageCleanup();
            return;
        };
        targetMember = await message.guild.members.fetch(targetUser.id);

        createPunishmentOptions();

        function createPunishmentOptions() {
            var TempCounter = 1
            punishmentKeys.forEach(r => {
                punishmentOptions = (punishmentOptions + TempCounter + ") " + punishments[r].Name + '\n')
                TempCounter += 1;
            });
            punishmentOptions = (punishmentOptions + "Type `exit` if you wish to exit" + '\n' + '\n' + "If you're unsure what the types mean feel free to run:" + '\n' + "`~mod-type-help <number of type here>`");
            modOptions.setDescription(punishmentOptions);
            sendModOptions();
        }

        function sendModOptions() {
            message.channel.send(modOptions).then((m) => {
                Messages.push(m);
                awaitModType();
            }
            ).catch(() => {
                timeout();
            });
        }

        async function awaitModType() {
            const filter = m => m.author.id === message.author.id;
            message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((collected) => {
                Messages.push(collected.first());
                handleModType(collected.first());
            }).catch(() => {
                timeout();
            });
        }

        async function handleModType(modType) {
            if (modType.content.trim().toLowerCase() === "exit") { messageCleanup(); return; }
            modType = (parseInt(modType) - 1)
            punishmentsOBJ = Object.keys(punishments)
            if (punishments[punishmentsOBJ[modType]] === undefined) { message.channel.send(invalidChoiceEmbed).then((m) => { Messages.push(m); awaitModType(); }) }
            processModType(modType, punishmentsOBJ);

        }

        async function processModType(modType, punishmentsOBJ) {
            specifiedPunishment = punishments[punishmentsOBJ[modType]];
            var sql = "SELECT * FROM `Serenity`.`warnings` WHERE UserID=? & Reason=?;";
            con.query(sql, [BigInt(targetUser.id), specifiedPunishment.Name], (err, results) => {
                if (err) { console.log(err); return; };
                if (results.length < 1) {
                    if (specifiedPunishment.Warnings === 0) {
                        triggerPunishment();
                    }
                    else {
                        logWarning();
                        warnHandler();
                    }
                } else {
                    if (((results.length) + 1) > specifiedPunishment.Warnings) {
                        triggerPunishment(results.length);
                        logWarning();
                    } else {
                        logWarning();
                    }
                }
            })
        }

        function triggerPunishment(Warnings) {
            if ((specifiedPunishment.Mute === true)) {
                if (Warnings + 1 === specifiedPunishment.Warnings + 2) {
                    kickHandler();
                } else if (Warnings + 1 === specifiedPunishment.Warnings + 3) {
                    banHandler();
                } else { muteHandler(); }
            } else if (specifiedPunishment.Kick === true) {
                if (Warnings + 1 === specifiedPunishment.Warnings + 2) { 
                    banHandler(); 
                } else { kickHandler(); }
            } else {
                banHandler();
            }
        }

        function warnHandler() {
            warningEmbed.setThumbnail(client.guilds.resolve("785686835203932210").members.resolve(targetUser).user.avatarURL());
            warningEmbed.setTimestamp(Date.now());
            warningEmbed.setTitle(targetUser.tag + " Has been warned!");
            warningEmbed.setDescription("Reason: `" + specifiedPunishment.Name + "`")
            warningEmbed.addField("User ID:", "`" + targetUser.id + "`");
            warningEmbed.addField("Issued By:", "<@" + message.author.id + ">");
            warnchat.send(warningEmbed);
            warnchat.send("<@" + message.author.id + "> Will upload the appropriate proof below.");
            dmSender("Warn");
            message.channel.send(confirmEmbed).then(m => { Messages.push(m); messageCleanup(); })
        }
        function muteHandler() {
            muteEmbed.setThumbnail(client.guilds.resolve("785686835203932210").members.resolve(targetUser).user.avatarURL());
            muteEmbed.setTimestamp(Date.now());
            muteEmbed.setTitle(targetUser.tag + " Has been muted!");
            muteEmbed.setDescription("Reason: `" + specifiedPunishment.Name + "`")
            muteEmbed.addField("User ID:", "`" + targetUser.id + "`");
            muteEmbed.addField("Issued By:", "<@" + message.author.id + ">");
            warnchat.send(muteEmbed);
            warnchat.send("<@" + message.author.id + "> Will upload the appropriate proof below.");
            targetMember.roles.add(muteRole);
            dmSender("Mute");
            message.channel.send(confirmEmbed).then(m => { Messages.push(m); messageCleanup(); })
        }
        function kickHandler() {
            kickEmbed.setThumbnail(client.guilds.resolve("785686835203932210").members.resolve(targetUser).user.avatarURL());
            kickEmbed.setTimestamp(Date.now());
            kickEmbed.setTitle(targetUser.tag + " Has been kicked!");
            kickEmbed.setDescription("Reason: `" + specifiedPunishment.Name + "`")
            kickEmbed.addField("User ID:", "`" + targetUser.id + "`");
            kickEmbed.addField("Issued By:", "<@" + message.author.id + ">");
            warnchat.send(kickEmbed);
            warnchat.send("<@" + message.author.id + "> Will upload the appropriate proof below.");
            targetMember.kick();
            dmSender("Kick");
            message.channel.send(confirmEmbed).then(m => { Messages.push(m); messageCleanup(); })
        }
        function banHandler() {
            banEmbed.setThumbnail(client.guilds.resolve("785686835203932210").members.resolve(targetUser).user.avatarURL());
            banEmbed.setTimestamp(Date.now());
            banEmbed.setTitle(targetUser.tag + " Has been banned!");
            banEmbed.setDescription("Reason: `" + specifiedPunishment.Name + "`")
            banEmbed.addField("User ID:", "`" + targetUser.id + "`");
            banEmbed.addField("Issued By:", "<@" + message.author.id + ">");
            banchat.send(banEmbed);
            banchat.send("<@" + message.author.id + "> Will upload the appropriate proof below.");
            targetMember.ban();
            dmSender("Ban");
            message.channel.send(confirmEmbed).then(m => { Messages.push(m); messageCleanup(); })
        }
        function dmSender(action) {
            dmEmbed.setTitle("You have receieved a " + action);
            dmEmbed.setDescription("In Serenity for `" + specifiedPunishment.Name + "`");
            dmEmbed.addField("User ID:", "`" + targetUser.id + "`");
            dmEmbed.addField("Issued By:", "<@" + message.author.id + ">");
            try {
                targetUser.send(dmEmbed);
            } catch (error) { }
        }

        async function logWarning() {
            var sql = "INSERT INTO `Serenity`.`warnings`(`UserID`,`Reason`,`Timestamp`,`WarnedBy`) VALUES (?,?,?,?);"
            con.query(sql, [BigInt(targetUser.id), specifiedPunishment.Name, BigInt(Date.now()), BigInt(message.author.id)], (err) => {
                if (err) { console.log(err); return; };
            });
        }

        async function timeout() {
            message.channel.send(timeoutEmbed).then(async function (message) {
                Messages.push(message);
                await sleep(5000);
                Messages.forEach(r => { r.delete(); });
            })
        }

        async function messageCleanup() {
            await sleep(5000);
            Messages.forEach(r => { r.delete(); });
        }
    }

};
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); };
