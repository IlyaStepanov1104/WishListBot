const ADMIN_USERNAMES: string[] = ['d22k9'];

export const isAdmin = (username: string|undefined): boolean => {
    return Boolean(username && ADMIN_USERNAMES.includes(username));
}