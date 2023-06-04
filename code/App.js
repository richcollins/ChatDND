class App {
    setup() {
        this.settings = JSON.parse(localStorage.chatDndAppSettings || "{}");

        document.addEventListener("DOMContentLoaded", e => { this.start() });
    }

    start() {
        document.getElementById('system-message').value = this.settings.systemMessage || Fixtures.systemMessage || "";

        this.player = new Player();
        this.player.characterSheet = Fixtures.characterSheet;

        this.conversationView = new ConversationView();
        this.conversationView.setup();

        if (!this.settings.conversation) {
            const mv = this.conversationView.addNewMessageView();
            mv.role = "user";
            mv.metaData = { "character-sheets": [this.player.characterSheet] };
            mv.dialogTextArea.blur();
        }
    }

    saveSettings() {
        localStorage.chatDndAppSettings = JSON.stringify(this.settings);
    }

    resetSettings() {
        this.settings = {}
        this.saveSettings();
    }
}

App.shared = new App();
App.shared.setup();