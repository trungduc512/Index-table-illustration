// log_service_sync.js (Mô phỏng GHI ĐỒNG BỘ)
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { performance } = require('perf_hooks'); // Dùng performance để đo thời gian

// --- Cài đặt ---
// (Nhớ thay đổi connection string nếu DB của bạn khác)
const MONGO_URI = "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";

// --- Schema cho Bảng chính ---
const LogSchema = new Schema({
    userId: String,
    eventType: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
}, { collection: 'logs' });

// --- Schema cho các Bảng Index ---
const LogIndexByUserSchema = new Schema({
    userId: { type: String, index: true },
    log_id: { type: Schema.Types.ObjectId, ref: 'Log' }
}, { collection: 'logs_idx_by_user' });

const LogIndexByEventSchema = new Schema({
    eventType: { type: String, index: true },
    log_id: { type: Schema.Types.ObjectId, ref: 'Log' }
}, { collection: 'logs_idx_by_event' });

// --- Khởi tạo Models ---
const Log = mongoose.model('Log', LogSchema);
const LogIndexByUser = mongoose.model('LogIndexByUser', LogIndexByUserSchema);
const LogIndexByEvent = mongoose.model('LogIndexByEvent', LogIndexByEventSchema);


// --- Hàm chính ---
async function writeLogSync() {
    console.log('--- LogService (SYNC) ---');
    console.log('Kịch bản: Ghi log VÀ cập nhật 2 index NGAY LẬP TỨC');
    let dbConnection;
    
    // Bắt đầu đếm giờ TỔNG THỜI GIAN
    const totalStartTime = performance.now();
    
    try {
        dbConnection = await mongoose.connect(MONGO_URI);
        console.log('Đã kết nối MongoDB...');

        // 1. Tạo log mới
        const newLog = new Log({
            userId: 'user-' + Math.floor(Math.random() * 5),
            eventType: ['login', 'click', 'logout'][Math.floor(Math.random() * 3)],
            message: 'Một hành động gì đó đã xảy ra (SYNC)'
        });

        // 2. Ghi vào bảng chính
        console.log('1. Đang ghi vào collection "logs"...');
        await newLog.save();
        console.log('...Ghi "logs" thành công.');

        // 3. Lấy log_id vừa tạo
        const logId = newLog._id;

        // --- BẮT ĐẦU PHẦN "CHẬM" ---
        // Đây là phần việc mà RabbitMQ giúp chúng ta làm bất đồng bộ
        // Chúng ta cũng giả lập độ trễ 1 giây GIỐNG HỆT như indexer_service
        console.log('2. Đang cập nhật 2 bảng index (Giả lập độ trễ 1s)...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. Ghi vào bảng index 1
        const userIndex = new LogIndexByUser({ userId: newLog.userId, log_id: logId });
        await userIndex.save();

        // 5. Ghi vào bảng index 2
        const eventIndex = new LogIndexByEvent({ eventType: newLog.eventType, log_id: logId });
        await eventIndex.save();
        
        console.log('...Cập nhật 2 index thành công.');

    } catch (error) {
        console.error('Lỗi:', error.message);
    } finally {
        if (dbConnection) await mongoose.disconnect();
        
        const totalEndTime = performance.now();
        const duration = (totalEndTime - totalStartTime).toFixed(2);
        
        console.log('\n--- KẾT QUẢ ---');
        console.log(`✅ Hoàn thành! TỔNG THỜI GIAN người dùng phải chờ: ${duration} ms`);
    }
}

// Chạy hàm
writeLogSync();