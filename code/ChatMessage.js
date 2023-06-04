class ChatMessage {
    constructor() {
        this.role = "user";
        this.metaData = {};
        this.dialog = "";
    }

    get json() {
        return {
            role: this.role,
            content: [JSON.stringify(this.metaData), this.dialog].join("\n")
        }
    }
}