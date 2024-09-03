const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

const token = ''; // قم بإضافة توكن البوت هنا
const warnChannelId = '1278338550970060812';
const imageUrl = 'https://media.discordapp.net/attachments/1278351548849852457/1279531008382861352/line.png?ex=66d8135c&is=66d6c1dc&hm=6a46186808164b398832fc24fce322927e738ce2e905215f25b402ad48926ef4&';
const rolePermissions = {
    lockRoleId: '1278314712110469121',
    hideRoleId: '1277610838202646640',
    warnRoleId: '1278314617852006504',
    muteRoleId: '1278314712110469121',
    unmuteRoleId: '1278314712110469121',
    sayRoleId: '1277610838202646640',
    pingRoleId: '1278314216201129985',
    unbanRoleId: '1277610838202646640',
    banRoleId: '1277610838202646640',
    adminRoleId: '1280315681606340608',
};

const cooldowns = new Map();
const cooldownTime = 10000; // مدة المؤقت بالميلي ثانية (10 ثواني هنا)
const handledMessages = new Set();
const executedCommands = new Set();

function hasPermission(member, requiredRoleId) {
    return member.roles.cache.has(requiredRoleId);
}

client.once('ready', () => {
    console.log('Bot is online!');
    client.user.setActivity('*help', { type: 'PLAYING' });
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // Command: #help
    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('قائمة الأوامر')
            .setDescription('هنا قائمة بالأوامر التي يمكنك استخدامها مع هذا البوت:')
            .addFields([
                { name: '!lock', value: 'يقفل الروم الحالي بحيث لا يستطيع أحد الكتابة فيه.' },
                { name: '!unlock', value: 'يفتح الروم الحالي للسماح بالكتابة فيه مرة أخرى.' },
                { name: '!hide', value: 'يخفي الروم الحالي بحيث لا يستطيع أحد رؤيته.' },
                { name: '!show', value: 'يظهر الروم الحالي بعد إخفائه.' },
                { name: '!warn <user id> <السبب>', value: 'يرسل تحذير إلى مستخدم محدد مع السبب.' },
                { name: '!time <user id> <المدة>', value: 'يضع المستخدم في وضع الصمت (Timeout) لمدة محددة.' },
                { name: '!unmute <user id>', value: 'يقوم بإزالة وضع الصمت عن مستخدم.' },
                { name: '!come', value: 'ينقل المستخدم إلى قناة صوتية محددة.' },
                { name: '!say <الرسالة>', value: 'يجعل البوت يقول رسالة محددة في الروم.' },
                { name: '!ping', value: 'يعرض سرعة استجابة البوت.' },
                { name: '!unban <user id>', value: 'يقوم بإلغاء الحظر عن مستخدم.' },
                { name: '!ban <user id> <السبب>', value: 'يقوم بحظر مستخدم مع تحديد السبب.' }
            ])
            .setFooter({ text: 'بوت المساعدة' })
            .setColor('#00FF00');

        if (message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
            await message.channel.send({ embeds: [helpEmbed] });
            if (message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) {
                await message.delete().catch(err => console.error('حدث خطأ أثناء حذف الرسالة:', err));
            }
        } else {
            console.error('البوت لا يملك صلاحية إرسال الرسائل في هذه القناة.');
        }
        return;
    }

    // Ignore already handled messages
    if (handledMessages.has(message.id)) return;

    // Command: #server
    if (message.content === '!server') {
        const now = Date.now();
        const userCooldown = cooldowns.get(message.author.id);

        if (userCooldown && now < userCooldown + cooldownTime) {
            const remainingTime = ((userCooldown + cooldownTime) - now) / 1000;
            return message.reply(`يرجى الانتظار ${remainingTime.toFixed(1)} ثانية قبل استخدام الأمر مرة أخرى.`);
        }

        cooldowns.set(message.author.id, now);
        handledMessages.add(message.id);

        try {
            const guild = message.guild;
            const owner = await guild.fetchOwner();

            const embed = new EmbedBuilder()
                .setTitle(':id: Server ID:')
                .setDescription(`${guild.id}\n\n` +
                    `:calendar: Created On\n${guild.createdAt.toDateString()}\n\n` +
                    `:crown: Owned by\n${owner.user.tag}\n\n` +
                    `:busts_in_silhouette: Members\n` +
                    `Total: ${guild.memberCount}\n` +
                    `Online: ${guild.members.cache.filter(member => member.presence?.status === 'online').size}\n\n` +
                    `Boosts :sparkles:\n${guild.premiumSubscriptionCount}\n\n` +
                    `:speech_balloon: Channels\n` +
                    `Text: ${guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT').size}\n` +
                    `Voice: ${guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE').size}\n\n` +
                    `:earth_africa: Others\n` +
                    `:closed_lock_with_key: Roles\n${guild.roles.cache.size}`)
                .setColor('#00FF00');

            await message.channel.send({ embeds: [embed] });
            await message.delete();
        } catch (error) {
            console.error('Error while executing #server command:', error);
            await message.reply('حدث خطأ أثناء تنفيذ الأمر.');
        }
        return;
    }

    // Command: #lock, #unlock, #hide, #show
    if (['!lock', '!unlock', '!hide', '!show'].includes(message.content.split(' ')[0])) {
        const roleId = {
            '!lock': rolePermissions.lockRoleId,
            '!unlock': rolePermissions.lockRoleId,
            '!hide': rolePermissions.hideRoleId,
            '!show': rolePermissions.hideRoleId,
        }[message.content.split(' ')[0]];

        if (!hasPermission(message.member, roleId)) return;

        const permissionUpdates = {
            '!lock': { SendMessages: false },
            '!unlock': { SendMessages: true },
            '!hide': { ViewChannel: false },
            '!show': { ViewChannel: true }
        };

        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, permissionUpdates[message.content.split(' ')[0]]);
        await message.channel.send(`تم ${message.content.slice(1)} الروم.`); // Slice to remove '#'
        await message.delete();
        return;
    }

    // Command: #warn
    if (message.content.startsWith('!warn')) {
        const args = message.content.split(' ');
        if (args.length < 3 || !hasPermission(message.member, rolePermissions.warnRoleId)) {
            return await message.reply('الرجاء استخدام الصيغة الصحيحة: *warn <user id> <سبب التحذير>');
        }

        const userId = args[1];
        const reason = args.slice(2).join(' ') || 'لا يوجد سبب محدد';
        const warnMember = await message.guild.members.fetch(userId).catch(() => null);

        if (!warnMember) return await message.reply('المستخدم غير موجود في هذا السيرفر.');

        const warnEmbed = new EmbedBuilder()
            .setTitle('تحذير')
            .addFields([
                { name: 'المستخدم:', value: `<@${userId}>`, inline: true },
                { name: 'السبب:', value: reason, inline: true }
            ])
            .setColor('#ffcc00');

        const warnChannel = message.guild.channels.cache.get(warnChannelId);
        if (warnChannel) await warnChannel.send({ embeds: [warnEmbed] });

        try {
            const dmChannel = await warnMember.user.createDM();
            const dmEmbed = new EmbedBuilder()
                .setTitle('تحذير')
                .addFields([
                    { name: 'Server:', value: message.guild.name, inline: true },
                    { name: 'المستخدم:', value: `<@${userId}>`, inline: true },
                    { name: 'السبب:', value: reason, inline: true }
                ])
                .setColor('#ffcc00');
            await dmChannel.send({ embeds: [dmEmbed] });
            await message.reply(`تم إرسال تحذير إلى ${warnMember.user.tag}.`);
        } catch (error) {
            console.error('Error while sending DM:', error);
            await message.reply('حدث خطأ أثناء إرسال التحذير.');
        }

        await message.delete();
        return;
    }

    // Command: #time, #untime
    if (message.content.startsWith('!time') || message.content.startsWith('!untime')) {
        const [command, userId, duration] = message.content.split(' ');
        const isTimeout = command === '!time';
        const roleId = isTimeout ? rolePermissions.muteRoleId : rolePermissions.unmuteRoleId;
        const action = isTimeout ? '!untime' : 'removeTimeout';

        if (!hasPermission(message.member, roleId)) return;

        if (!userId) return await message.reply(`الرجاء استخدام الصيغة الصحيحة: ${isTimeout ? '!time <user id> <مدة وضع الصمت>' : '!untime <user id>'}`);
        const targetMember = await message.guild.members.fetch(userId).catch(() => null);

        if (!targetMember) return await message.reply('المستخدم غير موجود في هذا السيرفر.');

        try {
            if (isTimeout) {
                const timeDuration = ms(duration);
                if (!timeDuration) return await message.reply('المدة غير صالحة. يرجى إدخال مدة صالحة.');
                await targetMember.timeout(timeDuration, 'الصمت من قبل البوت');
                await message.reply(`تم وضع المستخدم ${targetMember.user.tag} في وضع الصمت لمدة ${duration}.`);
            } else {
                await targetMember.timeout(null);
                await message.reply(`تم إلغاء وضع الصمت عن المستخدم ${targetMember.user.tag}.`);
            }
        } catch (error) {
            console.error(`Error while ${action} the member:`, error);
            await message.reply(`حدث خطأ أثناء ${action === '!untime' ? 'وضع الصمت' : 'إلغاء وضع الصمت'} عن المستخدم.`);
        }

        await message.delete();
        return;
    }

    // Command: #come
    if (message.content.startsWith('!come')) {
        if (executedCommands.has(message.id)) return;

        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('الرجاء منشن الشخص الذي تريد دعوته.');

        const channelMention = `<#${message.channel.id}>`;

        try {
            await targetUser.send(`عزيزي العضو، يرجى التوجه إلى ${channelMention}.\n${message.author}`);
            message.channel.send(`تم إرسال الدعوة إلى ${targetUser.tag}.`);
        } catch (error) {
            console.error('Error sending DM:', error);
            message.channel.send(`لم أتمكن من إرسال الرسالة الخاصة إلى ${targetUser.tag}.`);
        }

        executedCommands.add(message.id);
        setTimeout(() => executedCommands.delete(message.id), 5 * 60 * 1000); // 5 دقائق
        return;
    }

    // Command: #say
    if (message.content.startsWith('!say')) {
        if (!hasPermission(message.member, rolePermissions.sayRoleId)) return;

        const sayMessage = message.content.slice(5); // Remove '#say '
        if (!sayMessage) return await message.reply('يرجى تقديم رسالة للنطق بها.');
        await message.channel.send(sayMessage);
        await message.delete();
        return;
    }

    // Command: #ping
    if (message.content === '!ping' && hasPermission(message.member, rolePermissions.pingRoleId)) {
        const pingEmbed = new EmbedBuilder()
            .setDescription(`سرعة الاستجابة: \`${client.ws.ping}ms\``)
            .setColor('#00FF00');
        await message.reply({ embeds: [pingEmbed] });
        return;
    }

    // Command: #unban
    if (message.content.startsWith('!unban') && hasPermission(message.member, rolePermissions.unbanRoleId)) {
        const userId = message.content.split(' ')[1];
        if (!userId) return await message.reply('الرجاء استخدام الصيغة الصحيحة: *unban <user id>');

        try {
            await message.guild.members.unban(userId);
            await message.reply(`تم إلغاء الحظر عن المستخدم <@${userId}>.`);
        } catch (error) {
            console.error('Error while unbanning the member:', error);
            await message.reply('حدث خطأ أثناء إلغاء الحظر عن المستخدم.');
        }

        await message.delete();
        return;
    }

    // Command: #ban
    if (message.content.startsWith('!ban') && hasPermission(message.member, rolePermissions.banRoleId)) {
        const [command, userId, ...reasonParts] = message.content.split(' ');
        const reason = reasonParts.join(' ') || 'لا يوجد سبب محدد';

        if (!userId) return await message.reply('الرجاء استخدام الصيغة الصحيحة: *ban <user id> <سبب الحظر>');

        try {
            await message.guild.members.ban(userId, { reason });
            await message.reply(`تم حظر المستخدم <@${userId}> بنجاح.`);
        } catch (error) {
            console.error('Error while banning the member:', error);
            await message.reply('حدث خطأ أثناء حظر المستخدم.');
        }

        await message.delete();
        return;
    }

    // Command: Auto-send image
    const requiredRoleId = '1278314216201129985';
    if (message.content.toLowerCase().includes('خط') && message.member.roles.cache.has(requiredRoleId)) {
        try {
            await message.channel.send({ files: [imageUrl] });
            if (message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) {
                await message.delete().catch(err => console.error('حدث خطأ أثناء حذف الرسالة:', err));
            }
        } catch (error) {
            console.error('حدث خطأ أثناء إرسال الصورة:', error);
        }
    } else if (message.content.toLowerCase().includes('خط')) {
        message.reply('ليس لديك الصلاحية لاستخدام هذا الأمر.');
    }
});

client.login(token);
