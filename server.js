const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ==========================================================================
// MySQL REST API Endpoints
// ==========================================================================

// 1. حالة الاتصال بقاعدة البيانات
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        databaseConnected: db.isConnected,
        databaseType: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// 2. الأحياء ورسوم التوصيل
app.get('/api/neighborhoods', async (req, res) => {
    try {
        if (!db.isConnected) {
            return res.json([
                { id: 1, name: 'حي المعلمين', fee: 2000 },
                { id: 2, name: 'حي الربيع', fee: 2000 },
                { id: 3, name: 'حي السراي', fee: 1500 },
                { id: 4, name: 'الشارع العام / السوق', fee: 1500 },
                { id: 5, name: 'حي العسكري', fee: 2500 }
            ]);
        }
        const rows = await db.query('SELECT id, name, delivery_fee as fee FROM neighborhoods ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. التصنيفات
app.get('/api/categories', async (req, res) => {
    try {
        if (!db.isConnected) {
            return res.json([
                { id: 'all', name: 'الكل', icon: 'fa-border-all' },
                { id: 'mandi', name: 'مندي وقوزي', icon: 'fa-utensils' },
                { id: 'grills', name: 'مشاوي وكباب', icon: 'fa-drumstick-bite' },
                { id: 'shawarma', name: 'شاورما وصاج', icon: 'fa-bread-slice' },
                { id: 'burger', name: 'برجر وسريع', icon: 'fa-burger' },
                { id: 'pizza', name: 'بيتزا وفطاير', icon: 'fa-pizza-slice' },
                { id: 'fish', name: 'سمك مسكوف', icon: 'fa-fish' },
                { id: 'drinks', name: 'عصائر وكافيه', icon: 'fa-mug-hot' },
                { id: 'sweets', name: 'حلويات وكنافة', icon: 'fa-ice-cream' }
            ]);
        }
        const rows = await db.query('SELECT id, name, icon FROM categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. المطاعم وقوائم الطعام
app.get('/api/restaurants', async (req, res) => {
    try {
        if (!db.isConnected) {
            return res.json([]);
        }
        const { category } = req.query;
        let sql = 'SELECT id, name, category_id as category, rating, rating_count as ratingCount, delivery_time as deliveryTime, delivery_fee as deliveryFee, badge, image, cover, description FROM restaurants WHERE is_active = 1';
        let params = [];

        if (category && category !== 'all') {
            sql += ' AND category_id = ?';
            params.push(category);
        }

        const restaurants = await db.query(sql, params);
        
        // جلب عناصر المنيو لكل مطعم
        for (let rest of restaurants) {
            const menu = await db.query('SELECT id, name, description, price, image, popular FROM menu_items WHERE restaurant_id = ? AND is_available = 1', [rest.id]);
            rest.menu = menu.map(m => ({ ...m, popular: Boolean(m.popular) }));
        }

        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/restaurants/:id', async (req, res) => {
    try {
        if (!db.isConnected) return res.status(404).json({ error: 'Restaurant not found' });
        const [rest] = await db.query('SELECT id, name, category_id as category, rating, rating_count as ratingCount, delivery_time as deliveryTime, delivery_fee as deliveryFee, badge, image, cover, description FROM restaurants WHERE id = ?', [req.params.id]);
        if (!rest) return res.status(404).json({ error: 'Restaurant not found' });

        const menu = await db.query('SELECT id, name, description, price, image, popular FROM menu_items WHERE restaurant_id = ? AND is_available = 1', [rest.id]);
        rest.menu = menu.map(m => ({ ...m, popular: Boolean(m.popular) }));

        res.json(rest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. الطلبات (Orders)
app.post('/api/orders', async (req, res) => {
    try {
        const { customerUid, customerName, customerPhone, neighborhoodName, addressDetails, notes, paymentMethod, subtotal, deliveryFee, totalPrice, items } = req.body;
        
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        
        if (db.isConnected) {
            await db.query(
                `INSERT INTO orders (id, customer_uid, customer_name, customer_phone, neighborhood_name, address_details, notes, payment_method, subtotal, delivery_fee, total_price, items_json, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
                [orderId, customerUid || null, customerName, customerPhone, neighborhoodName, addressDetails || '', notes || '', paymentMethod || 'cash', subtotal, deliveryFee, totalPrice, JSON.stringify(items)]
            );
        }

        const newOrder = {
            id: orderId,
            customerUid,
            customerName,
            customerPhone,
            neighborhoodName,
            addressDetails,
            notes,
            paymentMethod,
            subtotal,
            deliveryFee,
            totalPrice,
            items,
            status: 'new',
            createdAt: new Date().toISOString()
        };

        res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        if (!db.isConnected) return res.json([]);
        const { role, uid } = req.query;
        let sql = 'SELECT id, customer_uid as customerUid, customer_name as customerName, customer_phone as customerPhone, neighborhood_name as neighborhoodName, address_details as addressDetails, notes, payment_method as paymentMethod, subtotal, delivery_fee as deliveryFee, total_price as totalPrice, items_json as items, status, driver_uid as driverUid, driver_name as driverName, created_at as createdAt FROM orders';
        let params = [];

        if (role === 'customer' && uid) {
            sql += ' WHERE customer_uid = ?';
            params.push(uid);
        } else if (role === 'driver') {
            sql += ' WHERE status IN ("new", "preparing", "delivering") OR driver_uid = ?';
            params.push(uid);
        }

        sql += ' ORDER BY created_at DESC';
        const rows = await db.query(sql, params);

        const orders = rows.map(r => ({
            ...r,
            items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
        }));

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status, driverUid, driverName } = req.body;
        const orderId = req.params.id;

        if (db.isConnected) {
            let sql = 'UPDATE orders SET status = ?';
            let params = [status];

            if (driverUid) {
                sql += ', driver_uid = ?, driver_name = ?';
                params.push(driverUid, driverName || '');
            }

            sql += ' WHERE id = ?';
            params.push(orderId);

            await db.query(sql, params);
        }

        res.json({ success: true, orderId, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. المصادقة والمستخدمين (Auth)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
        
        if (db.isConnected) {
            await db.query(
                `INSERT INTO users (uid, display_name, email, password, role, phone, provider)
                 VALUES (?, ?, ?, ?, ?, ?, 'email')`,
                [uid, name, email, password, role || 'customer', phone || '']
            );
        }

        const user = {
            uid,
            displayName: name,
            email,
            role: role || 'customer',
            phone,
            provider: 'email'
        };

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (db.isConnected) {
            const [rows] = await db.query('SELECT uid, display_name as displayName, email, role, restaurant_id as restaurantId, phone, photo_url as photoUrl FROM users WHERE email = ? AND password = ?', [email, password]);
            if (rows && rows.length) {
                return res.json({ success: true, user: rows[0] });
            } else {
                return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
            }
        }

        // Mock fallback if DB is offline
        const user = {
            uid: 'usr_' + Math.random().toString(36).substr(2, 9),
            displayName: email.split('@')[0],
            email: email,
            role: 'customer',
            provider: 'email'
        };
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// تشغيل الخادم وتصديره لـ Vercel
if (require.main === module) {
    db.initDB().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 خادم مطاعم النعمانية (MySQL API) يعمل الآن على: http://localhost:${PORT}`);
        });
    });
} else {
    db.initDB();
}

module.exports = app;

