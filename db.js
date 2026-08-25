const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// إعدادات الاتصال بقاعدة البيانات
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'al_noamaniah_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

let pool = null;
let isConnected = false;

async function initDB() {
    try {
        // الاتصال الأولي بالـ Server لإنشاء قاعدة البيانات إن لم تكن موجودة
        const tempConn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            multipleStatements: true
        });

        const schemaSqlPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaSqlPath)) {
            const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
            await tempConn.query(schemaSql);
            console.log('✅ تم تجهيز قاعدة بيانات MySQL والجداول وحفظ البيانات الأولية بنجاح.');
        }
        await tempConn.end();

        // إنشاء الـ Pool الرئيسي
        pool = mysql.createPool(dbConfig);
        isConnected = true;
        return pool;
    } catch (error) {
        console.warn('⚠️ تعذر الاتصال بمحرك MySQL المحلي:', error.message);
        console.warn('💡 تأكد من تشغيل خادم MySQL (مثل XAMPP / MySQL Service) على المنفذ 3306 واستخدام اسم المستخدم والرمز المناسبين.');
        isConnected = false;
        return null;
    }
}

// تنفيذ استعلام في قاعدة البيانات
async function query(sql, params) {
    if (!pool || !isConnected) {
        throw new Error('MySQL Database is not connected');
    }
    const [results] = await pool.query(sql, params);
    return results;
}

module.exports = {
    initDB,
    query,
    get isConnected() { return isConnected; }
};
