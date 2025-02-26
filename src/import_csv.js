/*


 This file is expected to be run from project root (where config is at)
 I will make it cleaner once I figure out how to detect where it is at


 */

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('fast-csv');

// Load configurations
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const data_dir = config.data_dir; // Based on where config is at

// PostgreSQL Connection
const pool = new Pool({
  user: config.db_user,
  host: config.host,
  database: config.db_name,
  password: config.db_pass,
  port: config.port
});


// Function to import CSV data
async function import_csv(filePath, tableName, columns) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const csvData = [];

    const csvStream = csv.parse({ headers: true })
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        try {
          const client = await pool.connect();

          for (let row of csvData) {
            const values = columns.map(col => row[col]); // Extract values based on column order
            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`;
            await client.query(query, values);
          }

          client.release();
          console.log(`Imported ${csvData.length} records into ${tableName}`);
          resolve();
        } catch (err) {
          console.error(`Error importing ${filePath}:`, err);
          reject(err);
        }
      });

    stream.pipe(csvStream);
  });
}

// Load all CSV files
async function load_all_csv() {
  try {
    await import_csv(data_dir + 'cortical_subcortical.csv', 'cortical_subcortical', ['id', 'name', 'acronym', 'electrode_label', 'hemisphere', 'lobe']);
    await import_csv(data_dir + 'tag.csv', 'tag', ['id', 'name']);
    await import_csv(data_dir + 'gm_area.csv', 'gm_area', ['id', 'name', 'acronym']);
    await import_csv(data_dir + 'cort_gm.csv', 'cort_gm', ['cort_id', 'gm_id', 'reference_id']);
    await import_csv(data_dir + 'function.csv', 'function', ['id', 'name', 'description']);
    await import_csv(data_dir + 'gm_function.csv', 'gm_function', ['gm_id', 'function_id', 'reference_id']);
    await import_csv(data_dir + 'test.csv', 'test', ['id', 'name', 'description']);
    await import_csv(data_dir + 'function_test.csv', 'function_test', ['function_id', 'test_id', 'reference_id']);
    await import_csv(data_dir + 'reference.csv', 'reference', ['isbn_issn_doi', 'title', 'authors', 'publisher', 'publication_date', 'access_date']);
    await import_csv(data_dir + 'stimulation.csv', 'stimulation', ['id', 'epilepsy_type', 'cort_id', 'gm_id', 'test_id', 'disruption_rate', 'frequency', 'current', 'pulse_duration', 'test_duration']);
    await import_csv(data_dir + 'test_tag.csv', 'test_tag', ['test_id', 'tag_id']);

    console.log('All CSV files imported successfully.');
    pool.end();
  } catch (err) {
    console.error('Error loading CSV files:', err);
  }
}

// Run the script
load_all_csv();
