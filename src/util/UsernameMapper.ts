import {ApiClient} from "@twurple/api";

export class UsernameMapper {
    private apiClient: ApiClient | null = null;
    private usernameMap: Map<string, string> = new Map<string, string>();

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    async fetchUserId(username: string, force = false): Promise<string | null> {
        const cachedId = this.usernameMap.get(username);
        if (cachedId && !force) {
            return cachedId;
        }

        const users = await this.apiClient!!.users.getUsersByNames([username]);
        if (users.length > 0) {
            const helixUser = users[0];
            const userId = helixUser.id;
            this.usernameMap.set(username, userId);
            return userId;
        }

        return null;
    }
}