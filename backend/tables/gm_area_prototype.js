function gmAreaItem(_id, _name = "", _acronym = "", _functions = "", _corts = "") {
    // Lazily load rest if necessary
    this.id = _id;
    this.name = _name;
    this.acronym = _acronym;
    this.functions = _functions;
    this.corts = _corts;
}

gmAreaItem.prototype = {
    constructor: gmAreaItem, // Ensure the constructor is set correctly

    load: function() {
        if (this.name == "" || this.acronym == "") {
            let loaded_gm_area = gmAreaItem( ...fetch("gm_area", "id", this.id) ); // TODO: return structure containing id, name, and acronym

            if (this.name == "")
                this.name = loaded_gm_area.name;

            if (this.acronym == "")
                this.acronym = loaded_gm_area.acronym;
        }

        if ( this.functions == "" ) {
            this.functions = [];
            let functions = fetch("gm_function", "gm_id", this.id); // TODO: Contains list of gm_id, function_id, and reference_id
            for ( let func_id of functions )
            {
                let func = functionItem( func_id.function_id ); // Load only id for now
                func.reference = referenceItem( func_id.reference_id ); // Load only id for now
                this.functions.push(func);
            }
        }

        if ( this.cort == "" ) {
            this.corts = [];
            let corts = fetch("cort_gm", "gm_id", this.id); // TODO: Contains list of cort_id, gm_id, and reference_id
            for ( let cort_id of corts )
            {
                let cort = corticalSubcorticalItem( cort_id.cort_id ); // Load only id for now
                cort.reference = referenceItem( cort_id.reference_id ); // Load only id for now
                this.functions.push(cort);
            }
        }
    },

    getName: function() {
        if (this.name == "") this.load();
        return this.name;
    },

    getAcronym: function() {
        if (this.acronym == "") this.load();
        return this.acronym;
    },

    getFunctions: function() {
        if ( this.functions == "" ) this.load();
        return this.functions;
    },

    getCorts: function() {
        if ( this.corts == "" ) this.load();
        return this.corts;
    }

};
