class ConversationView {
    constructor() {
        this.messageViews = [];
    }

    get submitButton() {
        return document.getElementById('submit');
    }

    get addButton() {
        return document.getElementById('add-message');
    }

    get rollButton() {
        return document.getElementById('roll');
    }

    get resetButton() {
        return document.getElementById('reset');
    }

    get apiKeyInput() {
        return document.getElementById('api-key');
    }

    get modelSelect() {
        return document.getElementById('gpt-model');
    }

    get messageContainer() {
        return document.getElementById('message-container');
    }

    get systemMessage() {
        return document.getElementById('system-message')
    }

    get messagesJson() {
        return this.messageViews.map(mv => mv.json);
    }

    setup() {
        var self = this;
        this.submitButton.addEventListener('click', () => {
            self.submitOrCancel();
        });

        this.addButton.addEventListener('click', () => {
            const mv = self.addNewMessageView();
            mv.role = "user";
            mv.metaData = { "character-name": App.shared.player.characterName };
        });

        this.resetButton.addEventListener('click', () => {
            self.reset();
        });

        this.rollButton.addEventListener('click', () => {
            self.roll();
        });

        this.systemMessage.addEventListener('change', () => {
            App.shared.settings.systemMessage = self.systemMessage.value.trim();
            App.shared.saveSettings();
        });

        this.apiKeyInput.addEventListener('change', () => {
            console.log("apiKeyInput");
            App.shared.settings.apiKey = self.apiKeyInput.value.trim();
            App.shared.saveSettings();
        });

        this.modelSelect.addEventListener('change', () => {
            App.shared.settings.gptModel = self.modelSelect.value;
            App.shared.saveSettings();
        });

        this.apiKeyInput.value = App.shared.settings.apiKey || '';
        this.modelSelect.value = App.shared.settings.gptModel || 'gpt-4';

        if (App.shared.settings.conversation) {
            let self = this;
            JSON.parse(App.shared.settings.conversation).forEach((msgJson) => {
                let mv = self.addNewMessageView();
                mv.setupFromJson(msgJson);
            });
        }
    }

    addNewMessageView() {
        const messageView = new MessageView();
        messageView.conversationView = this;
        this.messageViews.push(messageView);
        messageView.createElement();
        this.messageContainer.prepend(messageView.element);
        return messageView;
    }

    removeMessageView(messageView) {
        let i = this.messageViews.indexOf(messageView);
        this.messageViews.splice(i, 1);
    }

    submitOrCancel() {
        if (this.submitButton.textContent === 'Submit') {
            this.submitButton.textContent = 'Cancel';
            this.submitMessages();
        } else {
            this.submitButton.textContent = 'Submit';
            this.abortController.abort();
        }
    }

    async submitMessages() {
        const messages = this.messagesJson;
    
        const systemContent = this.systemMessage.value;
        messages.unshift({ role: 'system', content: systemContent });
    
        try {
            const responseStream = await this.createChat(messages);
            
            const messageView = this.addNewMessageView();
            messageView.role = "assistant";
            messageView.metaDataTextArea.value = "";
            messageView.dialogTextArea.value  = "";
    
            let parsingMetaData = true;

            while (true) {
                const { done, value } = await responseStream.reader.read();
                if (done) {
                    break;
                }

                const chunk = responseStream.decoder.decode(value);
                chunk.split("\n").forEach(line => {
                    let json = line.replace(/^[^{]*data: /, "")
                    if (json !== "" && json !== "[DONE]") {
                        console.log(json);
                        json = JSON.parse(json);
                        if (json.choices) {
                            const content = json.choices[0].delta.content;
                            if (content) {
                                //console.log(content);
                                if (parsingMetaData) {
                                    if (content.includes("\n")) {
                                        parsingMetaData = false;
                                        const splitContent = content.split("\n");
                                        messageView.metaDataTextArea.value += splitContent[0];
                                        messageView.dialogTextArea.value += splitContent.slice(1).join("\n");
                                    }
                                    else {
                                        messageView.metaDataTextArea.value += content;
                                    }
                                }
                                else {
                                    messageView.dialogTextArea.value += content;
                                }
                                messageView.sizeTextAreasToFit();
                            }
                        }
                    }
                });
            }

            messageView.contentDidChange();
            this.submitButton.textContent = 'Submit';
        } catch (error) {
            console.error('Request Failed:', error);
            this.submitButton.textContent = 'Submit';
        }
    }
    
    createChat(messages) {
        const apiKey = this.apiKeyInput.value.trim();
        const url = 'https://api.openai.com/v1/chat/completions';
        this.abortController = new AbortController();
    
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.modelSelect.value,
                messages: messages,
                stream: true
            }),
            signal: this.abortController.signal
        };
    
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(url, options);
    
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
    
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                resolve({ reader, decoder });
    
            } catch (error) {
                reject(error);
            }
        });
    }

    reset() {
        App.shared.resetSettings();
        document.location.reload();
    }

    roll() {
        let mv = this.messageViews[this.messageViews.length - 1];
        mv.updateMessage();

        const requestedRolls = mv.message.metaData["requested-rolls"];
        const performedRolls = requestedRolls.map((rr) => {
            const roll = {};
            roll["rolls"] = [];
            roll["total-with-bonus"] = 0;
            roll["min-with-bonus"] = Number.MAX_SAFE_INTEGER;
            roll["max-with-bonus"] = Number.MIN_SAFE_INTEGER;

            for (let index = 0; index < rr.count; index++) {
                const v = Math.floor(Math.random() * rr.die) + 1;
                roll.rolls.push(v);
                roll["total-with-bonus"] += v;
                roll["max-with-bonus"] = Math.max(v, roll["max-with-bonus"]);
                roll["min-with-bonus"] = Math.min(v, roll["min-with-bonus"]);
            }

            roll["total-with-bonus"] += rr.bonus;

            if (rr.count == 1) {
                delete roll["max-with-bonus"];
                delete roll["min-with-bonus"];
            }
            else {
                roll["max-with-bonus"] += rr.bonus;
                roll["min-with-bonus"] += rr.bonus;
            }

            return roll;
        });

        var rollView = this.addNewMessageView();
        rollView.role = "user";
        rollView.metaData = { "character-name": App.shared.player.characterName, "performed-rolls": performedRolls };
    }


}