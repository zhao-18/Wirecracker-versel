function testOrderElement(_contactIn, _contactOut, _stimulationID = "", _frequency = NaN, _current = NaN, _pulseDuration = NaN, _testId = "") {

    this.contactIn = _contactIn; // Pass the contact prototype
    this.contactOut = _contactOut;

    // Not specified => fetch new
    if (_stimulationID == "") {
        this.loadDefaultStimulation();
    } else {
        this.stimulationID = _stimulationID;
    }

    // Not specified => load default
    if ( _frequency == "" || _frequency == NaN ||
        _current == "" || _current == NaN ||
        _pulseDuration == "" || _pulseDuration == NaN ) {
        this.loadDefaultParams();
    } else {
        this.frequency = _frequency;
        this.current = _current;
        this.pulseDuration = _pulseDuration;
    }

    this.testId = _testId;
}

testOrderElement.prototype = {
    constructor: testOrderElement, // Ensure the constructor is set correctly

    loadDefaultStimulation: function() {
        let stimulations = fetch(contactIn.associatedLocation); // TODO
        this.stimulation = pickBest(stimulations); // TODO
        this.stimulationID = this.stimulation.ID;
    },

    loadDefaultParams: function() {
        // Fetch default from database
        if (this.stimulation == null) {
            this.stimulation = fetch(this.stimulationID); // TODO
        }

        this.frequency = this.stimulation.frequency;
        this.current = this.stimulation.current;
        this.pulseDuration = this.stimulation.pulseDuration;
    }
};
