import {User} from "node-telegram-bot-api";

export interface ISimpleItem {
    id: number;
    name: string;
    image: string;
    link: string;
    price: string;
    reserved: User | null;
}

export class Item implements ISimpleItem {
    id;
    name;
    image;
    link;
    price;
    reserved;


    constructor({id, name, image, link, price, reserved}: ISimpleItem) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.link = link;
        this.price = price;
        this.reserved = reserved;
    }
}