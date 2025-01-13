import * as fs from "node:fs";

export class Logger {
    static logFilePath = 'log/runtime.log';

    static formatTimestamp(date: Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const year = String(date.getFullYear());
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${day}.${month}.${year} [${hours}:${minutes}:${seconds}]`;
    }

    static log(data: any) {
        const timestamp = this.formatTimestamp(new Date());

        // Преобразуем объект в строку JSON
        const logEntry = `${timestamp} -> ${JSON.stringify(data)}\n\n`;

        // Записываем лог в файл
        fs.appendFile(this.logFilePath, logEntry, () => {});
    }
}