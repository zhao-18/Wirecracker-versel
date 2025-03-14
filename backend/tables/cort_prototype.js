function corticalSubcorticalItem(_id, _name = "", _acronym = "", _electrode_label = "", _hemisphere = "", _lobe = "") {
    // Lazily load rest if necessary
    this.id = _id;
    this.name = _name;
    this.acronym = _acronym;
    this.electrode_label = _electrode_label;
    this.hemisphere = _hemisphere;
    this.lobe = _lobe;
}

corticalSubcorticalItem.prototype = {
    constructor: corticalSubcorticalItem, // Ensure the constructor is set correctly

    load: function() {
        let loaded_csc = corticalSubcorticalItem( ...fetch("cort", "id", this.id) ); // TODO: return complete structure of cortical_subcortical

        if (this.name == "")
            this.name = loaded_csc.name;

        if (this.acronym == "")
            this.acronym = loaded_csc.acronym;

        if (this.electrode_label == "")
            this.electrode_label = loaded_csc.electrode_label;

        if (this.hemisphere == "")
            this.hemisphere = loaded_csc.hemisphere;

        if (this.lobe == "")
            this.lobe = loaded_csc.lobe;
    },

    getName: function() {
        if (this.name == "") this.load();
        return this.name;
    },

    ///// TODO 4 more getters

};
