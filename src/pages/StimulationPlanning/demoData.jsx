export {demoContactData}

function contact (loc, mark, surgeonMark, pair) {
    this.associatedLocation = loc;
    this.mark = mark;
    this.surgeonMark = surgeonMark;
    this.pair = pair;
    this.isPlanning = false;
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
            new contact("Loc1", 1, false, 1),
            new contact("Loc1", 1, false, 3),
            new contact("Loc2", 0, false, 2),
            new contact("Loc2", 0, false, 4),
            new contact("Loc2", 0, true, 5),
            new contact("Loc2", 0, true, 7),
            new contact("Loc3", 2, false, 6),
            new contact("Loc3", 2, false, 8),
        ]
    },
    {
        label: "C'",
        contacts: [
            new contact("Loc4", 1, false, 2),
            new contact("Loc4", 0, true, 1),
            new contact("Loc5", 0, false, 3),
            new contact("Loc5", 0, false, 4),
            new contact("Loc5", 0, true, 6),
            new contact("Loc6", 2, false, 5),
            new contact("Loc6", 2, false, 8),
            new contact("Loc6", 0, true, 7),
        ]
    },
    {
        label: "L'",
        contacts: [
            new contact("Loc7", 1, false, 1),
            new contact("Loc7", 1, true, 2),
            new contact("Loc7", 2, false, 3),
            new contact("Loc8", 0, true, 4),
            new contact("Loc8", 2, true, 5),
            new contact("Loc8", 1, false, 6),
            new contact("Loc8", 1, false, 7),
            new contact("Loc9", 2, true, 8),
            new contact("Loc9", 0, true, 9),
            new contact("Loc9", 0, false, 10),
            new contact("Loc0", 2, false, 11),
            new contact("Loc0", 2, false, 12),
        ]
    },
]



