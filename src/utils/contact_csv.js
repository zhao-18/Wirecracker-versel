function contact(_locationID, _contactNumber, _associatedLocation, _mark = 0, _surgeonMark = 0/*, _x = NaN, _y = NaN, _z = NaN*/) {
    // Deal with empty slot in CSV
    if ( _mark == "" ) _mark = 0;
    if ( _surgeonMark == "" ) _surgeonMark = 0;
    if ( _x == "" ) _x = NaN;
    if ( _y == "" ) _y = NaN;
    if ( _z == "" ) _z = NaN;

    this.locationID = _locationID; // Maybe it is better to use label string like U' instead of refering?
    this.contactNumber = _contactNumber;
    this.associatedLocation = _associatedLocation;
    this.mark = _mark;
    this.surgeonMark = _surgeonMark;
    // this.x = _x;
    // this.y = _y;
    // this.z = _z;
}

contact.prototype = {
    constructor: contact, // Ensure the constructor is set correctly

    getLabel: function() {
        if ( this.label == null ) {
            // Create a request to database
            let fetchedLabel = fetch(this.locationID); // TODO
            this.label = fetchedLabel;
        }
        return this.label;
    },

    setMark: function(mark) {
        switch (mark) {
            case 0:
            case 'NI':
            case 'NotInvolved':
            case 'Green':
                this.mark = 0;
                break;
            case 1:
            case 'SOZ':
            case 'SeizureOnsetZone':
            case 'Red':
                this.mark = 1;
                break;
            case 2:
            case 'SN':
            case 'SeizureNetwork':
            case 'Yellow':
                this.mark = 2;
                break;
            case 3:
            case 'SurgeonMark':
            case 'SurgeonToggle':
            case 'Bold':
                this.surgeonMark = !this.surgeonMark;
                break;
        }
    },

    isMarked: function() {
        return this.mark || this.surgeonMark;
    },

    isOOB: function() {
        return this.associatedLocation == "OOB" || this.associatedLocation == "OutOfBrain";
    },

    isWM: function() {
        return this.associatedLocation == "WM" || this.associatedLocation == "WhiteMatter";
    },

    // isCoordsValid: function() {
    //     return (this.x != NaN && this.y != NaN && this.z != NaN);
    // }
};
