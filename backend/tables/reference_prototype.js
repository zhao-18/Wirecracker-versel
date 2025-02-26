function referenceItem(_isbn_issn_doi, _title = "", _authors = "", _publisher = "", _publication_date = "", _access_date = "") {
    // Lazily load rest if necessary
    this.isbn_issn_doi = _isbn_issn_doi;
    this.title = _title;
    this.authors = _authors;
    this.publisher = _publisher;
    this.publication_date = _publication_date;
    this.access_date = _access_date;
}

referenceItem.prototype = {
    constructor: referenceItem, // Ensure the constructor is set correctly

    load: function() {
        let loaded_ref = referenceItem( ...fetch("reference", "isbn_issn_doi", this.isbn_issn_doi) ); // TODO: return complete structure of reference item

        if (this.title == "")
            this.title = loaded_ref.title;

        if (this.authors == "")
            this.authors = loaded_ref.authors;

        if (this.publisher == "")
            this.publisher = loaded_ref.publisher;

        if (this.publication_date == "")
            this.publication_date = loaded_ref.publication_date;

        if (this.access_date == "")
            this.access_date = loaded_ref.access_date;
    },

    getTitle: function() {
        if (this.title == "") this.load();
        return this.title;
    },

    ///// TODO 4 more getters

};
