const { Scenes , Telegraf, Markup, Composer, session , Stage } = require('telegraf');
const {Sequelize, DataTypes, CITEXT } = require('sequelize');
const { or } = require('sequelize');
const axios = require('axios');

const bot = new Telegraf('6638193021:AAFhmCmk45Q_gV2KCDh7cVMsRYmOatYDnn4');
console.log('Bot avviato!')


const sequelize = new Sequelize('database', 'nomedatabase', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'PromemoriaChat/database.sqlite',
});

sequelize.sync();

const DataBase = sequelize.define('database1', {
    chatID: {
        type: DataTypes.INTEGER,
        defaultValue: null
    },
    alerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    onlyadmins: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
})

const Promemoria = sequelize.define('promemorie', {
    chatID: {
        type: DataTypes.INTEGER,
        defaultValue: null
    },
    usertelegram: {
        type: DataTypes.STRING,
    },
    messaggiopromemoria: {
        type: DataTypes.STRING,
    },
    orario: {
        type: DataTypes.STRING,
    }
})

process.on('uncaughtException', err => {
    console.log(err)
})

// ``

bot.start(async(ctx) => {
    if(ctx.message.chat.type != "private") return;
    ctx.replyWithHTML(`👋 <b>Hey @${ctx.from.username}</b>\nBenvenuto nel <b><a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>, questo bot ti aiuterà a impostare delle promemoria in una <b>chat!</b>\n\n💭 <b>Aggiungimi</b> ad una chat, mettimi <b>Amministratore</b> ed esegui il comando /promemoria.\n\n❕Per vedere le <b>funzionalità</b> di questo bot esegui il comando /tutorial.`, {
        reply_markup: {
            inline_keyboard: [
                [{text: '➕ Aggiungimi ad un Gruppo ➕', url: "https://t.me/PromemoriaChatBot?startgroup=true"}],
                [{text: '🔧 Supporto', callback_data: "supporto"}],
            ]
        }
    })
})

bot.action('home', async (ctx) => {
    ctx.editMessageText(`👋 <b>Hey @${ctx.from.username}</b>\nBenvenuto nel <b><a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>, questo bot ti aiuterà a impostare delle promemoria in una <b>chat!</b>\n\n💭 <b>Aggiungimi</b> ad una chat, mettimi <b>Amministratore</b> ed esegui il comando /promemoria.\n\n❕Per vedere le <b>funzionalità</b> di questo bot esegui il comando /tutorial.`, {
        reply_markup: {
            inline_keyboard: [
                [{text: '➕ Aggiungimi ad un Gruppo ➕', url: "https://t.me/PromemoriaChatBot?startgroup=true"}],
                [{text: '🔧 Supporto', callback_data: "supporto"}],
            ]
        }, parse_mode: 'HTML'
    })
})

bot.action('supporto', async (ctx) => {
    ctx.editMessageText(`👨‍💻 | <b>Supporto <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<i>📞 | Per qualsiasi tipo di Supporto riguardante il bot, bugs, rivolgersi a @Dqrko.</i>`, {
        reply_markup: {
            inline_keyboard: [
                [{text: '🔙 Indietro', callback_data: "home"}]
            ]
        }, parse_mode: 'HTML'
    })
})

// comandi

bot.command('tutorial', async (ctx) => {
    ctx.replyWithHTML(`💡 | <b>Istruzioni <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\nIl bot permette di creare <b>promemoria</b>, con il <b>comando</b> /promemoria, che verranno <b>salvate</b> con degli orari e minuti precisi.\n\n🏷️ Il bot si occuperà di mandare un <b>messaggio</b> nel gruppo all'orario e minuto indicato, <b>semplice e veloce.</b>\n\nSarà possibile vedere la lista delle <b>promemoria in attesa</b>, con il comando /promemorialist.\n\n⚙️ Sarà possibile <b>attivare o disattivare</b> gli Alerts con il <b>comando</b> /impostazioni.`)
})

bot.command('impostazioni', async (ctx) => {
    if(ctx.message.chat.type != "group" && ctx.message.chat.type != "supergroup") return;
    const checkrank = await bot.telegram.getChatMember(ctx.update.message.chat.id, ctx.update.message.from.id);

    if(checkrank.status === "administrator" || checkrank.status === "creator") {
        const checkchat = await DataBase.findOne({ where: { chatID: ctx.update.message.chat.id }})
        let statusalert = "<b>🟡 Stato Attuale:</b> ";
        let statusonlyadmin = "<b>➕ Accesso al Comando:</b> ";
        if(!checkchat) {
            DataBase.create({ chatID: ctx.update.message.chat.id })
            statusalert += 'Attivi';
            statusonlyadmin += "Tutti i Membri";
        } else {
            if(checkchat.alerts == true) {
                statusalert += 'Attivi';
            } else {
                statusalert += 'Disattivi';
            }
            if(checkchat.onlyadmins == true) {
                statusonlyadmin += "Solo Admin";
            } else {
                statusonlyadmin += "Tutti i Membri";
            }
        }
        ctx.replyWithHTML(`<b>🔧 | Impostazioni Promemoria Bot</b>\n\n🔘 | <i>Utilizza i tasti sottostanti per attivare o disattivare gli alerts o mettere onlyadmins (solo gli admin posso impostare promemoria)</i>\n\n<b>Gli Alerts</b> avvisano, in fine giornata, la <b>cancellazione</b> delle promemoria in attesa di quella chat.\n\n${statusalert}\n${statusonlyadmin}`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: '☑️ Alerts', callback_data: "alertstime"}],
                    [{text: '🛃 OnlyAdmins', callback_data: "onlyadminssetting"}],
                ]
            }
        })
    }
})

bot.action('alertstime', async (ctx) => {
    const checkrank = await bot.telegram.getChatMember(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.from.id);
    
    if(checkrank.status === "administrator" || checkrank.status === "creator") {
        const checkchat = await DataBase.findOne({ where: { chatID: ctx.callbackQuery.message.chat.id }})
        let statusalert = "<b>🟡 Stato Attuale:</b> ";
        let statusonlyadmin = "<b>➕ Accesso al Comando:</b> ";
        if(checkchat) {
            if(checkchat.alerts == true) {
                DataBase.update({ alerts: false}, {where: {chatID: ctx.callbackQuery.message.chat.id }})
                statusalert += "Disattivi";
            } else {
                DataBase.update({ alerts: true}, {where: {chatID: ctx.callbackQuery.message.chat.id }})
                statusalert += "Attivi";
            }
            if(checkchat.onlyadmins == true) {
                statusonlyadmin += "Solo Admin";
            } else {
                statusonlyadmin += "Tutti i Membri";
            }
            ctx.editMessageText(`<b>🔧 | Impostazioni Promemoria Bot</b>\n\n🔘 | <i>Utilizza i tasti sottostanti per attivare o disattivare gli alerts o mettere onlyadmins (solo gli admin posso impostare promemoria)</i>\n\n<b>Gli Alerts</b> avvisano, in fine giornata, la <b>cancellazione</b> delle promemoria in attesa di quella chat.\n\n${statusalert}\n${statusonlyadmin}`, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: '☑️ Alerts', callback_data: "alertstime"}],
                        [{text: '🛃 OnlyAdmins', callback_data: "onlyadminssetting"}],
                    ]
                }, parse_mode: 'HTML'
            })
        }
    }
})

bot.action('onlyadminssetting', async (ctx) => {
    const checkrank = await bot.telegram.getChatMember(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.from.id);

    if(checkrank.status === "administrator" || checkrank.status === "creator") {
        const checkchat = await DataBase.findOne({ where: { chatID: ctx.callbackQuery.message.chat.id }})
        let statusalert = "<b>🟡 Stato Attuale:</b> ";
        let statusonlyadmin = "<b>➕ Accesso al Comando:</b> ";
        if(checkchat) {
            if(checkchat.onlyadmins == true) {
                DataBase.update({ onlyadmins: false}, {where: {chatID: ctx.callbackQuery.message.chat.id }})
                statusonlyadmin += "Tutti i Membri";
            } else {
                DataBase.update({ onlyadmins: true}, {where: {chatID: ctx.callbackQuery.message.chat.id }})
                statusonlyadmin += "Solo Admin";
            }
            if(checkchat.alerts == true) {
                statusalert += "Attivi";
            } else {
                statusalert += "Disattivi";
            }
            ctx.editMessageText(`<b>🔧 | Impostazioni Promemoria Bot</b>\n\n🔘 | <i>Utilizza i tasti sottostanti per attivare o disattivare gli alerts o mettere onlyadmins (solo gli admin posso impostare promemoria)</i>\n\n<b>Gli Alerts</b> avvisano, in fine giornata, la <b>cancellazione</b> delle promemoria in attesa di quella chat.\n\n${statusalert}\n${statusonlyadmin}`, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: '☑️ Alerts', callback_data: "alertstime"}],
                        [{text: '🛃 OnlyAdmins', callback_data: "onlyadminssetting"}],
                    ]
                }, parse_mode: 'HTML'
            })
        }
    }
})

//

bot.command('promemoria', async (ctx) => {
    if(ctx.message.chat.type != "group" && ctx.message.chat.type != "supergroup") return;
    const checkchat = await DataBase.findOne({ where: { chatID: ctx.update.message.chat.id }})

    if(checkchat) {
        if(checkchat.onlyadmins == true) {
            const checkrank = await bot.telegram.getChatMember(ctx.update.message.chat.id, ctx.update.message.from.id);

            if(checkrank.status === "administrator" || checkrank.status === "creator") {
                const time = ctx.update.message.text.split(' ')[1];
                const messaggio = ctx.message.text.split(' ').slice(2).join(' ');
                if(time == undefined || messaggio == undefined) {
                    ctx.replyWithHTML(`🚫 | <i>Comando non trovato. [ Esempio: /promemoria 13:40 Promemoria Chat Bot ]</i>`)
                    return;
                }
                const tempo = parseTime(time);
                if(!tempo) {
                    ctx.replyWithHTML(`🚫 | <i>Comando non trovato. [ Esempio: /promemoria 13:40 Promemoria Chat Bot ]</i>`)
                    return;
                }
                Promemoria.create({ chatID: ctx.update.message.chat.id, messaggiopromemoria: messaggio, usertelegram: ctx.update.message.from.username, orario: time})
                ctx.replyWithHTML(`🔔 | <b>Promemoria <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<b>🕛 | Orario Programmato:</b> ${time}\n<b>💭 | Messaggio:</b> <i>${messaggio}</i>\n\n@PromemoriaChatBot`)
            } 
        } else {
            const time = ctx.update.message.text.split(' ')[1];
            const messaggio = ctx.message.text.split(' ').slice(2).join(' ');
            if(time == undefined || messaggio == undefined) {
                ctx.replyWithHTML(`🚫 | <i>Comando non trovato. [ Esempio: /promemoria 13:40 Promemoria Chat Bot ]</i>`)
                return;
            }
            const tempo = parseTime(time);
            if(!tempo) {
                ctx.replyWithHTML(`🚫 | <i>Comando non trovato. [ Esempio: /promemoria 13:40 Promemoria Chat Bot ]</i>`)
                return;
            }
            Promemoria.create({ chatID: ctx.update.message.chat.id, messaggiopromemoria: messaggio, usertelegram: ctx.update.message.from.username, orario: time})
            ctx.replyWithHTML(`🔔 | <b>Promemoria <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<b>🕛 | Orario Programmato:</b> ${time}\n<b>💭 | Messaggio:</b> <i>${messaggio}</i>\n\n@PromemoriaChatBot`)

        }
    } else {
        ctx.replyWithHTML(`💭 | <i>Prima di iniziare devi eseguire il comando /impostazioni!</i>`)
    }
})

function parseTime(timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    const time = new Date();
    time.setHours(hour);
    time.setMinutes(minute);
    return time;
}

function formatTime(time) {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

bot.command('promemorialist', async (ctx) => {
    if(ctx.message.chat.type != "group" && ctx.message.chat.type != "supergroup") return;
    const checkchat = await DataBase.findOne({ where: { chatID: ctx.update.message.chat.id }})

    if(checkchat) {
        if(checkchat.onlyadmins == true) {
            const checkrank = await bot.telegram.getChatMember(ctx.update.message.chat.id, ctx.update.message.from.id);

            if(checkrank.status === "administrator" || checkrank.status === "creator") {
                const listapro = await Promemoria.findAll({ where: { chatID: ctx.update.message.chat.id }});
                const numeropro = await Promemoria.count({ where: { chatID: ctx.update.message.chat.id }});

                ctx.replyWithHTML(`🔔 | <b>Promemoria in Attesa <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<b>🟢 | Promemoria Totali:</b> ${numeropro}`)
                if(numeropro == 0) {
                    ctx.replyWithHTML(`<i>✖️| Scansione annullata poichè non ci sono promemoria in attesa.</i>`)
                } else {
                    ctx.replyWithHTML(`<i>🔜 | Inizio scansione...</i>`)
                }

                setTimeout(async() => {
                    let index = 0;
                    const delayBetweenMessages = 3000; 
    
                    const sendNextPromemoria = () => {
                        if (index < listapro.length) {
                            const promemoria = listapro[index];
                            ctx.replyWithHTML(`🔔 | <b>Promemoria in Attesa</b>\n\n<b>🕛 | Orario Programmato:</b> ${promemoria.orario}\n<b>💭 | Messaggio:</b> <i>${promemoria.messaggiopromemoria}</i>`, {
                                reply_markup: {
                                    inline_keyboard: [
                                        [{text: '✖️ Cancella', callback_data: "cancellapromemoria"}]
                                    ]
                                }
                            })
                            index++;
                            setTimeout(sendNextPromemoria, delayBetweenMessages);
                        }
                    };
    
                    sendNextPromemoria();
                }, 4000);
            }
        } else {
            const listapro = await Promemoria.findAll({ where: { chatID: ctx.update.message.chat.id }});
            const numeropro = await Promemoria.count({ where: { chatID: ctx.update.message.chat.id }});

            ctx.replyWithHTML(`🔔 | <b>Promemoria in Attesa <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<b>🟢 | Promemoria Totali:</b> ${numeropro}`)
            if(numeropro == 0) {
                ctx.replyWithHTML(`<i>✖️| Scansione annullata poichè non ci sono promemoria in attesa.</i>`)
            } else {
                ctx.replyWithHTML(`<i>🔜 | Inizio scansione...</i>`)
            }

            setTimeout(async() => {
                let index = 0;
                const delayBetweenMessages = 3000; 

                const sendNextPromemoria = () => {
                    if (index < listapro.length) {
                        const promemoria = listapro[index];
                        ctx.replyWithHTML(`🔔 | <b>Promemoria in Attesa</b>\n\n<b>🕛 | Orario Programmato:</b> ${promemoria.orario}\n<b>💭 | Messaggio:</b> <i>${promemoria.messaggiopromemoria}</i>`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [{text: '✖️ Cancella', callback_data: "cancellapromemoria"}]
                                ]
                            }
                        })
                        index++;
                        setTimeout(sendNextPromemoria, delayBetweenMessages);
                    }
                };

                sendNextPromemoria();
            }, 4000);
        }
    }
})

bot.action('cancellapromemoria', async(ctx) => {
    const checkrank = await bot.telegram.getChatMember(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.from.id);

    if(checkrank.status === "administrator" || checkrank.status === "creator") {
        let messaggiopro = ctx.callbackQuery.message.text.split('💭 | Messaggio: ');
        const checkpro = await Promemoria.findOne({ where: { chatID: ctx.callbackQuery.message.chat.id, messaggiopromemoria: messaggiopro }})

        if(checkpro) {
            Promemoria.destroy({ where: { chatID: ctx.callbackQuery.message.chat.id, messaggiopromemoria: messaggiopro }})
            ctx.answerCbQuery("✔️ | Promemoria cancellato con successo.", {show_alert: true})
        } else {
            ctx.answerCbQuery("✖️ | Promemoria non trovato.", {show_alert: true})
        }
    } else {
        ctx.answerCbQuery("✖️ | Solo gli amministratori possono cancellare un promemoria.", {show_alert: true})
    }
})

async function PostPromemoria() {
    const tuttipro = await Promemoria.findAll();

    tuttipro.forEach((promemoria) => {
        let proOrario = promemoria.orario;
        let datenew = new Date();
        let hours = datenew.getHours();
        let minutes = datenew.getMinutes();

        const checktime = `${hours}:${minutes}:0`
        const posttime = `${proOrario}:0`

        if(checktime === posttime) {
            bot.telegram.sendMessage(promemoria.chatID,`🔔 | <b>Notifica <a href="https://telegra.ph/file/89f8216772bb036acb54f.jpg">Promemoria Bot</a></b>\n\n<b>🕛 | Utente:</b> @${promemoria.usertelegram}\n<b>💭 | Messaggio:</b> <i>${promemoria.messaggiopromemoria}</i>\n\n@PromemoriaChatBot`, {parse_mode: 'HTML'})
            Promemoria.destroy({ where: { chatID: promemoria.chatID, messaggiopromemoria: promemoria.messaggiopromemoria }})
        }
    })
}
setInterval(PostPromemoria, 1000);

/*async function ResetPromemoria() {
    const tuttipro = await Promemoria.findAll()

    tuttipro.forEach(async(promemoria) => {
        const checkalert = await DataBase.findOne({ where: { chatID: promemoria.chatID }})

        if(checkalert) {
            let datenew = new Date();
            let hours = datenew.getHours();
            let minutes = datenew.getMinutes();
    
            const checktime = `${hours}:${minutes}:59`
    
            if(checkalert.alerts == true) {
                if(checktime === "23:59:59") {
                    Promemoria.destroy({ where: { chatID: promemoria.chatID }})
                    bot.telegram.sendMessage(promemoria.chatID, '<i>🧹 | Fine giornata, tutte le promemoria in attesa sono state cancellate.</i>', {parse_mode: 'HTML'})
                }
            } else {
                if(checktime === "23:59:59") {
                    Promemoria.destroy({ where: { chatID: promemoria.chatID }})
                }
            }
        }
    })
}
setInterval(ResetPromemoria, 1000)*/

/*const stage = new Scenes.Stage([depositasoldi]);
bot.use(stage.middleware())*/

bot.launch();