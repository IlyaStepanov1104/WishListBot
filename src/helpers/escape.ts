export const escapeMarkdownV2 = (msg: string): string => {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

    specialChars.forEach(char => {
        const regex = new RegExp(`\\${char}`, 'g');
        msg = msg.replace(regex, `\\${char}`);
    });

    return msg;
}