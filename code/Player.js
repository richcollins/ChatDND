class Player {
    constructor() {
        this.characterSheet = null;
    }

    get characterName() {
        return this.characterSheet.name;
    }
}