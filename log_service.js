// log_service.js (Publisher)
const amqp = require('amqplib');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Cài đặt ---
const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
// (Nhớ thay đổi connection string nếu DB của bạn khác)
const MONGO_URI = "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";
const EXCHANGE_NAME = 'log_exchange';
const ROUTING_KEY = 'log.created';

// --- Schema cho Bảng chính (KHÔNG CÓ INDEX PHỤ) ---
// Rất "sạch" để tối ưu cho việc GHI
const LogSchema = new Schema({
    userId: String,
    eventType: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
}, { collection: 'logs' });

const Log = mongoose.model('Log', LogSchema);

// --- Hàm chính ---
async function writeLog() {
    console.log('--- LogService ---');
    let rmqConnection, rmqChannel, dbConnection;
    try {
        // Kết nối đồng thời
        [rmqConnection, dbConnection] = await Promise.all([
            amqp.connect(RABBITMQ_URL),
            mongoose.connect(MONGO_URI)
        ]);
        
        console.log('Đã kết nối RabbitMQ và MongoDB');
        rmqChannel = await rmqConnection.createChannel();
        await rmqChannel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });

        // 1. Tạo log mới
        const newLog = new Log({
            userId: 'user-' + Math.floor(Math.random() * 5), // 5 user ngẫu nhiên
            eventType: ['login', 'click', 'logout'][Math.floor(Math.random() * 3)], // 3 loại event
            message: 'Một hành động gì đó đã xảy ra'
        });

        // 2. TÁC VỤ ĐỒNG BỘ (SYNC): Ghi vào bảng chính
        // Đây là bước duy nhất người dùng phải chờ
        const startTime = process.hrtime.bigint();
        await newLog.save(); // <<< CHỈ ĐO 1 LẦN GHI NÀY
        const endTime = process.hrtime.bigint();
        console.log(`1. (Sync) Ghi vào 'logs' thành công. Tốn: ${Number(endTime - startTime) / 1_000_000} ms.`);

        // 3. TÁC VỤ BẤT ĐỒNG BỘ (ASYNC): Gửi tin nhắn
        const message = JSON.stringify(newLog.toObject());
        rmqChannel.publish(
            EXCHANGE_NAME,
            ROUTING_KEY,
            Buffer.from(message)
        );
        console.log(`2. (Async) Đã publish sự kiện '${ROUTING_KEY}' lên RabbitMQ.`);
        console.log('3. Trả về "OK" cho client. (Hoàn thành!)');

    } catch (error) {
        console.error('Lỗi:', error.message);
    } finally {
        if (rmqChannel) await rmqChannel.close();
        if (rmqConnection) await rmqConnection.close();
        if (dbConnection) await mongoose.disconnect();
    }
}

// Chạy hàm
writeLog();