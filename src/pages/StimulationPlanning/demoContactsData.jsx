class contact {
    constructor(label, loc, duration, frequency, current) {
        this.label = label;
        this.associatedLocation = loc;
        this.duration = duration;
        this.frequency = frequency;
        this.current = current;
    }

    isMarked() {
        return this.mark || this.surgeonMark;
    }
}

let demoContactsData = [
    new contact("TB1", "MedialInferiorTemporalCortex", 5.0, 1.225, 3.25),
    new contact("TB2", "MedialInferiorTemporalCortex", 5.0, 0.225, 3.25),
    new contact("TB3", "MedialInferiorTemporalCortex", 5.0, 2.225, 3.25),
    new contact("TB11", "RostralMiddleTemporalCortex", 5.0, 0.225, 3.25),
    new contact("TB12", "RostralMiddleTemporalCortex", 5.0, 2.225, 3.25),
    new contact("B1", "Hippocampus", 5.0, 1.225, 3.25),
    new contact("B2", "Hippocampus", 5.0, 0.225, 3.25),
    new contact("B3", "Hippocampus", 5.0, 2.225, 3.25),
    new contact("B12", "CaudalMiddleTemporalCortex", 5.0, 2.225, 3.25),
    new contact("B13", "CaudalMiddleTemporalCortex", 5.0, 1.225, 3.25),
    new contact("OT'13", "CaudalMiddleTemporalCortex", 5.0, 1.225, 3.25),
    new contact("OT'14", "CaudalMiddleTemporalCortex", 5.0, 0.225, 3.25),
    new contact("OT'15", "CaudalMiddleTemporalCortex", 5.0, 2.225, 3.25),
]

let demoTestData = [
    {id: 301, name: "Visual Object Naming", region: "MedialInferiorTemporalCortex", description: "Name black-and-white outline pictures", population: 15, disruptionRate: 58.2, tag: ["iPad", "speech", "vision"]},
    {id: 302, name: "Colored Line Bisection", region: "MedialInferiorTemporalCortex", description: "Determine if lines are of equal length", population: 3, disruptionRate: 88.6, tag: ["iPad", "vision"]},
    {id: 303, name: "Stroop", region: "RostralMiddleTemporalCortex", description: "Say the color of a word", population: 12, disruptionRate: 60.2, tag: ["iPad", "language", "vision", "color"]},
    {id: 304, name: "Proper Noun Naming", region: "CaudalMiddleTemporalCortex", description: "Name famous faces/landmarks/cartoon characters from pictures", population: 15, disruptionRate: 58.2, tag: ["iPad", "speaker", "microphone", "object recognition", "visual"]},
    {id: 305, name: "Picture Verb Action Naming", region: "CaudalMiddleTemporalCortex", description: "Name action occurring in picture", population: 15, disruptionRate: 58.2, tag: ["iPad", "speaker", "microphone", "object recognition"]},
    {id: 306, name: "Draw Object", region: "Hippocampus", description: "Draw object", population: 15, disruptionRate: 58.2, tag: ["pen", "paper", "memory", "vision"]},
    {id: 307, name: "Draw Colored Object", region: "Hippocampus", description: "Draw object with colors", population: 15, disruptionRate: 58.2, tag: ["pen", "paper", "memory", "vision"]},
    {id: 308, name: "Draw Colored Object Meow", region: "OOB", description: "Draw object with colors", population: 15, disruptionRate: 58.2, tag: ["pen", "paper", "memory", "vision"]},
    {id: 309, name: "Draw Colored Object Woof", region: "WM", description: "Draw object with colors", population: 15, disruptionRate: 58.2, tag: ["pen", "paper", "memory", "vision"]},
]

export {demoContactsData, demoTestData}
