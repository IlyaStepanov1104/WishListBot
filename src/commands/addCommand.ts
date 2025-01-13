import {AddStepsEnum, Bot, BotCommandType} from "../entities/Bot.ts";
import {Message} from "node-telegram-bot-api";
import {isAdmin} from "../helpers/isAdmin.ts";
import {Logger} from "../entities/Logger.ts";
import {Item} from "../entities/Item.ts";
import {getInlineKeyboard, getTextForItem} from "./listCommand.ts";
import {escapeMarkdownV2} from "../helpers/escape.ts";

export const getAddCommand: BotCommandType =
    (bot: Bot) =>
        (message: Message) => {
            if (!isAdmin(message.from?.username)) {
                bot.sendMessage(message.chat.id, 'Ошибка: недопустимая команда')
                return;
            }

            bot.addStatus.step = AddStepsEnum.Name

            bot.sendMessage(message.chat.id, 'Отлично\nПришлите название товара:', message.from?.username).catch((err: Error) => {
                Logger.log(err)
            });
        };

export const getNameCommand: BotCommandType = (bot: Bot) =>
    (message: Message) => {
        if (!isAdmin(message.from?.username) || bot.addStatus.step !== AddStepsEnum.Name) {
            bot.sendMessage(message.chat.id, 'Ошибка: недопустимая команда')
            return;
        }

        bot.addStatus.step = AddStepsEnum.Price;
        bot.addStatus.name = escapeMarkdownV2(message.text || '');

        bot.sendMessage(message.chat.id, 'Отлично\nПришлите стоимость товара:', message.from?.username).catch((err: Error) => {
            Logger.log(err)
        });
    };

export const getPriceCommand: BotCommandType = (bot: Bot) =>
    (message: Message) => {
        if (!isAdmin(message.from?.username) || bot.addStatus.step !== AddStepsEnum.Price) {
            bot.sendMessage(message.chat.id, 'Ошибка: недопустимая команда')
            return;
        }

        bot.addStatus.step = AddStepsEnum.Link;
        bot.addStatus.price = escapeMarkdownV2(message.text || '');

        bot.sendMessage(message.chat.id, 'Отлично\nПришлите ссылку на товар:', message.from?.username).catch((err: Error) => {
            Logger.log(err)
        });
    };

export const getLinkCommand: BotCommandType = (bot: Bot) =>
    (message: Message) => {
        if (!isAdmin(message.from?.username) || bot.addStatus.step !== AddStepsEnum.Link) {
            bot.sendMessage(message.chat.id, 'Ошибка: недопустимая команда')
            return;
        }

        bot.addStatus.step = AddStepsEnum.Image;
        bot.addStatus.link = message.text;

        bot.sendMessage(message.chat.id, 'Отлично\nПришлите *одно* изображение товара:', message.from?.username).catch((err: Error) => {
            Logger.log(err)
        });
    };

export const getImageCommand: BotCommandType = (bot: Bot) =>
    async (message: Message) => {
        const img = message.photo;
        if (!isAdmin(message.from?.username) || bot.addStatus.step !== AddStepsEnum.Image || img === undefined) {
            bot.sendMessage(message.chat.id, 'Ошибка: недопустимая команда');
            return;
        }

        const file = await bot.downloadFile(img[img.length - 1].file_id);

        bot.addStatus.step = AddStepsEnum.Default;

        const item = bot.addItem({
            image: file,
            name: bot.addStatus.name || '',
            price: bot.addStatus.price || '',
            link: bot.addStatus.link || ''
        });

        bot.sendImage(message.chat.id, item.image, 'Успешно добавлен товар\n' + getTextForItem(item), message.from?.username).catch((err: Error) => {
            Logger.log(err)
        });
    };