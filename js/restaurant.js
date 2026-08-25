document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let restaurantId = null;
    let restaurantData = null; // Store full restaurant data locally

    const ordersContainer = document.getElementById('ordersContainer');
    const ordersCount = document.getElementById('ordersCount');
    const menuGridContainer = document.getElementById('menuGridContainer');
    const offersContainer = document.getElementById('offersContainer');
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    const dashboardRestName = document.getElementById('dashboardRestName');
    const dashboardRestType = document.getElementById('dashboardRestType');
    const dashboardRestRating = document.getElementById('dashboardRestRating');
    const toggleActiveStatus = document.getElementById('toggleActiveStatus');
    const activeStatusLabel = document.getElementById('activeStatusLabel');
    
    // Auto Hours inputs
    const enableAutoHours = document.getElementById('enableAutoHours');
    const openTimeInput = document.getElementById('openTimeInput');
    const closeTimeInput = document.getElementById('closeTimeInput');

    let salesChart = null;
    let selectedImageUrl = '';

    // Standard Food Images Presets (Unsplash high quality)
    const PRELOADED_FOOD_IMAGES = [
        { name: 'مشاوي وكباب', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80' },
        { name: 'برجر وسريع', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' },
        { name: 'بيتزا وفطاير', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80' },
        { name: 'شاورما وصاج', url: 'https://images.unsplash.com/photo-1644704170910-a0cdf183649b?auto=format&fit=crop&w=500&q=80' },
        { name: 'مندي ورز', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80' },
        { name: 'بروستد مقرمش', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=500&q=80' },
        { name: 'حلويات وكنافة', url: 'https://images.unsplash.com/photo-1514517604298-cf80e0fb7f1e?auto=format&fit=crop&w=500&q=80' },
        { name: 'عصائر ومشروبات', url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=500&q=80' }
    ];

    // Tab Switching Functionality
    window.switchDashboardTab = function(tabId) {
        // Remove active class from all tabs & buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab & button
        const selectedBtn = document.getElementById(`btn-tab-${tabId}`);
        const selectedContent = document.getElementById(`tab-${tabId}`);
        if (selectedBtn) selectedBtn.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');

        // Handle leafet map resizing if map was inside
        if (tabId === 'history' && salesChart) {
            salesChart.update();
        }
    };

    // Grace period redirect to index.html if user is not authenticated within 1.5 seconds
    let redirectTimeout = setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);

    // Authentication check
    authManager.onAuthStateChanged(async (user) => {
        if (user) {
            clearTimeout(redirectTimeout);
            currentUser = user;
            
            // Fetch user document from Firestore to get restaurantId
            const db = authManager.db;
            if (db) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists && userDoc.data().role === 'restaurant') {
                        restaurantId = userDoc.data().restaurantId;
                        initDashboard();
                    } else {
                        // Fallback to r1 for testing if user role is not restaurant
                        restaurantId = 'rest_' + user.uid;
                        initDashboard();
                    }
                } catch (e) {
                    console.error("Error fetching user profile:", e);
                    restaurantId = 'rest_' + user.uid;
                    initDashboard();
                }
            } else {
                restaurantId = 'rest_' + user.uid;
                initDashboard();
            }
        }
    });

    function initDashboard() {
        listenToRestaurantProfile();
        listenToOrders();
        loadMenu();
        loadOffers();
        initSalesChart();
        buildImagePresetsSelector();
    }

    // --- RESTAURANT PROFILE SYNC & AUTO-HOURS LOGIC ---
    function listenToRestaurantProfile() {
        const db = authManager.db;
        
        let isResolved = false;
        const fallbackTimeout = setTimeout(() => {
            if (!isResolved) {
                console.warn("Firestore profile fetch timed out. Loading local fallback.");
                loadProfileFromLocalFallback();
            }
        }, 1200);

        if (!db || !restaurantId) {
            clearTimeout(fallbackTimeout);
            loadProfileFromLocalFallback();
            return;
        }

        db.collection('restaurants').doc(restaurantId).onSnapshot(doc => {
            isResolved = true;
            clearTimeout(fallbackTimeout);
            if (doc.exists) {
                restaurantData = doc.data();
                applyProfileDataToUI(restaurantData);
            } else {
                loadProfileFromLocalFallback();
            }
        }, err => {
            console.error("Error getting restaurant profile:", err);
            clearTimeout(fallbackTimeout);
            loadProfileFromLocalFallback();
        });
    }

    function loadProfileFromLocalFallback() {
        const savedData = localStorage.getItem('fallback_restaurant_data_' + restaurantId);
        if (savedData) {
            restaurantData = JSON.parse(savedData);
            applyProfileDataToUI(restaurantData);
        } else {
            // Mock default
            restaurantData = {
                name: 'مطعم النعمانية للوجبات الشهية',
                type: 'commercial',
                rating: 5.0,
                isActive: true,
                menu: [],
                offers: [],
                enableAutoHours: false,
                openTime: '12:00',
                closeTime: '23:30'
            };
            applyProfileDataToUI(restaurantData);
        }
    }

    function applyProfileDataToUI(data) {
        dashboardRestName.textContent = data.name || 'مطعم النعمانية';
        document.getElementById('headerRestTitle').textContent = data.name || 'إدارة المطعم';
        dashboardRestType.textContent = data.type === 'home' ? 'مطبخ منزلي' : 'مطعم تجاري';
        dashboardRestRating.textContent = data.rating ? data.rating.toFixed(1) : '5.0';
        
        toggleActiveStatus.checked = data.isActive !== false;
        updateStatusLabel(toggleActiveStatus.checked);

        // Apply Working Hours to inputs
        enableAutoHours.checked = data.enableAutoHours === true;
        openTimeInput.value = data.openTime || '12:00';
        closeTimeInput.value = data.closeTime || '23:30';
    }

    function updateStatusLabel(isActive) {
        if (isActive) {
            activeStatusLabel.textContent = 'مفتوح (يستقبل الطلبات)';
            activeStatusLabel.style.color = 'var(--color-success)';
        } else {
            activeStatusLabel.textContent = 'مغلق (مؤقتاً)';
            activeStatusLabel.style.color = 'var(--text-muted)';
        }
    }

    window.toggleRestaurantStatus = function(isActive) {
        const db = authManager.db;
        updateStatusLabel(isActive);

        if (restaurantData) {
            restaurantData.isActive = isActive;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            isActive: isActive
        }).catch(err => {
            console.error("Error updating status:", err);
        });
    };

    // Save Working Hours Setting
    window.saveWorkingHours = function() {
        const db = authManager.db;
        const openTime = openTimeInput.value;
        const closeTime = closeTimeInput.value;

        if (restaurantData) {
            restaurantData.openTime = openTime;
            restaurantData.closeTime = closeTime;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        const updateData = { openTime, closeTime };

        if (!db || !restaurantId) {
            alert('تم حفظ أوقات الدوام محلياً بنجاح!');
            return;
        }

        db.collection('restaurants').doc(restaurantId).update(updateData).then(() => {
            alert('تم تحديث أوقات الدوام بنجاح في السيرفر!');
        }).catch(err => {
            console.error("Error saving hours:", err);
            alert('تعذر الحفظ في السيرفر، تم حفظها محلياً على المتصفح.');
        });
    };

    window.saveAutoHoursToggle = function(isEnabled) {
        const db = authManager.db;
        if (restaurantData) {
            restaurantData.enableAutoHours = isEnabled;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            enableAutoHours: isEnabled
        }).catch(err => console.error("Error toggling auto hours:", err));
    };


    // --- LIVE ORDERS LISTENING ---
    function listenToOrders() {
        const db = authManager.db;
        if (!db || !restaurantId) {
            ordersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding:20px 0;">أنت تعمل في وضع عدم الاتصال. يتم حفظ الطلبات محلياً.</p>';
            ordersCount.textContent = '(0)';
            return;
        }

        db.collection('orders')
            .where('restaurantId', '==', restaurantId)
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                ordersContainer.innerHTML = '';
                let count = 0;

                if (snapshot.empty) {
                    ordersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding:20px 0;">لا توجد طلبات جارية حالياً.</p>';
                    ordersCount.textContent = '(0)';
                    return;
                }

                snapshot.forEach(doc => {
                    const order = doc.data();
                    order.id = doc.id;
                    // Only show pending, preparing, ready orders
                    if (order.status !== 'delivered') {
                        count++;
                        ordersContainer.appendChild(createOrderCard(order));
                    }
                });
                
                ordersCount.textContent = `(${count})`;
                
                // Alert on new order
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        playAlertSound();
                    }
                });

                // Update Sales Chart with live data
                updateChartWithOrders(snapshot);
            }, error => {
                console.error("Error listening to orders:", error);
                ordersContainer.innerHTML = '<p style="text-align: center; color: var(--color-danger); padding:20px 0;">خطأ في تحميل الطلبات المباشرة.</p>';
            });
    }

    function playAlertSound() {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch(e) { console.warn("Sound blocked by browser"); }
    }

    function createOrderCard(order) {
        const div = document.createElement('div');
        div.className = `order-card status-${order.status}`;
        
        let statusLabel = 'قيد الانتظار';
        if (order.status === 'preparing') statusLabel = 'جاري التجهيز';
        else if (order.status === 'ready') statusLabel = 'جاهز للتسليم';

        let itemsHtml = '';
        if (order.items && order.items.length) {
            order.items.forEach(item => {
                itemsHtml += `<div>${item.qty}x ${item.name} (${item.price} د.ع)</div>`;
            });
        }

        let actionHtml = '';
        if (order.status === 'pending' || order.status === 'preparing') {
            if (order.status === 'pending') {
                actionHtml = `<button class="btn-action btn-accept" onclick="updateOrderStatus('${order.id}', 'preparing')">قبول وتجهيز</button>`;
            } else {
                actionHtml = `<button class="btn-action btn-ready" onclick="updateOrderStatus('${order.id}', 'ready')">أصبح جاهزاً</button>`;
            }
        } else if (order.status === 'ready') {
            actionHtml = `<button class="btn-action btn-delivered" onclick="updateOrderStatus('${order.id}', 'delivered')">تسليم للمندوب</button>`;
        }

        div.innerHTML = `
            <div class="order-header">
                <span>طلب #${order.id.substring(0, 5)}</span>
                <span style="color: var(--terracotta); font-weight:900;">${statusLabel}</span>
            </div>
            <div style="margin-bottom: 8px; font-size:0.85rem;"><strong>العميل:</strong> ${order.customerName} - ${order.phone}</div>
            <div class="order-items" style="background:#FAF8F6; padding:8px; border-radius:6px; margin-bottom:8px; font-size:0.8rem;">
                ${itemsHtml}
            </div>
            <div style="margin-bottom: 10px; font-weight: bold; font-size:0.85rem;">الإجمالي: ${order.total} د.ع</div>
            <div class="order-actions">
                ${actionHtml}
            </div>
        `;
        return div;
    }

    window.updateOrderStatus = function(orderId, newStatus) {
        const db = authManager.db;
        if (!db) return;
        
        db.collection('orders').doc(orderId).update({
            status: newStatus
        }).catch(err => {
            console.error("Error updating order:", err);
        });
    };


    // --- MENU BUILDER LOGIC ---
    function loadMenu() {
        const db = authManager.db;

        let isResolved = false;
        const fallbackTimeout = setTimeout(() => {
            if (!isResolved) {
                console.warn("Firestore menu fetch timed out. Loading local fallback.");
                loadMenuFromLocalFallback();
            }
        }, 1200);

        if (!db || !restaurantId) {
            clearTimeout(fallbackTimeout);
            loadMenuFromLocalFallback();
            return;
        }

        db.collection('restaurants').doc(restaurantId).get().then(doc => {
            isResolved = true;
            clearTimeout(fallbackTimeout);
            
            if (doc.exists && doc.data().menu) {
                renderMenuUI(doc.data().menu);
            } else {
                loadMenuFromLocalFallback();
            }
        }).catch(err => {
            console.error("Error loading menu:", err);
            clearTimeout(fallbackTimeout);
            loadMenuFromLocalFallback();
        });
    }

    function loadMenuFromLocalFallback() {
        const savedData = localStorage.getItem('fallback_restaurant_data_' + restaurantId);
        if (savedData) {
            const restData = JSON.parse(savedData);
            if (restData.menu) {
                renderMenuUI(restData.menu);
                return;
            }
        }
        renderMenuUI([]);
    }

    function renderMenuUI(menuItems) {
        menuGridContainer.innerHTML = '';
        if (!menuItems || menuItems.length === 0) {
            menuGridContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1; padding: 20px 0;">المنيو فارغ. أضف بعض الأطباق للبدء!</p>';
            return;
        }

        menuItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-item-card';
            
            const fallbackImg = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80';
            
            card.innerHTML = `
                <img src="${item.image || fallbackImg}" class="menu-item-image" alt="${item.name}">
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <span>${item.price} د.ع</span>
                </div>
                <div class="menu-item-actions">
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight:700; cursor: pointer;">
                        <input type="checkbox" ${item.isAvailable !== false ? 'checked' : ''} onchange="toggleItemAvailability('${item.id}', this.checked)"> متوفر
                    </label>
                    <button onclick="deleteMenuItem('${item.id}')" style="background:transparent; border:none; color:var(--color-danger); cursor:pointer; font-size:0.85rem;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            menuGridContainer.appendChild(card);
        });
    }

    // Modal Actions
    window.openAddDishDialog = function() {
        document.getElementById('addDishDialog').classList.add('active');
        selectedImageUrl = PRELOADED_FOOD_IMAGES[0].url; // Default selected preset
        selectPresetImageOption(0);
    };

    window.closeAddDishDialog = function() {
        document.getElementById('addDishDialog').classList.remove('active');
        document.getElementById('newDishName').value = '';
        document.getElementById('newDishPrice').value = '';
        document.getElementById('newDishDesc').value = '';
    };

    function buildImagePresetsSelector() {
        const grid = document.getElementById('imageSelectorGrid');
        grid.innerHTML = '';
        PRELOADED_FOOD_IMAGES.forEach((img, idx) => {
            const opt = document.createElement('div');
            opt.className = 'image-option';
            opt.id = `img-opt-${idx}`;
            opt.onclick = () => {
                selectedImageUrl = img.url;
                selectPresetImageOption(idx);
            };
            opt.innerHTML = `
                <img src="${img.url}" alt="${img.name}">
                <span>${img.name}</span>
            `;
            grid.appendChild(opt);
        });
    }

    function selectPresetImageOption(activeIndex) {
        document.querySelectorAll('.image-option').forEach(el => el.classList.remove('selected'));
        const activeEl = document.getElementById(`img-opt-${activeIndex}`);
        if (activeEl) activeEl.classList.add('selected');
    }

    window.saveNewDishItem = function() {
        const name = document.getElementById('newDishName').value.trim();
        const price = parseFloat(document.getElementById('newDishPrice').value);
        const description = document.getElementById('newDishDesc').value.trim();

        if (!name || isNaN(price)) {
            alert('يرجى ملء الحقول المطلوبة (اسم الوجبة والسعر)');
            return;
        }

        const newDish = {
            id: 'm_' + Math.random().toString(36).substr(2, 9),
            name: name,
            price: price,
            description: description,
            image: selectedImageUrl,
            isAvailable: true
        };

        let currentMenu = (restaurantData && restaurantData.menu) ? [...restaurantData.menu] : [];
        currentMenu.push(newDish);

        // Update local state
        if (restaurantData) {
            restaurantData.menu = currentMenu;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        renderMenuUI(currentMenu);
        closeAddDishDialog();

        // Sync with Firestore
        const db = authManager.db;
        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            menu: currentMenu
        }).catch(err => {
            console.error("Error saving new menu item in cloud:", err);
        });
    };

    window.toggleItemAvailability = function(itemId, isAvailable) {
        let currentMenu = (restaurantData && restaurantData.menu) ? [...restaurantData.menu] : [];
        currentMenu = currentMenu.map(item => {
            if (item.id === itemId) item.isAvailable = isAvailable;
            return item;
        });

        if (restaurantData) {
            restaurantData.menu = currentMenu;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        const db = authManager.db;
        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            menu: currentMenu
        }).catch(err => console.error("Error toggling item:", err));
    };

    window.deleteMenuItem = function(itemId) {
        if (!confirm('هل أنت متأكد من حذف هذا الطبق من المنيو؟')) return;

        let currentMenu = (restaurantData && restaurantData.menu) ? [...restaurantData.menu] : [];
        currentMenu = currentMenu.filter(item => item.id !== itemId);

        if (restaurantData) {
            restaurantData.menu = currentMenu;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        renderMenuUI(currentMenu);

        const db = authManager.db;
        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            menu: currentMenu
        }).catch(err => console.error("Error deleting item:", err));
    };


    // --- OFFERS MANAGEMENT ---
    function loadOffers() {
        const db = authManager.db;
        
        let isResolved = false;
        const fallbackTimeout = setTimeout(() => {
            if (!isResolved) {
                loadOffersFromLocalFallback();
            }
        }, 1200);

        if (!db || !restaurantId) {
            clearTimeout(fallbackTimeout);
            loadOffersFromLocalFallback();
            return;
        }

        db.collection('restaurants').doc(restaurantId).get().then(doc => {
            isResolved = true;
            clearTimeout(fallbackTimeout);
            if (doc.exists && doc.data().offers) {
                renderOffersUI(doc.data().offers);
            } else {
                loadOffersFromLocalFallback();
            }
        }).catch(err => {
            console.error("Error loading offers:", err);
            clearTimeout(fallbackTimeout);
            loadOffersFromLocalFallback();
        });
    }

    function loadOffersFromLocalFallback() {
        const savedData = localStorage.getItem('fallback_restaurant_data_' + restaurantId);
        if (savedData) {
            const restData = JSON.parse(savedData);
            if (restData.offers) {
                renderOffersUI(restData.offers);
                return;
            }
        }
        renderOffersUI([]);
    }

    function renderOffersUI(offers) {
        offersContainer.innerHTML = '';
        if (!offers || offers.length === 0) {
            offersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">لا توجد عروض نشطة حالياً. أنشئ أول عرض لتنشيط مبيعاتك!</p>';
            return;
        }

        offers.forEach(offer => {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.style.borderColor = 'var(--color-success)';
            
            let badgeText = 'خصم مادي';
            if (offer.type === 'free_delivery') badgeText = 'توصيل مجاني';
            else if (offer.type === 'buy1get1') badgeText = '1+1 مجاناً';
            else if (offer.type === 'discount') badgeText = `خصم ${offer.value}%`;

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                    <strong style="color:var(--text-dark);">${offer.title}</strong>
                    <span style="background:var(--color-success-light); color:var(--color-success); font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:4px;">${badgeText}</span>
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted);">${offer.description || 'لا يوجد وصف.'}</p>
                <div style="display:flex; justify-content:flex-end; margin-top:8px; border-top:1px dashed var(--border-light); padding-top:6px;">
                    <button onclick="deleteOfferItem('${offer.id}')" style="background:transparent; border:none; color:var(--color-danger); cursor:pointer; font-size:0.8rem; font-weight:bold;"><i class="fas fa-trash-can"></i> إيقاف العرض</button>
                </div>
            `;
            offersContainer.appendChild(card);
        });
    }

    window.openAddOfferDialog = function() {
        document.getElementById('addOfferDialog').classList.add('active');
    };

    window.closeAddOfferDialog = function() {
        document.getElementById('addOfferDialog').classList.remove('active');
        document.getElementById('newOfferTitle').value = '';
        document.getElementById('newOfferDesc').value = '';
        document.getElementById('newOfferValue').value = '';
    };

    window.adjustOfferTypeFields = function(type) {
        const valGroup = document.getElementById('offerDiscountValueGroup');
        if (type === 'discount') {
            valGroup.style.display = 'block';
        } else {
            valGroup.style.display = 'none';
        }
    };

    window.saveNewOfferItem = function() {
        const title = document.getElementById('newOfferTitle').value.trim();
        const desc = document.getElementById('newOfferDesc').value.trim();
        const type = document.getElementById('newOfferType').value;
        const val = parseFloat(document.getElementById('newOfferValue').value);

        if (!title) {
            alert('يرجى ملء عنوان العرض الترويجي');
            return;
        }

        if (type === 'discount' && (isNaN(val) || val < 1 || val > 99)) {
            alert('يرجى تحديد نسبة خصم صحيحة بين 1% و 99%');
            return;
        }

        const newOffer = {
            id: 'o_' + Math.random().toString(36).substr(2, 9),
            title: title,
            description: desc,
            type: type,
            value: type === 'discount' ? val : 0,
            isActive: true
        };

        let currentOffers = (restaurantData && restaurantData.offers) ? [...restaurantData.offers] : [];
        currentOffers.push(newOffer);

        if (restaurantData) {
            restaurantData.offers = currentOffers;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        renderOffersUI(currentOffers);
        closeAddOfferDialog();

        // Sync with Firestore
        const db = authManager.db;
        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            offers: currentOffers
        }).catch(err => console.error("Error saving promo offer:", err));
    };

    window.deleteOfferItem = function(offerId) {
        if (!confirm('هل تريد إلغاء وإيقاف هذا العرض الترويجي؟')) return;

        let currentOffers = (restaurantData && restaurantData.offers) ? [...restaurantData.offers] : [];
        currentOffers = currentOffers.filter(o => o.id !== offerId);

        if (restaurantData) {
            restaurantData.offers = currentOffers;
            localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(restaurantData));
        }

        renderOffersUI(currentOffers);

        const db = authManager.db;
        if (!db || !restaurantId) return;

        db.collection('restaurants').doc(restaurantId).update({
            offers: currentOffers
        }).catch(err => console.error("Error deleting offer:", err));
    };


    // --- WEEKLY SALES ANALYTICS CHART ---
    function initSalesChart() {
        const ctx = document.getElementById('salesChart').getContext('2d');
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
                datasets: [{
                    label: 'المبيعات (بالألف د.ع)',
                    data: [120, 190, 80, 150, 240, 300, 180], // Default mock values
                    backgroundColor: 'rgba(192, 74, 38, 0.7)',
                    borderColor: 'rgba(192, 74, 38, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function updateChartWithOrders(snapshot) {
        if (!salesChart) return;
        
        const daysSales = [0, 0, 0, 0, 0, 0, 0];
        
        snapshot.forEach(doc => {
            const order = doc.data();
            if (order.total && order.timestamp) {
                const date = order.timestamp.toDate ? order.timestamp.toDate() : new Date(order.timestamp);
                const dayIndex = date.getDay(); // 0: Sunday, 1: Monday, etc.
                daysSales[dayIndex] += (order.total / 1000); // Scale to thousands (د.ع)
            }
        });

        const totalSales = daysSales.reduce((a, b) => a + b, 0);
        if (totalSales > 0) {
            salesChart.data.datasets[0].data = daysSales;
            salesChart.update();
        }
    }
});
