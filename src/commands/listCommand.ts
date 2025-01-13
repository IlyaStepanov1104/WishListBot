import {Bot, BotCommandType} from "../entities/Bot";
import {InlineKeyboardMarkup, Message} from "node-telegram-bot-api";
import {isAdmin} from "../helpers/isAdmin.ts";
import {Logger} from "../entities/Logger.ts";
import {Item} from "../entities/Item.ts";

export const getTextForItem = (item: Item) => {
    return `Название: ${item.name}\n`
        + `Стоимость: ${item.price}\n`
        + `[ССЫЛКА](${item.link})`
};

export const getInlineKeyboard = (item: Item, isAdmin: boolean): InlineKeyboardMarkup => {
    return isAdmin ? {
        inline_keyboard: [
            [
                // {
                //     text: 'Редактировать',
                //     callback_data: `/edit?id=${item.id}`
                // },
                {
                    text: 'Удалить',
                    callback_data: `/delete?id=${item.id}`
                },
            ]
        ]
    } : {
        inline_keyboard: [[{
            text: 'Забронировать',
            callback_data: `/reserve?id=${item.id}`
        }]]
    };
};

export const getListCommand: BotCommandType =
    (bot: Bot) =>
        (message: Message) => {
            const admin = isAdmin(message.from?.username);
            const wishList = Object.values(bot.wishList).filter((item) => !item.reserved || admin);
            if (wishList.length === 0) {
                bot.sendMessage(message.chat.id, 'Виш лист пуст 🥲', message.from?.username)
                return;
            }

            console.log("%c 1 --> Line: 46||listCommand.ts\n wishList: ", "color:#f0f;", wishList);


            wishList.forEach((value) => {
                bot.sendImage(message.chat.id, value.image, getTextForItem(value), message.from?.username, getInlineKeyboard(value, isAdmin(message.from?.username))).catch((err: Error) => {
                    Logger.log(err)
                });
            });
        }
