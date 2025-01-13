import {Bot, BotCommandType} from "../entities/Bot";
import {InlineKeyboardMarkup, Message} from "node-telegram-bot-api";
import {Logger} from "../entities/Logger.ts";
import {Item} from "../entities/Item.ts";
import {getTextForItem} from "./listCommand.ts";

export const getInlineKeyboard = (item: Item): InlineKeyboardMarkup => {
    return {
        inline_keyboard: [[{
            text: 'Отменить бронь',
            callback_data: `/cancel_reserve?id=${item.id}`
        }]]
    };
};

export const getMyListCommand: BotCommandType =
    (bot: Bot) =>
        (message: Message) => {
            const wishList = Object.values(bot.wishList).filter((item) => item.reserved?.id === message.from?.id);
            if (wishList.length === 0) {
                bot.sendMessage(message.chat.id, 'Вы выбрали 0 подарков 🥲', message.from?.username)
                return;
            }


            wishList.forEach((value) => {
                bot.sendImage(message.chat.id, value.image, getTextForItem(value), message.from?.username, getInlineKeyboard(value)).catch((err: Error) => {
                    Logger.log(err)
                });
            });
        }
