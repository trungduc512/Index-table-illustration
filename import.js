const fs = require("fs");
const { MongoClient } = require("mongodb");
const csv = require("csv-parser");

// ------------------------------------
// !! EDIT THESE VALUES !!
// ------------------------------------
const ATLAS_URI =
  "mongodb+srv://doductrung234_db_user:wz4YczDOWa4kOY0t@index-table-demo.r5kteji.mongodb.net/?appName=Index-table-demo";
const DATABASE_NAME = "index-table-demo";
const COLLECTION_NAME = "sales_records";
const CSV_FILE_PATH = "./100000 Sales Records.csv"; // Path to your CSV file
// ------------------------------------

// A function to process the CSV and insert data in batches
async function importCSV() {
  const client = new MongoClient(ATLAS_URI);

  try {
    // 1. Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB Atlas.");

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Optional: Clear the collection before importing
    // await collection.deleteMany({});
    // console.log("Cleared existing data in collection.");

    let batch = [];
    const batchSize = 10000; // Insert documents in batches of 1000

    // 2. Create a read stream for the CSV file
    const stream = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(csv()) // Pipe the stream to the csv-parser
      .on("data", async (row) => {
        // 'row' is a JSON object representing a line in the CSV

        // --- Optional: Data Transformation ---
        // You can clean or transform your data here.
        // For example, if you have an 'age' column that should be a number:
        // if (row.age) {
        //   row.age = parseInt(row.age, 10);
        // }
        // --------------------------------------

        batch.push(row);

        // 3. Insert data in batches
        if (batch.length === batchSize) {
          // Pause the stream, insert the batch, then resume
          stream.pause();
          await collection.insertMany(batch);
          console.log(`Inserted ${batch.length} documents.`);
          batch = []; // Clear the batch
          stream.resume();
        }
      })
      .on("end", async () => {
        // 4. Insert any remaining documents (the last batch)
        if (batch.length > 0) {
          await collection.insertMany(batch);
          console.log(`Inserted final ${batch.length} documents.`);
        }

        console.log("CSV file successfully processed.");
        await client.close();
      })
      .on("error", (error) => {
        console.error("Error processing CSV:", error);
        client.close();
      });
  } catch (err) {
    console.error("An error occurred:", err);
    await client.close();
  }
}

// Run the import function
importCSV();
