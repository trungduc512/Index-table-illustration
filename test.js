// --- 1. KẾT NỐI VÀ CÀI ĐẶT ---
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Sử dụng performance.now() để đo thời gian chính xác
const { performance } = require('perf_hooks'); 

const MONGO_URI = "mongodb://root:123456@localhost:27017/index-table-demo?authSource=admin";
const NUM_RECORDS_TO_INSERT = 50000;

// --- 2. ĐỊNH NGHĨA SCHEMA (Vẫn không có index) ---
const SalesRecordSchema = new Schema({
    Region: String,
    Country: String, 
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
    collection: 'sales_records',
    strict: false
});

const SalesRecord = mongoose.model('sales_records', SalesRecordSchema);

// --- 3. HÀM HỖ TRỢ ---

// (Hàm generateMockData và cleanUpCollection giữ nguyên như cũ)

function generateMockData(count) {
    console.log(`Đang chuẩn bị ${count} document mẫu...`);
    const records = [];
    const regions = ['Asia', 'Europe', 'North America', 'Africa', 'Australia', 'South America'];
    const countries = ['Vietnam', 'USA', 'China', 'Germany', 'Japan', 'Brazil', 'India', 'France'];
    const itemTypes = ['CPU', 'Monitor', 'Keyboard', 'Mouse', 'RAM'];
    for (let i = 0; i < count; i++) {
        records.push({
            Region: regions[i % regions.length],
            Country: countries[i % countries.length],
            'Item Type': itemTypes[i % itemTypes.length],
            'Order ID': `id_${i}`,
            'Units Sold': Math.floor(Math.random() * 100) + 1,
            'Total Revenue': Math.random() * 10000,
            'Order Date': new Date()
        });
    }
    console.log('Đã chuẩn bị xong data.');
    return records;
}

async function cleanUpCollection(model) {
    try {
        await model.collection.drop();
        console.log('Đã dọn dẹp (drop) collection cũ.');
    } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
            console.log('Collection không tồn tại, không cần dọn dẹp.');
        } else {
            throw error;
        }
    }
}

/**
 * Hàm test GHI (dùng performance.now)
 */
async function runInsertTest(model, data, description) {
    console.log(`\nBắt đầu ${description}...`);
    const startTime = performance.now(); // Bắt đầu đếm
    try {
        await model.insertMany(data, { ordered: false });
    } catch (error) {
        console.error(`Lỗi trong khi ${description}:`, error);
    }
    const endTime = performance.now(); // Dừng đếm
    const duration = (endTime - startTime).toFixed(2);
    console.log(`✅ ${description}: ${duration} ms`);
    return duration;
}

/**
 * Hàm test ĐỌC (dùng .explain)
 */
async function runReadTest(model, query, description) {
    console.log(`\nBắt đầu ${description}...`);
    try {
        const explainResult = await model
            .find(query)
            .explain('executionStats');
        
        const stats = explainResult[0].executionStats;
        const plan = explainResult[0].queryPlanner.winningPlan;

        console.log(`✅ ${description}:`);
        console.log(`   - Kế hoạch (Plan): ${plan.stage}`);
        console.log(`   - Thời gian server (executionTimeMillis): ${stats.executionTimeMillis} ms`);
        console.log(`   - Tổng tài liệu đã quét (totalDocsExamined): ${stats.totalDocsExamined}`);
        console.log(`   - Tổng key đã quét (totalKeysExamined): ${stats.totalKeysExamined}`);

    } catch (error) {
        console.error(`Lỗi trong khi ${description}:`, error);
    }
}

// --- 4. HÀM CHẠY CHÍNH (KỊCH BẢN DEMO) ---
async function runFullDemo() {
    let connection;
    try {
        connection = await mongoose.connect(MONGO_URI);
        console.log('Đã kết nối tới MongoDB!');
        
        const mockData = generateMockData(NUM_RECORDS_TO_INSERT);
        const query = { 'Country': 'Vietnam' }; // Query để test tốc độ đọc

        // --- GIAI ĐOẠN 1: KHÔNG CÓ INDEX ---
        console.log('\n--- GIAI ĐOẠN 1: KHÔNG CÓ INDEX ---');
        await cleanUpCollection(SalesRecord); 
        
        // Test 1: Ghi không index
        await runInsertTest(SalesRecord, mockData, 'Test 1: Thời gian GHI (Không Index)');
        
        // Test 2: Đọc không index
        await runReadTest(SalesRecord, query, 'Test 2: Tốc độ ĐỌC (Không Index)');

        // --- GIAI ĐOẠN 2: CÓ INDEX ---
        console.log('\n--- GIAI ĐOẠN 2: CÓ INDEX ---');
        await cleanUpCollection(SalesRecord); // Xóa đi để tạo lại

        console.log('...Đang tạo index cho "Country"...');
        await SalesRecord.collection.createIndex({ Country: 1 });
        console.log('...Đã tạo index.');

        // Test 3: Ghi có index
        await runInsertTest(SalesRecord, mockData, 'Test 3: Thời gian GHI (Có Index)');
        
        // Test 4: Đọc có index
        await runReadTest(SalesRecord, query, 'Test 4: Tốc độ ĐỌC (Có Index)');

        // --- KẾT LUẬN ---
        console.log('\n--- KẾT LUẬN CUỐI CÙNG ---');
        console.log('➡️  TỐC ĐỘ GHI (Test 1 vs Test 3):');
        console.log('   Ghi CÓ Index (Test 3) sẽ CHẬM HƠN Ghi Không Index (Test 1).');
        console.log('   (Vì DB phải ghi data VÀ cập nhật B-Tree của index).');
        
        console.log('\n➡️  TỐC ĐỘ ĐỌC (Test 2 vs Test 4):');
        console.log('   Đọc CÓ Index (Test 4) sẽ NHANH HƠN RẤT NHIỀU so với Đọc Không Index (Test 2).');
        console.log('   Hãy nhìn vào `executionTimeMillis` và `totalDocsExamined` để thấy rõ:');
        console.log('   - Test 2 (Không Index): Phải quét toàn bộ 50,000 document (COLLSCAN).');
        console.log('   - Test 4 (Có Index): Chỉ quét các document có "Country: Vietnam" (IXSCAN).');

    } catch (error) {
        console.error('Lỗi nghiêm trọng:', error.message);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('\nĐã ngắt kết nối MongoDB. Tạm biệt!');
        }
    }
}

// --- 5. GỌI HÀM ĐỂ CHẠY ---
runFullDemo();