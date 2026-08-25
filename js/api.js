// ==========================================================================
// Al-Noamaniah MySQL API Client Layer
// ==========================================================================

const API_BASE_URL = window.location.origin;

class AlNoamaniahAPI {
    // 1. التحقق من الاتصال
    async checkStatus() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/status`);
            return await res.json();
        } catch (e) {
            return { status: 'offline', databaseConnected: false };
        }
    }

    // 2. الأحياء
    async getNeighborhoods() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/neighborhoods`);
            return await res.json();
        } catch (e) {
            console.warn("API Error (Neighborhoods), fallback to local data", e);
            return typeof APP_DATA !== 'undefined' ? APP_DATA.neighborhoods : [];
        }
    }

    // 3. التصنيفات
    async getCategories() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories`);
            return await res.json();
        } catch (e) {
            console.warn("API Error (Categories), fallback to local data", e);
            return typeof APP_DATA !== 'undefined' ? APP_DATA.categories : [];
        }
    }

    // 4. المطاعم وقوائم الطعام
    async getRestaurants(category = 'all') {
        try {
            const res = await fetch(`${API_BASE_URL}/api/restaurants?category=${encodeURIComponent(category)}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data;
            return typeof APP_DATA !== 'undefined' ? APP_DATA.restaurants : [];
        } catch (e) {
            console.warn("API Error (Restaurants), fallback to local data", e);
            return typeof APP_DATA !== 'undefined' ? APP_DATA.restaurants : [];
        }
    }

    async getRestaurantById(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}`);
            if (!res.ok) throw new Error('Not found');
            return await res.json();
        } catch (e) {
            if (typeof APP_DATA !== 'undefined') {
                return APP_DATA.restaurants.find(r => r.id === id);
            }
            return null;
        }
    }

    // 5. إدارة الطلبات
    async createOrder(orderData) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            return await res.json();
        } catch (e) {
            console.error("Failed to create order:", e);
            throw e;
        }
    }

    async getOrders(role = 'customer', uid = null) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders?role=${role}&uid=${uid || ''}`);
            return await res.json();
        } catch (e) {
            console.warn("API Error (Get Orders)", e);
            return [];
        }
    }

    async updateOrderStatus(orderId, status, driverUid = null, driverName = null) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, driverUid, driverName })
            });
            return await res.json();
        } catch (e) {
            console.error("Failed to update order status:", e);
            throw e;
        }
    }

    // 6. تسجيل الحساب والمصادقة (Auth via MySQL)
    async register(name, email, password, role = 'customer', phone = '') {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, phone })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'فشل إنشاء الحساب');
            return data.user;
        } catch (e) {
            throw e;
        }
    }

    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'بيانات الدخول غير صحيحة');
            return data.user;
        } catch (e) {
            throw e;
        }
    }
}

window.apiClient = new AlNoamaniahAPI();
