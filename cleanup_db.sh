CONFIG_FILE="config.json"

DB_NAME=$(jq -r '.db_name' "$CONFIG_FILE")
DB_USER=$(jq -r '.db_user' "$CONFIG_FILE")
echo "Cleaning up..."
dropdb $DB_NAME -e
dropuser $DB_USER -e
echo "User and database removed."
