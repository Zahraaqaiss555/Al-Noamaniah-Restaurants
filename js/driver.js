document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    const ordersContainer = document.getElementById('ordersContainer');
    const countAvailable = document.getElementById('countAvailable');
    const countMyOrders = document.getElementById('countMyOrders');
    
    let currentTab = 'available'; // 'available' or 'my_orders'
    
    // Map variables
    let driverMap = null;
    let customerMarker = null;

    document.getElementById('tabAvailable').addEventListener('click', () => switchTab('available'));
    document.getElementById('tabMyOrders').addEventListener('click', () => switchTab('my_orders'));

    // Grace period check user auth
    if (window.authManager) {
        authManager.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                initDashboard();
            } else {
                currentUser = { uid: 'usr_driver1', displayName: 'سائق النعمانية 1', role: 'driver' };
                initDashboard();
            }
        });
    } else {
        currentUser = { uid: 'usr_driver1', displayName: 'سائق النعمانية 1', role: 'driver' };
        initDashboard();
    }

    function initDashboard() {
        fetchOrders();
        setInterval(fetchOrders, 5000); // تحديث دوري من قاعدة بيانات MySQL
        switchTab('available');
    }

    function switchTab(tab) {
        currentTab = tab;
        document.getElementById('tabAvailable').style.opacity = tab === 'available' ? '1' : '0.5';
        document.getElementById('tabMyOrders').style.opacity = tab === 'my_orders' ? '1' : '0.5';
        renderCurrentTab();
    }

    let availableOrders = [];
    let myOrders = [];

    async function fetchOrders() {
        if (!window.apiClient) return;
        try {
            const allOrders = await window.apiClient.getOrders('driver', currentUser ? currentUser.uid : null);
            
            availableOrders = allOrders.filter(o => o.status === 'new' || o.status === 'preparing' || !o.driverUid);
            myOrders = allOrders.filter(o => o.driverUid === (currentUser ? currentUser.uid : null) || o.status === 'delivering');

            if (countAvailable) countAvailable.textContent = availableOrders.length;
            if (countMyOrders) countMyOrders.textContent = myOrders.length;

            renderCurrentTab();
        } catch (e) {
            console.warn("Failed to fetch orders from MySQL API:", e);
        }
    }

    function renderCurrentTab() {
        if (!ordersContainer) return;
        ordersContainer.innerHTML = '';
        const list = currentTab === 'available' ? availableOrders : myOrders;
        
        if (list.length === 0) {
            ordersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد طلبات في هذه القائمة.</p>';
            return;
        }

        list.forEach(order => {
            ordersContainer.appendChild(createOrderCard(order));
        });
    }

    function createOrderCard(order) {
        const div = document.createElement('div');
        div.className = `order-card ${currentTab === 'my_orders' ? 'active' : ''}`;
        
        let actionBtn = '';
        if (currentTab === 'available') {
            actionBtn = `<button class="btn-action" onclick="acceptOrder('${order.id}')">استلام الطلب وتوصيله</button>`;
        } else {
            actionBtn = `
                <a href="tel:${order.customerPhone || '07700000000'}" class="btn-call"><i class="fas fa-phone-alt"></i> اتصال بالعميل</a>
                <button class="btn-action btn-finish" onclick="finishOrder('${order.id}')">تأكيد التسليم بنجاح</button>
            `;
            if (order.lat && order.lng) {
                actionBtn = `<button class="btn-action" style="background:var(--terracotta); margin-bottom:10px;" onclick="showMap(${order.lat}, ${order.lng})"><i class="fas fa-map-marker-alt"></i> عرض الموقع على الخريطة</button>` + actionBtn;
            }
        }

        div.innerHTML = `
            <div class="order-header">
                <span>طلب #${order.id}</span>
                <span>المبلغ: ${order.totalPrice || order.total || 0} د.ع</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>العميل:</strong> ${order.customerName} - ${order.neighborhoodName || order.neighborhood || ''}<br>
                <strong>العنوان التفصيلي:</strong> ${order.addressDetails || order.address || 'حي المعلمين'}
            </div>
            ${actionBtn}
        `;
        return div;
    }

    window.acceptOrder = function(orderId) {
        if (!window.apiClient) return;

        window.apiClient.updateOrderStatus(
            orderId,
            'delivering',
            currentUser ? currentUser.uid : 'usr_driver1',
            currentUser ? currentUser.displayName : 'سائق النعمانية'
        ).then(() => {
            fetchOrders();
            switchTab('my_orders');
        }).catch(err => {
            console.error("Error accepting order:", err);
            alert("حدث خطأ أثناء استلام الطلب.");
        });
    };

    window.finishOrder = function(orderId) {
        if (!window.apiClient) return;
        
        if (confirm('هل أنت متأكد من إتمام تسليم هذا الطلب واستلام المبلغ النقدي؟')) {
            window.apiClient.updateOrderStatus(orderId, 'completed').then(() => {
                fetchOrders();
            }).catch(err => console.error(err));
        }
    };

    // Map functionality
    window.showMap = function(lat, lng) {
        const modal = document.getElementById('mapModal');
        if (modal) modal.style.display = 'flex';
        
        if (typeof L !== 'undefined' && document.getElementById('driverMap')) {
            if (!driverMap) {
                driverMap = L.map('driverMap').setView([lat, lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(driverMap);
                customerMarker = L.marker([lat, lng]).addTo(driverMap);
            } else {
                driverMap.setView([lat, lng], 15);
                customerMarker.setLatLng([lat, lng]);
                driverMap.invalidateSize();
            }
        }
    };

    window.closeMapModal = function() {
        const modal = document.getElementById('mapModal');
        if (modal) modal.style.display = 'none';
    };
});
