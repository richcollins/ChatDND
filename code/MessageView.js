class MessageView {
    constructor() {
        this.element = null;
        this.message = new ChatMessage();
        this.conversationView = null;
    }

    get metaDataTextArea() {
        return this.element.getElementsByClassName("metadata")[0];
    }

    get dialogTextArea() {
        return this.element.getElementsByClassName("dialog")[0];
    }

    get roleDiv() {
        return this.element.getElementsByClassName('message-role')[0];
    }

    set role(role) {
        this.message.role = role;
        this.roleDiv.innerHTML = role;
        if (role == "user") {
            this.roleDiv.style["margin-left"] = "31px";
        }
    }

    set metaData(metaData) {
        this.message.metaData = metaData;
        this.metaDataTextArea.value = JSON.stringify(metaData);
        this.sizeTextAreasToFit();
    }

    set dialog(dialog) {
        this.message.dialog = dialog;
        this.dialogTextArea.value = dialog;
        this.sizeTextAreasToFit();
    }

    get json() {
        return {
            role: this.message.role,
            content: [this.metaDataTextArea.value, this.dialogTextArea.value].join("\n")
        }
    }

    setupFromJson(json) {
        this.role = json.role;
        const content = json.content.split("\n");
        this.metaDataTextArea.value = content[0];
        this.dialogTextArea.value = content.slice(1).join("\n");
        this.sizeTextAreasToFit();
    }
  
    createElement() {
        this.element = document.createElement('div');
        this.element.innerHTML = document.getElementById('message-template').innerHTML.trim();
        var self = this;
        this.element.querySelector('.remove-message').addEventListener('click', () => {
            self.remove();
        });
        this.setup();
    }

    remove() {
        this.conversationView.removeMessageView(this);
        this.element.remove();
        this.contentDidChange();
    }
  
    setup() {
        this.element.dataset.messageView = this;
        var self = this;
        this.dialogTextArea.onchange = () => {
            self.contentDidChange();
        };
        this.metaDataTextArea.onchange = () => {
            self.contentDidChange();
        };
    }

    contentDidChange() {
        App.shared.settings.conversation = JSON.stringify(this.conversationView.messagesJson);
        App.shared.saveSettings();
        this.sizeTextAreasToFit();
    }

    updateMessage() {
        this.message.dialog = this.dialogTextArea.value;
        this.message.metaData = JSON.parse(this.metaDataTextArea.value);
    }

    sizeTextAreasToFit() {
        this.sizeTextAreaToFit(this.metaDataTextArea);
        this.sizeTextAreaToFit(this.dialogTextArea);
    }

    sizeTextAreaToFit(textArea) {
        textArea.style.height = 'auto';
        textArea.style.height = textArea.scrollHeight+'px';
    }
  }