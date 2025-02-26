function functionItem(_id, _name = "", _description = "") {
    // Lazily load rest if necessary
    this.id = _id;
    this.name = _name;
    this.description = _description;
}

functionItem.prototype = {
    constructor: functionItem, // Ensure the constructor is set correctly

    load: function() {
        let loaded_func = functionItem( ...fetch("function", "id", this.id) ); // TODO: return structure containing id, name, and description

        if (this.name == "")
            this.name = loaded_func.name;

        if (this.description == "")
            this.description = loaded_func.description;
    },

    getName: function() {
        if (this.name == "") this.load();
        return this.name;
    },

    getDescription: function() {
        if (this.description == "") this.load();
        return this.description;
    },

};
