#!/bin/bash

# Requirements

# Variables
CONFIG_FILE="config.json"

DB_NAME=$(jq -r '.db_name' "$CONFIG_FILE")
DB_USER=$(jq -r '.db_user' "$CONFIG_FILE")
DB_PASS=$(jq -r '.db_pass' "$CONFIG_FILE")
PG_ADMIN=$(jq -r '.pg_admin' "$CONFIG_FILE")

check_last_op() {
    if [ $? -ne 0 ]; then
        echo "Error detected. Aborting."
        ./cleanup_db.sh
        exit 1
    fi
}

# Functions to execute PostgreSQL commands
run_psql() {
    sudo -u $PG_ADMIN psql -d $DB_NAME -c "$1" -e
    check_last_op
}

run_psql_as_test() {
    PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -c "$1"
    check_last_op
}

echo "Creating test database and user..."

# Create the user
sudo -u $PG_ADMIN psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" -e
check_last_op

# Create the database
createdb $DB_NAME -e
check_last_op

# Grant privileges
run_psql "GRANT USAGE, CREATE ON SCHEMA public TO $DB_USER;"
run_psql "GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;"
run_psql "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Creating tables..."

create_tables() {
run_psql_as_test "
CREATE TABLE cortical_subcortical (
    id SERIAL PRIMARY KEY,
    name TEXT,
    acronym TEXT,
    electrode_label TEXT,
    hemisphere CHAR(1),
    lobe TEXT
);
"

run_psql_as_test "
CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name TEXT
);
"

run_psql_as_test "
CREATE TABLE gm_area (
    id SERIAL PRIMARY KEY,
    name TEXT,
    acronym TEXT
);
"

run_psql_as_test "
CREATE TABLE cort_gm (
    cort_id INT REFERENCES cortical_subcortical(id),
    gm_id INT REFERENCES gm_area(id),
    reference_id VARCHAR(50)
);
"

run_psql_as_test "
CREATE TABLE function (
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT
);
"

run_psql_as_test "
CREATE TABLE gm_function (
    gm_id INT REFERENCES gm_area(id),
    function_id INT REFERENCES function(id),
    reference_id VARCHAR(50)
);
"

run_psql_as_test "
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT
);
"

run_psql_as_test "
CREATE TABLE function_test (
    function_id INT REFERENCES function(id),
    test_id INT REFERENCES test(id),
    reference_id VARCHAR(50)
);
"

run_psql_as_test "
CREATE TABLE reference (
    isbn_issn_doi VARCHAR(50) PRIMARY KEY,
    title TEXT,
    authors TEXT,
    publisher TEXT,
    publication_date DATE,
    access_date VARCHAR(50)
);
"

run_psql_as_test "
CREATE TABLE stimulation (
    id SERIAL PRIMARY KEY,
    epilepsy_type TEXT,
    cort_id INT REFERENCES cortical_subcortical(id),
    gm_id INT REFERENCES gm_area(id),
    test_id INT REFERENCES test(id),
    disruption_rate FLOAT,
    frequency FLOAT,
    current FLOAT,
    pulse_duration FLOAT,
    test_duration FLOAT
);
"


run_psql_as_test "
CREATE TABLE test_tag (
    test_id INT REFERENCES test(id),
    tag_id INT REFERENCES tag(id)
);
"

}

create_tables


# Load the data into database
node src/import_csv.js
check_last_op
