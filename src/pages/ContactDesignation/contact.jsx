export default class contact {
    constructor(loc, mark, surgeonMark) {
        this.associatedLocation = loc;
        this.mark = mark;
        this.surgeonMark = surgeonMark;
    }

    isMarked() {
        return this.mark || this.surgeonMark;
    }
}
