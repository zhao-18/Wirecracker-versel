export {demoContactData}

function contact (loc, mark, surgeonMark) {
    this.associatedLocation = loc;
    this.mark = mark;
    this.surgeonMark = surgeonMark;
}

contact.prototype = {
    constructor: contact,

    isMarked: function() {
        return this.mark || this.surgeonMark;
    }
}

/*

 Demo purpose during development

 */
let demoContactData = [
    {
        label: "D'",
        contacts: [
            new contact("Loc1", 1, false),
            new contact("Loc1", 1, false),
            new contact("Loc2", 0, false),
            new contact("Loc2", 0, false),
            new contact("Loc2", 0, true),
            new contact("Loc2", 0, true),
            new contact("Loc3", 2, false),
            new contact("Loc3", 2, false),
        ]
    },
    {
        label: "C'",
        contacts: [
            new contact("Loc4", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 0, false),
            new contact("Loc5", 0, false),
            new contact("Loc5", 0, true),
            new contact("Loc6", 2, false),
            new contact("Loc6", 2, false),
            new contact("Loc6", 0, true),
        ]
    },
    {
        label: "L'",
        contacts: [
            new contact("Loc7", 1, false),
            new contact("Loc7", 1, true),
            new contact("Loc7", 2, false),
            new contact("Loc8", 0, true),
            new contact("Loc8", 2, true),
            new contact("Loc8", 1, false),
            new contact("Loc8", 1, false),
            new contact("Loc9", 2, true),
            new contact("Loc9", 0, true),
            new contact("Loc9", 0, false),
            new contact("Loc0", 2, false),
            new contact("Loc0", 2, false),
        ]
    },
]



