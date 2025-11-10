const fs = require("fs");
const { MongoClient } = require("mongodb");
const csv = require("csv-parser");

// ------------------------------------
// !! GIÁ TRỊ ĐÃ ĐƯỢC CHỈNH SỬA !!
// ------------------------------------
// ĐÃ ĐỔI: Sử dụng chuỗi kết nối của container mongo1
const MONGO_URI =
  "mongodb://root:123456@localhost:27017";
const DATABASE_NAME = "index-table-demo"; // Bạn có thể giữ tên này
const COLLECTION_NAME = "sales_records";
const CSV_FILE_PATH = "./100000 Sales Records.csv"; // Đảm bảo tệp CSV ở đây
// ------------------------------------

// A function to process the CSV and insert data in batches
async function importCSV() {
  // ĐÃ ĐỔI: Sử dụng MONGO_URI
  const client = new MongoClient(MONGO_URI);

  try {
    // 1. Connect to MongoDB
    await client.connect();
    console.log("Đã kết nối tới MongoDB Local.");

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Optional: Xóa collection cũ trước khi import (bỏ comment nếu muốn)
    // await collection.deleteMany({});
    // console.log("Đã xóa dữ liệu cũ trong collection.");

    let batch = [];
    const batchSize = 10000; // Chèn theo lô 10.000

    console.log("Bắt đầu đọc tệp CSV...");

    // 2. Create a read stream for the CSV file
    const stream = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(csv()) // Pipe the stream to the csv-parser
      .on("data", async (row) => {
        // 'row' là một đối tượng JSON đại diện cho 1 dòng
        batch.push(row);

        // 3. Insert data in batches
        if (batch.length === batchSize) {
          // Tạm dừng stream, chèn lô, sau đó tiếp tục
          stream.pause();
          await collection.insertMany(batch);
          console.log(`Đã chèn ${batch.length} tài liệu.`);
          batch = []; // Xóa lô
          stream.resume();
        }
      })
      .on("end", async () => {
        // 4. Insert any remaining documents (the last batch)
        if (batch.length > 0) {
          await collection.insertMany(batch);
          console.log(`Đã chèn ${batch.length} tài liệu cuối cùng.`);
        }

        console.log("Hoàn tất xử lý tệp CSV.");
        await client.close();
        console.log("Đã ngắt kết nối MongoDB.");
      })
      .on("error", (error) => {
        console.error("Lỗi khi xử lý CSV:", error);
        client.close();
      });
  } catch (err) {
    console.error("Đã xảy ra lỗi:", err);
    await client.close();
  }
}

// Run the import function
importCSV();