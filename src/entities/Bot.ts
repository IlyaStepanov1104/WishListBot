import TelegramBot, {
    InlineKeyboardMarkup,
    KeyboardButton,
    Message, User,
} from "node-telegram-bot-api";
import {getStartCommand} from "../commands/startCommand.ts";
import {Logger} from "./Logger.ts";
import {ISimpleItem, Item} from "./Item.ts";
import {promises as fsPromises} from 'fs';
import {isAdmin} from "../helpers/isAdmin.ts";
import {getListCommand} from "../commands/listCommand.ts";
import {
    getAddCommand,
    getImageCommand,
    getLinkCommand,
    getNameCommand,
    getPriceCommand
} from "../commands/addCommand.ts";
import {getMyListCommand} from "../commands/myListCommand.ts";

export type BotCommandType = (bot: Bot) => (message: Message) => any;

const addKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
        [{text: 'Отмена', callback_data: 'removeAdd'}],
    ]
};

const adminKeyboard: KeyboardButton[][] = [
    [{text: 'Вишлист'}, {text: 'Добавить'}],
    [{text: 'Помощь'}],
];

const userKeyboard: KeyboardButton[][] = [
    [{text: 'Вишлист'}, {text: 'Забронировано'}],
    [{text: 'Помощь'}]
];

const IMAGE_DIR = 'data/images'

export enum AddStepsEnum {
    Default,
    Name,
    Price,
    Link,
    Image
}

type QueryCallbackArgs = {
    bot: Bot,
    id: string,
    user: User
};

export class Bot {
    private bot: TelegramBot;
    wishList: Record<ISimpleItem['id'], Item>;
    maxItemId: number;
    addStatus: {
        step: AddStepsEnum,
        name?: Item['name'],
        price?: Item['price'],
        link?: Item['link']
    } = {step: AddStepsEnum.Default};

    private COMMANDS: Record<string, BotCommandType> = {
        '/start': getStartCommand,
        'Помощь': getStartCommand,
        'Вишлист': getListCommand,
        'Добавить': getAddCommand,
        'Забронировано': getMyListCommand
    };

    private QUERY_CALLBACKS: { name: RegExp, callback: (args: QueryCallbackArgs) => void }[] = [
        {name: /\/edit\?id=(\d+)$/, callback: this.editItem},
        {name: /\/delete\?id=(\d+)$/, callback: this.deleteItem},
        {name: /\/reserve\?id=(\d+)$/, callback: this.reserveItem},
        {name: /\/cancel_reserve\?id=(\d+)$/, callback: this.cancelReserveItem},
        {name: /removeAdd/, callback: this.removeSteps}
    ];

    private readonly wishListPath: string;


    constructor(token: string, wishListPath: string) {
        this.bot = new TelegramBot(token, {polling: true});

        this.wishList = {};
        this.maxItemId = 0;
        this.wishListPath = wishListPath;

        this.initializeWishList();
    }

    async initializeWishList() {
        try {
            const dataFromWishList = await fsPromises.readFile(this.wishListPath, 'utf8');
            const data: ISimpleItem[] = JSON.parse(dataFromWishList);
            data.forEach(item => {
                this.wishList[item.id] = item
                this.maxItemId = Math.max(this.maxItemId, item.id)
            })

        } catch (error) {
            console.error('Ошибка при чтении файла:', error);
            this.initializeWishList();
        }
    }

    async saveWishList() {
        try {
            const itemsArray = Object.values(this.wishList);
            const data = JSON.stringify(itemsArray, null, 2);

            await fsPromises.writeFile(this.wishListPath, data);
            console.log("%c 1 --> Line: 113||Bot.ts\n this.wishListPath: ","color:#f0f;", this.wishListPath);
            console.log('wishList успешно сохранен в файл:', this.wishListPath);
        } catch (err) {
            console.error('Ошибка при записи файла:', err);
        }
    }

    sendMessage(chatId: string | number, text: string, username?: string) {
        let keyboard = isAdmin(username) ? adminKeyboard : userKeyboard;
        const inline_keyboard = isAdmin(username) && this.addStatus.step !== AddStepsEnum.Default ? addKeyboard : null;

        return this.bot.sendMessage(chatId, text, {
            reply_markup: inline_keyboard ? inline_keyboard : {
                keyboard,
                resize_keyboard: true,
                is_persistent: true,
                input_field_placeholder: 'Выберите команду',
            },
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
            disable_notification: true
        });
    }

    sendImage(chatId: string | number, imagePath: string, text: string, username?: string, inline_keyboard?: InlineKeyboardMarkup) {
        const keyboard = isAdmin(username) ? adminKeyboard : userKeyboard;

        return this.bot.sendPhoto(chatId, imagePath, {
            caption: text,
            reply_markup: inline_keyboard ? inline_keyboard : {
                keyboard,
                resize_keyboard: true,
                is_persistent: true,
                input_field_placeholder: 'Выберите команду',
            },
            parse_mode: 'MarkdownV2',
            disable_notification: true
        });
    }

    downloadFile(fileId: string) {
        return this.bot.downloadFile(fileId, IMAGE_DIR)
    }

    start() {
        this.bot.on("polling_error", console.info);

        this.bot.on("message", message => {
            Logger.log(message)
            switch (this.addStatus.step) {
                case AddStepsEnum.Default:
                    return;

                case AddStepsEnum.Name:
                    getNameCommand(this)(message);
                    return;

                case AddStepsEnum.Price:
                    getPriceCommand(this)(message);
                    return;

                case AddStepsEnum.Link:
                    getLinkCommand(this)(message);
                    return;

                case AddStepsEnum.Image:
                    getImageCommand(this)(message);
                    return;
            }
        })

        this.bot.on("callback_query", message => {
            Logger.log(message);

            const query = message.data;

            this.QUERY_CALLBACKS.forEach(({name, callback}) => {
                const match = query?.match(name);
                if (match) {
                    callback({id: match[1], bot: this, user: message.from});
                    if (message.message?.chat.id) {
                        this.sendMessage(message.message?.chat.id, 'Действие успешно выполнено', message.from?.username);
                    }
                }
            })
        })

        Object.entries(this.COMMANDS).forEach(([name, command]) => {
            this.bot.onText(new RegExp(name), command(this))
        })
    }

    editItem() {
    }

    deleteItem({bot, id}: QueryCallbackArgs) {
        delete bot.wishList[parseInt(id)];
        bot.saveWishList();
    }

    reserveItem({id, bot, user}: QueryCallbackArgs) {
        bot.wishList[parseInt(id)].reserved = user;
        bot.saveWishList();
    }

    cancelReserveItem({id, bot}: QueryCallbackArgs) {
        bot.wishList[parseInt(id)].reserved = null;
        bot.saveWishList();
    }

    removeSteps({bot}: QueryCallbackArgs) {
        bot.addStatus = {step: AddStepsEnum.Default};
    }

    addItem({image, price, name, link}: { image: string; price: any; name: any; link: any }) {
        const id = ++this.maxItemId;
        this.wishList[id] = new Item({id, name, price, link, image, reserved: null});
        this.saveWishList();
        return this.wishList[id];
    }
}