function stimulationItem(_id, _epilepsy_type = "", _cort = "", _gm = "", _test = "", _disruption_rate = "", _frequency = "", _current = "", _pulse_duration = "", _test_duration = "") {
    // Lazily load rest if necessary
    this.id = _id;
    this.epilepsy_type = _epilepsy_type;
    this.cort = _cort;
    this.gm = _gm;
    this.test = _test;
    this.disruption_rate = _disruption_rate;
    this.frequency = _frequency;
    this.current = _current;
    this.pulse_duration = _pulse_duration;
    this.test_duration = _test_duration;
}

stimulationItem.prototype = {
    constructor: stimulationItem, // Ensure the constructor is set correctly

    load: function() {
        if (this.epilepsy_type == "" || this.cort == "" || this.gm == "" ||
            this.test == ""  || typeof this.cort !== 'object' || typeof this.gm !== 'object' ||
            typeof this.test !== 'object' || this.disruption_rate == "" || this.frequency == "" ||
            this.current == "" || this.pulse_duration == "" || this.test_duration == "") {
            let loaded_stimulation = stimulationItem( ...fetch("stimulation", "id", this.id) ); // TODO: return complete structure of stimulation

            if (this.epilepsy_type == "")
                this.epilepsy_type = loaded_stimulation.epilepsy_type;

            if ( this.cort == "" || typeof this.cort !== 'object' ) {
                this.cort = corticalSubcorticalItem(loaded_stimulation.cort);
            }

            if ( this.gm == "" || typeof this.gm !== 'object' ) {
                this.gm = gmAreaItem(loaded_stimulation.gm);
            }

            if ( this.test == "" || typeof this.test !== 'object' ) {
                this.test = testItem(loaded_stimulation.test);
            }

            if (this.disruption_rate == "")
                this.disruption_rate = loaded_stimulation.disruption_rate;

            if (this.frequency == "")
                this.frequency = loaded_stimulation.frequency;

            if (this.current == "")
                this.current = loaded_stimulation.current;

            if (this.pulse_duration == "")
                this.pulse_duration = loaded_stimulation.pulse_duration;

            if (this.test_duration == "")
                this.test_duration = loaded_stimulation.test_duration;

        }
    },

    getEpilepsyType: function() {
        if (this.epilepsy_type == "") this.load();
        return this.epilepsy_type;
    },

    ///// TODO 8 more getters

};
