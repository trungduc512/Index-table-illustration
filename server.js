// --- 1. KẾT NỐI DATABASE ---
// Sử dụng connection string của database (cổng 27017)
const MONGO_URI = "mongodb://root:123456@localhost:27017/index-table-demo?authSource=admin";

// Sử dụng Mongoose để kết nối và thao tác với MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- 2. ĐỊNH NGHĨA SCHEMA CHO COLLECTION sales_records ---
const SalesRecordSchema = new Schema({
    Region: String,

    Country: {
      type: String,
      index: true
    },
    'Item Type': String, 
    'Sales Channel': String,
    'Order Priority': String, 
    'Order Date': Date,
    'Order ID': String,
    'Ship Date': Date, 
    'Units Sold': Number,
    'Unit Price': Number,
    'Unit Cost': Number,
    'Total Revenue': Number,
    'Total Cost': Number,
    'Total Profit': Number
}, {
    // Chỉ định Mongoose dùng collection 'sales_records' đã có sẵn
    collection: 'sales_records', 
    
    // Cho phép các trường khác (nếu có) trong document
    // mà không bị Mongoose loại bỏ.
    strict: false 
});

const sales_records = mongoose.model('sales_records', SalesRecordSchema);

// --- 3. HÀM CHẠY CHÍNH ---
// Chúng ta tạo một hàm async để có thể dùng 'await'
async function runDatabaseDemo() {
    try {
        // Kết nối
        await mongoose.connect(MONGO_URI);
        console.log('Đã kết nối tới MongoDB!');

        const indexes = await sales_records.collection.listIndexes().toArray();
        console.log('Lấy danh sách index', indexes);

        const query = { 
            'Country': 'Vietnam', 
        };

        const explainResult = await sales_records
            .find(query)
            .explain('executionStats');
          
        console.log('\nKẾT QUẢ EXPLAIN:\n', JSON.stringify(explainResult.executionStats));

    } catch (error) {
        // Xử lý nếu có lỗi
        console.error('Lỗi:', error.message);
    } finally {
        // Rất quan trọng: Luôn ngắt kết nối sau khi chạy xong
        await mongoose.disconnect();
        console.log('\nĐã ngắt kết nối MongoDB. Tạm biệt!');
    }
}

// --- 4. GỌI HÀM ĐỂ CHẠY ---
runDatabaseDemo();