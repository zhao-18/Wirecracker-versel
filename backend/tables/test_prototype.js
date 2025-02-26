function testItem(_id, _name = "", _description = "", _tags = "", _functions = "") {
    this.id = _id;
    this.name = _name;
    this.description = _description;
    this.tags = _tags;
    this.functions = _functions;
}

testItem.prototype = {
    constructor: testItem, // Ensure the constructor is set correctly

    load: function() {
        if (this.name == "" || this.description == "") {
            let loaded_test = testItem( ...fetch("test", "id", this._id) ); // TODO: Contains id, name, description

            if (this.name == "")
                this.name = loaded_test.name;

            if (this.description == "")
                this.description = loaded_test.description;
        }

        if ( this.tags == "" ) {
            this.tags = [];
            let tags = fetch("test_tag", "test_id", this.id); // TODO: Contains list of test_id and tag_id
            for ( let tag_id of tags )
            {
                let tag = fetch("tag", "id", tag_id); // TODO: Contains id and name
                this.tags.push(tag);
            }
        }

        if ( this.functions == "" ) {
            this.functions = [];
            let functions = fetch("function_test", "test_id", this.id); // TODO: Contains list of function_id, test_id, and reference_id
            for ( let func_id of functions )
            {
                let func = functionItem( func_id.function_id ); // Load only id for now
                func.reference = referenceItem( func_id.reference_id ); // Load only id for now
                this.functions.push(func);
            }
        }
    },

    getName: function() {
        if ( this.name == "" ) this.load();
        return this.name;
    },

    getDescription: function() {
        if ( this.description == "" ) this.load();
        return this.description;
    },

    getTags: function() {
        if ( this.tags == "" || this.tags == [] ) this.load();
        return this.tags;
    },

    getFunctions: function() {
        if ( this.functions == "" || this.functions == [] ) this.load();
        return this.functions;
    }
};
