// indexer_service.js (Consumer)
const amqp = require('amqplib');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Cài đặt ---
const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const MONGO_URI = "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";
const EXCHANGE_NAME = 'log_exchange';
const QUEUE_NAME = 'indexing_queue';
const BINDING_KEY = 'log.created';

// --- Schema cho các Bảng Index ---
// 1. Index theo User
const LogIndexByUserSchema = new Schema({
    userId: { type: String, index: true }, // Đây là index để TÌM KIẾM
    log_id: { type: Schema.Types.ObjectId, ref: 'Log' }
}, { collection: 'logs_idx_by_user' });

// 2. Index theo Event Type
const LogIndexByEventSchema = new Schema({
    eventType: { type: String, index: true }, // Đây là index để TÌM KIẾM
    log_id: { type: Schema.Types.ObjectId, ref: 'Log' }
}, { collection: 'logs_idx_by_event' });

const LogIndexByUser = mongoose.model('LogIndexByUser', LogIndexByUserSchema);
const LogIndexByEvent = mongoose.model('LogIndexByEvent', LogIndexByEventSchema);

// --- Hàm chính ---
async function startIndexerService() {
    console.log('--- IndexerService đã khởi động, đang chờ log... ---');
    try {
        // Kết nối đồng thời
        const [rmqConnection, dbConnection] = await Promise.all([
            amqp.connect(RABBITMQ_URL),
            mongoose.connect(MONGO_URI)
        ]);
        console.log('Đã kết nối RabbitMQ và MongoDB');
        
        const rmqChannel = await rmqConnection.createChannel();
        
        // Setup RabbitMQ
        await rmqChannel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        const { queue } = await rmqChannel.assertQueue(QUEUE_NAME, { durable: true });
        await rmqChannel.bindQueue(queue, EXCHANGE_NAME, BINDING_KEY);

        // Bắt đầu lắng nghe
        rmqChannel.consume(queue, async (msg) => {
            if (msg !== null) {
                const log = JSON.parse(msg.content.toString());
                console.log(`\n[Indexer] A. Nhận được log ID: ${log._id}`);

                // GIẢ LẬP VIỆC GHI INDEX BỊ CHẬM (ví dụ: 1 giây)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    // B. Ghi vào 2 bảng index
                    const userIndex = new LogIndexByUser({ userId: log.userId, log_id: log._id });
                    const eventIndex = new LogIndexByEvent({ eventType: log.eventType, log_id: log._id });
                    
                    await Promise.all([
                        userIndex.save(),
                        eventIndex.save()
                    ]);

                    console.log(`[Indexer] B. Đã cập nhật 2 bảng index cho log ID: ${log._id}`);
                    
                    // C. Báo cho RabbitMQ là đã xử lý xong
                    rmqChannel.ack(msg);

                } catch (dbError) {
                    console.error(`[Indexer] Lỗi khi ghi index: ${dbError.message}`);
                    // Ở đây có thể xử lý retry hoặc đưa vào Dead Letter Queue
                    // Tạm thời ta ack để nó không bị lặp lại
                    rmqChannel.ack(msg);
                }
            }
        });

    } catch (error) {
        console.error('IndexerService Lỗi nghiêm trọng:', error.message);
    }
}

// Chạy dịch vụ
startIndexerService();