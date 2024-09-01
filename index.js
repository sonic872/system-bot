const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms'); // مكتبة لتحويل الوقت بشكل مريح
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// ضع هنا توكن البوت الخاص بك
const token = 'MTI3ODM2MzE3MzU5ODI2NTQyNA.Gp2vM2.VOjCR_i9PWqwCdZn8xp4a4lUiB2xxj40hGv1iY';
const warnChannelId = '1278338550970060812'; // معرف القناة التي ستتلقى التحذيرات
let hasSentImage = false;

// معرفات الأدوار المسموح لها باستخدام الأوامر
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
    adminRoleId: '1278366144603885699', // قم بتغيير هذا المعرف إلى معرف رتبة "ادمن استرتر" الخاص بك
};

// دالة للتحقق من صلاحيات الأدوار
function hasPermission(member, requiredRoleId) {
    return member.roles.cache.has(requiredRoleId);
}

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.guild && message.channel.isTextBased()) {
        const member = message.member;

        // منع الروابط إلا إذا كان المستخدم يمتلك رتبة ادمن استرتر
        if (message.content.includes('http://') || message.content.includes('https://')) {
            if (!hasPermission(member, rolePermissions.adminRoleId)) {
                try {
                    await message.delete();
                    message.channel.send(`${message.author}, لا يُسمح بإرسال الروابط هنا.`);
                } catch (error) {
                    console.error('Error while deleting a link message:', error);
                }
            }
        }

        // تحقق من الأمر *help
        if (message.content === '*help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('قائمة الأوامر')
                .setDescription('هنا قائمة بالأوامر التي يمكنك استخدامها مع هذا البوت:')
                .addFields([
                    { name: '*lock', value: 'يقفل الروم الحالي بحيث لا يستطيع أحد الكتابة فيه.' },
                    { name: '*unlock', value: 'يفتح الروم الحالي للسماح بالكتابة فيه مرة أخرى.' },
                    { name: '*hide', value: 'يخفي الروم الحالي بحيث لا يستطيع أحد رؤيته.' },
                    { name: '*show', value: 'يظهر الروم الحالي بعد إخفائه.' },
                    { name: '*warn <user id> <السبب>', value: 'يرسل تحذير إلى مستخدم محدد مع السبب.' },
                    { name: '*time <user id> <المدة>', value: 'يضع المستخدم في وضع الصمت (Timeout) لمدة محددة.' },
                    { name: '*unmute <user id>', value: 'يقوم بإزالة وضع الصمت عن مستخدم.' },
                    { name: '*come', value: 'ينقل المستخدم إلى قناة صوتية محددة.' },
                    { name: '*say <الرسالة>', value: 'يجعل البوت يقول رسالة محددة في الروم.' },
                    { name: '*ping', value: 'يعرض سرعة استجابة البوت.' },
                    { name: '*unban <user id>', value: 'يقوم بإلغاء الحظر عن مستخدم.' },
                    { name: '*ban <user id> <السبب>', value: 'يقوم بحظر مستخدم مع تحديد السبب.' }
                ])
                .setFooter({ text: 'بوت المساعدة' })
                .setColor('#00FF00');

            await message.channel.send({ embeds: [helpEmbed] });
            await message.delete(); // حذف الرسالة التي تحتوي على الأمر
        }

        // أمر قفل الروم
        if (message.content === '*lock') {
            if (hasPermission(member, rolePermissions.lockRoleId)) {
                try {
                    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        [PermissionsBitField.Flags.SendMessages]: false
                    });
                    await message.channel.send('تم قفل الروم، لا يمكن لأحد الكتابة الآن.');
                    await message.delete(); // حذف الرسالة التي تحتوي على الأمر
                } catch (error) {
                    console.error('Error while locking the text channel:', error);
                }
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر فتح الروم
        else if (message.content === '*unlock') {
            if (hasPermission(member, rolePermissions.lockRoleId)) {
                try {
                    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        [PermissionsBitField.Flags.SendMessages]: true
                    });
                    await message.channel.send('تم فتح الروم، يمكن للجميع الكتابة الآن.');
                    await message.delete(); // حذف الرسالة التي تحتوي على الأمر
                } catch (error) {
                    console.error('Error while unlocking the text channel:', error);
                }
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر إخفاء الروم
        else if (message.content === '*hide') {
            if (hasPermission(member, rolePermissions.hideRoleId)) {
                try {
                    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        [PermissionsBitField.Flags.ViewChannel]: false
                    });
                    await message.channel.send('تم إخفاء الروم، لا يمكن لأحد رؤيته الآن.');
                    await message.delete(); // حذف الرسالة التي تحتوي على الأمر
                } catch (error) {
                    console.error('Error while hiding the text channel:', error);
                }
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر إظهار الروم
        else if (message.content === '*show') {
            if (hasPermission(member, rolePermissions.hideRoleId)) {
                try {
                    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                        [PermissionsBitField.Flags.ViewChannel]: true
                    });
                    await message.channel.send('تم إظهار الروم، يمكن للجميع رؤيته الآن.');
                    await message.delete(); // حذف الرسالة التي تحتوي على الأمر
                } catch (error) {
                    console.error('Error while showing the text channel:', error);
                }
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر إعطاء تحذير
        else if (message.content.startsWith('*warn')) {
            if (hasPermission(member, rolePermissions.warnRoleId)) {
                const args = message.content.split(' ');
                if (args.length < 3) {
                    return await message.reply('الرجاء استخدام الصيغة الصحيحة: *warn <user id> <سبب التحذير>');
                }
                const userId = args[1];
                const reason = args.slice(2).join(' ') || 'لا يوجد سبب محدد';
                const warnMember = await message.guild.members.fetch(userId).catch(() => null);
                if (!warnMember) {
                    return await message.reply('المستخدم غير موجود في هذا السيرفر.');
                }
                const warnEmbed = new EmbedBuilder()
                    .setTitle('تحذير')
                    .addFields([
                        { name: 'المستخدم:', value: `<@${userId}>`, inline: true },
                        { name: 'السبب:', value: reason, inline: true }
                    ])
                    .setColor('#ffcc00');
                
                // إرسال رسالة إلى القناة المخصصة للتحذيرات
                const warnChannel = message.guild.channels.cache.get(warnChannelId);
                if (warnChannel) {
                    await warnChannel.send({ embeds: [warnEmbed] });
                }

                // إرسال رسالة تحذير للمستخدم عبر DM
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

                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر وضع الصمت
        else if (message.content.startsWith('*time')) {
            if (hasPermission(member, rolePermissions.muteRoleId)) {
                const args = message.content.split(' ');
                if (args.length < 3) {
                    return await message.reply('الرجاء استخدام الصيغة الصحيحة: *time <user id> <مدة وضع الصمت>');
                }
                const userId = args[1];
                const duration = args[2];
                const timeDuration = ms(duration);
                if (!timeDuration) {
                    return await message.reply('المدة غير صالحة. يرجى إدخال مدة صالحة.');
                }
                const muteMember = await message.guild.members.fetch(userId).catch(() => null);
                if (!muteMember) {
                    return await message.reply('المستخدم غير موجود في هذا السيرفر.');
                }
                try {
                    await muteMember.timeout(timeDuration, 'الصمت من قبل البوت');
                    await message.reply(`تم وضع المستخدم ${muteMember.user.tag} في وضع الصمت لمدة ${duration}.`);
                } catch (error) {
                    console.error('Error while timing out the member:', error);
                    await message.reply('حدث خطأ أثناء وضع المستخدم في وضع الصمت.');
                }

                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر إلغاء وضع الصمت
        else if (message.content.startsWith('*untime')) {
            if (hasPermission(member, rolePermissions.unmuteRoleId)) {
                const userId = message.content.split(' ')[1];
                const unmuteMember = await message.guild.members.fetch(userId).catch(() => null);
                if (!unmuteMember) {
                    return await message.reply('المستخدم غير موجود في هذا السيرفر.');
                }
                try {
                    await unmuteMember.timeout(null, 'إلغاء وضع الصمت من قبل البوت');
                    await message.reply(`تم إلغاء وضع الصمت عن المستخدم ${unmuteMember.user.tag}.`);
                } catch (error) {
                    console.error('Error while unmuting the member:', error);
                    await message.reply('حدث خطأ أثناء إلغاء وضع الصمت عن المستخدم.');
                }

                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
       
        // أمر إرسال رسالة محددة
        else if (message.content.startsWith('*say')) {
            if (hasPermission(member, rolePermissions.sayRoleId)) {
                const messageContent = message.content.slice(5);
                await message.channel.send(messageContent);
                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر عرض سرعة الاستجابة
        else if (message.content === '*ping') {
            const ping = client.ws.ping;
            await message.reply(`سرعة استجابة البوت: ${ping}ms`);
            await message.delete(); // حذف الرسالة التي تحتوي على الأمر
        }
        // أمر إلغاء حظر المستخدم
        else if (message.content.startsWith('*unban')) {
            if (hasPermission(member, rolePermissions.unbanRoleId)) {
                const userId = message.content.split(' ')[1];
                try {
                    await message.guild.bans.remove(userId);
                    await message.reply(`تم إلغاء حظر المستخدم ${userId}.`);
                } catch (error) {
                    console.error('Error while unbanning the user:', error);
                    await message.reply('حدث خطأ أثناء إلغاء حظر المستخدم.');
                }

                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر حظر المستخدم
        else if (message.content.startsWith('*ban')) {
            if (hasPermission(member, rolePermissions.banRoleId)) {
                const args = message.content.split(' ');
                if (args.length < 3) {
                    return await message.reply('الرجاء استخدام الصيغة الصحيحة: *ban <user id> <سبب الحظر>');
                }
                const userId = args[1];
                const reason = args.slice(2).join(' ') || 'لا يوجد سبب محدد';
                const banMember = await message.guild.members.fetch(userId).catch(() => null);
                if (!banMember) {
                    return await message.reply('المستخدم غير موجود في هذا السيرفر.');
                }
                try {
                    await message.guild.bans.create(userId, { reason });
                    await message.reply(`تم حظر المستخدم ${banMember.user.tag} بسبب: ${reason}`);
                } catch (error) {
                    console.error('Error while banning the user:', error);
                    await message.reply('حدث خطأ أثناء حظر المستخدم.');
                }

                await message.delete(); // حذف الرسالة التي تحتوي على الأمر
            } else {
                await message.reply('ليس لديك صلاحية استخدام هذا الأمر.');
            }
        }
        // أمر إرسال صورة عند ذكر "خط"
        else if (message.content.includes('خط')) {
            if (!hasSentImage) {
                try {
                    await message.channel.send('https://media.discordapp.net/attachments/1277539656472203318/1278607552111968319/1128356761963864104.webp?ex=66d16b93&is=66d01a13&hm=f97d7146ff545fa3e238a7767c70983d1a3938c3a3f75d2d4e0513094f44a67f&=&format=webp');
                    hasSentImage = false; // تأكد من إرسال الصورة مرة واحدة فقط
                } catch (error) {
                    console.error('Error while sending image:', error);
                }
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    // تجاهل الرسائل التي يرسلها البوت نفسه
    if (message.author.bot) return;

    // تحقق مما إذا كانت الرسالة هي الأمر *server
    if (message.content === '*server') {
        const guild = message.guild;
        const owner = await guild.fetchOwner(); // تأكد من أن هذه السطر داخل دالة async

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

        // إرسال رسالة الإيمبد
        message.channel.send({ embeds: [embed] });
    }
});

client.on('messageCreate', async message => {
    // التحقق من الأمر *come
    if (message.content.startsWith('*come')) {
        const args = message.mentions.users.first();

        if (!args) {
            return message.reply('الرجاء منشن الشخص الذي تريد دعوته.');
        }

        const targetUser = args;
        const channelMention = `<#${message.channel.id}>`;

        try {
            await targetUser.send(`عزيزي العضو، يرجى التوجه إلى ${channelMention}.\n${message.author}`);
            message.channel.send(`تم إرسال الدعوة إلى ${targetUser.tag}.`);
        } catch (error) {
            console.error('Error sending DM:', error);
            message.channel.send(`لم أتمكن من إرسال الرسالة الخاصة إلى ${targetUser.tag}.`);
        }
    }
});

client.login(token);
