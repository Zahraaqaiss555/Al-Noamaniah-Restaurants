// ==========================================================================
// Al-Noamaniah Enterprise Application Engine & Firebase Integration
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentUser: null,
        currentView: 'splash-screen', 
        selectedCategory: 'all',
        searchQuery: '',
        activeRestaurant: APP_DATA.restaurants[0],
        allRestaurants: [...APP_DATA.restaurants],
        cart: [],
        orders: JSON.parse(localStorage.getItem('al_noamaniah_orders')) || [
            {
                id: 'ORD-2023-8942',
                displayId: '#89',
                customerName: 'أحمد محمد',
                phone: '07801122334',
                neighborhood: 'حي المعلمين - شارع الأطباء',
                restaurantId: 'r1',
                restaurantName: 'مطبخ وحنيذ الشيوخ',
                items: [
                    { name: 'وجبة مندي لحم غنم سبيشل', qty: 1, price: 14000 },
                    { name: 'مقبلات مشكلة وسلطة خضراء', qty: 1, price: 7000 }
                ],
                notes: 'بدون بصل، اللحم محمر',
                subtotal: 21000,
                deliveryFee: 2000,
                total: 23000,
                status: 'preparing',
                statusLabel: 'قيد التحضير',
                estTime: '25 - 35 دقيقة',
                time: 'منذ 10 دقائق',
                driverName: 'جاري تعيين مندوب',
                driverPhone: '07800001122'
            }
        ],
        activeTrackingOrder: null,
        soundEnabled: true
    };

    const elements = {
        splashScreenView: document.getElementById('splashScreenView'),
        authScreenView: document.getElementById('authScreenView'),
        mainAppHeader: document.getElementById('mainAppHeader'),
        mainBottomNav: document.getElementById('mainBottomNav'),

        userProfileBtn: document.getElementById('userProfileBtn'),
        headerUserAvatar: document.getElementById('headerUserAvatar'),
        headerDefaultUserIcon: document.getElementById('headerDefaultUserIcon'),
        
        navHomeBtn: document.getElementById('navHomeBtn'),
        navSearchBtn: document.getElementById('navSearchBtn'),
        navOrdersBtn: document.getElementById('navOrdersBtn'),
        navModeToggleBtn: document.getElementById('navModeToggleBtn'),

        customerHomeView: document.getElementById('customerHomeView'),
        restaurantMenuView: document.getElementById('restaurantMenuView'),
        orderTrackingView: document.getElementById('orderTrackingView'),
        restaurantPanelView: document.getElementById('restaurantPanelView'),
        driverPanelView: document.getElementById('driverPanelView'),
        adminDashboardView: document.getElementById('adminDashboardView'),

        searchInput: document.getElementById('searchInput'),
        categoriesContainer: document.getElementById('categoriesContainer'),
        restaurantsListContainer: document.getElementById('restaurantsListContainer'),

        cartOverlay: document.getElementById('cartOverlay'),
        cartBadge: document.getElementById('cartBadge'),
        cartItemsContainer: document.getElementById('cartItemsContainer'),
        cartSubtotalText: document.getElementById('cartSubtotalText'),
        cartDeliveryText: document.getElementById('cartDeliveryText'),
        cartTotalText: document.getElementById('cartTotalText'),
        btnOpenCheckout: document.getElementById('btnOpenCheckout'),

        checkoutModal: document.getElementById('checkoutModal'),
        checkoutForm: document.getElementById('checkoutForm'),
        btnCloseCheckout: document.getElementById('btnCloseCheckout'),
        checkoutCustName: document.getElementById('checkoutCustName'),
        checkoutCustPhone: document.getElementById('checkoutCustPhone'),
        checkoutCustAddress: document.getElementById('checkoutCustAddress'),

        // Profile Modal Elements
        userProfileModal: document.getElementById('userProfileModal'),
        profileModalAvatar: document.getElementById('profileModalAvatar'),
        profileModalName: document.getElementById('profileModalName'),
        profileModalEmail: document.getElementById('profileModalEmail'),
        profileModalProviderBadge: document.getElementById('profileModalProviderBadge'),
        profileModalUid: document.getElementById('profileModalUid'),
        profileModalOrderCount: document.getElementById('profileModalOrderCount'),

        // Toast & Alert Elements
        toastNotification: document.getElementById('toastNotification'),
        authAlertBox: document.getElementById('authAlertBox'),
        authAlertMessage: document.getElementById('authAlertMessage'),
        authAlertIcon: document.getElementById('authAlertIcon'),

        // Auth Forms
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        resetForm: document.getElementById('resetForm'),
        btnLoginSubmit: document.getElementById('btnLoginSubmit'),
        btnRegisterSubmit: document.getElementById('btnRegisterSubmit'),
        btnResetSubmit: document.getElementById('btnResetSubmit'),
        btnGoogleAuth: document.getElementById('btnGoogleAuth'),
        btnGuestAuth: document.getElementById('btnGuestAuth'),

        // Order Tracking Elements
        trackingOrderIdText: document.getElementById('trackingOrderIdText'),
        trackingEstTimeText: document.getElementById('trackingEstTimeText'),
        stepReceived: document.getElementById('stepReceived'),
        stepPreparing: document.getElementById('stepPreparing'),
        stepOnTheWay: document.getElementById('stepOnTheWay'),
        stepDelivered: document.getElementById('stepDelivered'),
        timelineProgressLine: document.getElementById('timelineProgressLine'),
        trackingAlertText: document.getElementById('trackingAlertText'),
        driverStatusNameText: document.getElementById('driverStatusNameText'),
        receiptItemsContainer: document.getElementById('receiptItemsContainer'),
        receiptSubtotalText: document.getElementById('receiptSubtotalText'),
        receiptDeliveryText: document.getElementById('receiptDeliveryText'),
        receiptTotalText: document.getElementById('receiptTotalText'),

        // Dashboard Elements
        restTodayOrdersCount: document.getElementById('restTodayOrdersCount'),
        restTotalSalesSum: document.getElementById('restTotalSalesSum'),
        incomingOrdersBadgeCount: document.getElementById('incomingOrdersBadgeCount'),
        incomingOrdersContainer: document.getElementById('incomingOrdersContainer'),
        preparingOrdersContainer: document.getElementById('preparingOrdersContainer'),
        driverOrdersContainer: document.getElementById('driverOrdersContainer'),
        adminRestCount: document.getElementById('adminRestCount'),
        adminSystemSales: document.getElementById('adminSystemSales'),
        adminLiveOrdersTable: document.getElementById('adminLiveOrdersTable')
    };

    // ==========================================
    // UI Helpers: Toast & Alerts
    // ==========================================
    function showToast(message, type = 'success') {
        if (!elements.toastNotification) return;
        elements.toastNotification.className = `toast-notification ${type} show`;
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
        elements.toastNotification.innerHTML = `${icon} <span>${message}</span>`;
        
        setTimeout(() => {
            elements.toastNotification.classList.remove('show');
        }, 3200);
    }

    function showAuthAlert(message, type = 'error') {
        if (!elements.authAlertBox) return;
        elements.authAlertBox.className = `auth-alert-box ${type}`;
        elements.authAlertIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        elements.authAlertMessage.textContent = message;
        elements.authAlertBox.style.display = 'flex';
    }

    function hideAuthAlert() {
        if (elements.authAlertBox) elements.authAlertBox.style.display = 'none';
    }

    function playAudioChime() {
        if (!state.soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
    }

    // ==========================================
    // Initializer & Firebase Auth State Listener
    // ==========================================
    function init() {
        if (state.orders.length > 0) {
            state.activeTrackingOrder = state.orders[0];
        }

        loadAllRestaurants();
        renderCategories();
        renderRestaurants();
        updateCartUI();
        renderOrderTracking();
        renderRestaurantPanel();
        bindEvents();

        // =====================================================
        // الخطوة 1: إخفاء الـ Splash Screen وعرض Auth فوراً
        // بدون انتظار Firebase - السرعة أولاً
        // =====================================================
        const hideSplash = () => {
            if (elements.splashScreenView) {
                elements.splashScreenView.style.display = 'none';
            }
        };

        // الانتقال الفوري لشاشة الدخول بعد 600ms
        setTimeout(() => {
            window.__splashHidden = true; // أبلغ الـ failsafe أن app.js يتولى الأمر
            hideSplash();
            // تحقق من localStorage أولاً (مستخدم سابق)
            const savedUser = localStorage.getItem('al_noamaniah_user');
            if (savedUser) {
                try {
                    state.currentUser = JSON.parse(savedUser);
                    updateUserUI(state.currentUser);
                    elements.mainAppHeader.style.display = 'block';
                    elements.mainBottomNav.style.display = 'flex';
                    switchView('customer-home');
                } catch(e) {
                    localStorage.removeItem('al_noamaniah_user');
                    showAuthScreen();
                }
            } else {
                showAuthScreen();
            }
        }, 600);

        // =====================================================
        // الخطوة 2: تهيئة Firebase في الخلفية بشكل منفصل
        // لا تعيق واجهة المستخدم
        // =====================================================
        const setupFirebase = () => {
            if (window.authManager && window.authManager.auth) {
                // أولاً: تحقق من نتيجة Redirect (بعد العودة من Google)
                if (sessionStorage.getItem('google_auth_redirect')) {
                    window.authManager.handleRedirectResult().then(async (user) => {
                        if (user) {
                            state.currentUser = user;
                            updateUserUI(user);
                            window.__splashHidden = true;
                            if (elements.splashScreenView) elements.splashScreenView.style.display = 'none';
                            if (elements.authScreenView) elements.authScreenView.style.display = 'none';
                            
                            // تحقق من الصلاحيات والتوجه التلقائي
                            // تحقق من الصلاحيات والتوجه التلقائي
                            if (window.authManager.db) {
                                try {
                                    const userDoc = await window.authManager.db.collection('users').doc(user.uid).get();
                                    if (userDoc.exists) {
                                        const userData = userDoc.data();
                                        const updatedUser = { ...user, role: userData.role, restaurantId: userData.restaurantId };
                                        state.currentUser = updatedUser;
                                        localStorage.setItem('al_noamaniah_user', JSON.stringify(updatedUser));
                                        updateUserUI(updatedUser);

                                        const urlParams = new URLSearchParams(window.location.search);
                                        const isCustomerViewing = urlParams.get('mode') === 'customer' || sessionStorage.getItem('restaurant_viewing_as_customer') === 'true';

                                        if (!isCustomerViewing) {
                                            if (userData.role === 'restaurant') {
                                                window.location.href = 'restaurant.html';
                                                return;
                                            } else if (userData.role === 'driver') {
                                                window.location.href = 'driver.html';
                                                return;
                                            }
                                        }
                                    }
                                } catch(e) { console.warn("Error checking user role:", e); }
                            }

                            elements.mainAppHeader.style.display = 'block';
                            elements.mainBottomNav.style.display = 'flex';
                            switchView('customer-home');
                            showToast(`أهلاً بك يا ${user.displayName}`);
                        }
                    });
                }

                window.authManager.onAuthStateChanged(async (user) => {
                    state.currentUser = user;
                    updateUserUI(user);

                    if (user && window.authManager.db) {
                        try {
                            const userDoc = await window.authManager.db.collection('users').doc(user.uid).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                const updatedUser = { ...user, role: userData.role, restaurantId: userData.restaurantId };
                                state.currentUser = updatedUser;
                                localStorage.setItem('al_noamaniah_user', JSON.stringify(updatedUser));
                                updateUserUI(updatedUser);

                                const urlParams = new URLSearchParams(window.location.search);
                                const isCustomerViewing = urlParams.get('mode') === 'customer' || sessionStorage.getItem('restaurant_viewing_as_customer') === 'true';

                                if (!isCustomerViewing) {
                                    if (userData.role === 'restaurant') {
                                        window.location.href = 'restaurant.html';
                                        return;
                                    } else if (userData.role === 'driver') {
                                        window.location.href = 'driver.html';
                                        return;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("Error checking user role:", e);
                        }
                    }

                    // Firestore Live Listener
                    if (window.authManager.db && !window.__firestoreListening) {
                        window.__firestoreListening = true;
                        window.authManager.db.collection('orders').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
                            let newOrders = [];
                            snapshot.forEach(doc => {
                                newOrders.push(doc.data());
                            });
                            if (newOrders.length > 0) {
                                state.orders = newOrders;
                                localStorage.setItem('al_noamaniah_orders', JSON.stringify(state.orders));
                                
                                // Re-render panels if they are active
                                if (state.currentView === 'restaurant-panel') renderRestaurantPanel();
                                if (state.currentView === 'driver-panel') renderDriverPanel();
                                if (state.currentView === 'admin-dashboard') renderAdminDashboard();
                                if (state.currentView === 'order-tracking') renderOrderTracking();
                            }
                        }, (err) => {
                            console.warn("Firestore live listener failed or disabled", err);
                        });
                    }

                    // إذا تغيرت حالة المصادقة وكانت الواجهة في شاشة Auth، انتقل للرئيسية
                    if (user && elements.authScreenView && elements.authScreenView.style.display !== 'none') {
                        elements.authScreenView.style.display = 'none';
                        elements.mainAppHeader.style.display = 'block';
                        elements.mainBottomNav.style.display = 'flex';
                        switchView('customer-home');
                    }
                    // إذا خرج المستخدم وكانت الواجهة في الرئيسية، اعرض Auth
                    else if (!user && elements.authScreenView && elements.authScreenView.style.display === 'none'
                             && elements.customerHomeView && elements.customerHomeView.style.display !== 'none') {
                        showAuthScreen();
                    }
                });
            }
        };

        // انتظر Firebase SDK يكون جاهزاً
        if (typeof firebase !== 'undefined' && window.authManager) {
            setupFirebase();
        } else {
            // Firebase لم يحمّل بعد - انتظر حتى 3 ثوانٍ
            let attempts = 0;
            const firebaseCheckInterval = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && window.authManager) {
                    clearInterval(firebaseCheckInterval);
                    setupFirebase();
                } else if (attempts >= 30) {
                    clearInterval(firebaseCheckInterval);
                    console.warn('Firebase SDK لم يُحمَّل في الوقت المتوقع - المتابعة بدونه');
                }
            }, 100);
        }
    }

    function updateUserUI(user) {
        if (user) {
            if (user.photoUrl && elements.headerUserAvatar) {
                elements.headerUserAvatar.src = user.photoUrl;
                elements.headerUserAvatar.style.display = 'block';
                if (elements.headerDefaultUserIcon) elements.headerDefaultUserIcon.style.display = 'none';
            } else {
                if (elements.headerUserAvatar) elements.headerUserAvatar.style.display = 'none';
                if (elements.headerDefaultUserIcon) elements.headerDefaultUserIcon.style.display = 'block';
            }

            if (elements.checkoutCustName && (!elements.checkoutCustName.value || elements.checkoutCustName.value === 'أحمد محمد')) {
                elements.checkoutCustName.value = user.displayName || 'عميل معتمد';
            }

            // Populate Profile Sheet
            if (elements.profileModalAvatar) elements.profileModalAvatar.src = user.photoUrl;
            if (elements.profileModalName) elements.profileModalName.textContent = user.displayName;
            if (elements.profileModalEmail) elements.profileModalEmail.textContent = user.email;
            if (elements.profileModalUid) elements.profileModalUid.textContent = user.uid;

            let badgeText = 'حساب بريد إلكتروني';
            const onboardingBtn = document.getElementById('btnRegisterAsRestaurant');
            const dashboardBtn = document.getElementById('btnGoToRestaurantDashboard');
            const floatingDashboardBtn = document.getElementById('floatingRestaurantDashboardBtn');
            const headerDashboardBtn = document.getElementById('btnHeaderRestaurantDashboard');

            if (user.role === 'restaurant') {
                badgeText = 'حساب صاحب مطعم';
                if (onboardingBtn) onboardingBtn.style.display = 'none';
                if (dashboardBtn) dashboardBtn.style.display = 'block';
                if (floatingDashboardBtn) floatingDashboardBtn.style.display = 'flex';
                if (headerDashboardBtn) headerDashboardBtn.style.display = 'inline-flex';
            } else {
                if (dashboardBtn) dashboardBtn.style.display = 'none';
                if (floatingDashboardBtn) floatingDashboardBtn.style.display = 'none';
                if (headerDashboardBtn) headerDashboardBtn.style.display = 'none';
                if (user.provider === 'google') {
                    badgeText = 'حساب Google موثق';
                    if (onboardingBtn) onboardingBtn.style.display = 'block';
                } else if (user.isAnonymous || user.provider === 'guest') {
                    badgeText = 'حساب زائر مؤقت';
                    if (onboardingBtn) onboardingBtn.style.display = 'none';
                } else {
                    if (onboardingBtn) onboardingBtn.style.display = 'block';
                }
            }
            if (elements.profileModalProviderBadge) elements.profileModalProviderBadge.textContent = badgeText;
            if (elements.profileModalOrderCount) elements.profileModalOrderCount.textContent = `${state.orders.length} طلبات`;
        } else {
            const onboardingBtn = document.getElementById('btnRegisterAsRestaurant');
            const dashboardBtn = document.getElementById('btnGoToRestaurantDashboard');
            const floatingDashboardBtn = document.getElementById('floatingRestaurantDashboardBtn');
            const headerDashboardBtn = document.getElementById('btnHeaderRestaurantDashboard');
            if (onboardingBtn) onboardingBtn.style.display = 'none';
            if (dashboardBtn) dashboardBtn.style.display = 'none';
            if (floatingDashboardBtn) floatingDashboardBtn.style.display = 'none';
            if (headerDashboardBtn) headerDashboardBtn.style.display = 'none';
            if (elements.headerUserAvatar) elements.headerUserAvatar.style.display = 'none';
            if (elements.headerDefaultUserIcon) elements.headerDefaultUserIcon.style.display = 'block';
        }
    }

    function showAuthScreen() {
        // إلغاء الـ CSS animation وإظهار الشاشة فوراً
        if (elements.splashScreenView) {
            elements.splashScreenView.style.animation = 'none';
            elements.splashScreenView.style.display = 'none';
        }
        if (elements.authScreenView) {
            elements.authScreenView.style.animation = 'none';
            elements.authScreenView.style.opacity = '1';
            elements.authScreenView.style.display = 'flex';
        }
        if (elements.mainAppHeader) elements.mainAppHeader.style.display = 'none';
        if (elements.customerHomeView) elements.customerHomeView.style.display = 'none';
        if (elements.restaurantMenuView) elements.restaurantMenuView.style.display = 'none';
        if (elements.orderTrackingView) elements.orderTrackingView.style.display = 'none';
        if (elements.restaurantPanelView) elements.restaurantPanelView.style.display = 'none';
        if (elements.driverPanelView) elements.driverPanelView.style.display = 'none';
        if (elements.adminDashboardView) elements.adminDashboardView.style.display = 'none';
        if (elements.mainBottomNav) elements.mainBottomNav.style.display = 'none';
    }

    // ==========================================
    // Auth Tab Switching & Visibility
    // ==========================================
    window.switchAuthTab = function(tab) {
        hideAuthAlert();
        document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));

        elements.loginForm.style.display = 'none';
        elements.registerForm.style.display = 'none';
        elements.resetForm.style.display = 'none';

        if (tab === 'login') {
            document.getElementById('tabLoginBtn').classList.add('active');
            elements.loginForm.style.display = 'block';
        } else if (tab === 'register') {
            document.getElementById('tabRegisterBtn').classList.add('active');
            elements.registerForm.style.display = 'block';
        } else if (tab === 'reset') {
            document.getElementById('tabResetBtn').classList.add('active');
            elements.resetForm.style.display = 'block';
        }
    };

    window.togglePasswordVisibility = function(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i class="far fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            btn.innerHTML = '<i class="far fa-eye"></i>';
        }
    };

    // ==========================================
    // Real Firebase Auth Actions
    // ==========================================
    window.handleGoogleSignIn = async function() {
        hideAuthAlert();
        elements.btnGoogleAuth.disabled = true;
        elements.btnGoogleAuth.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>جاري المصادقة عبر Google...</span>';

        try {
            const user = await window.authManager.signInWithGoogle();
            state.currentUser = user;
            updateUserUI(user);
            elements.authScreenView.style.display = 'none';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
            switchView('customer-home');
            showToast(`أهلاً بك يا ${user.displayName}`);
        } catch (err) {
            showAuthAlert(err.message, 'error');
        } finally {
            elements.btnGoogleAuth.disabled = false;
            elements.btnGoogleAuth.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google"> <span>تسجيل الدخول بحساب Google</span>';
        }
    };

    window.handleGuestSignIn = async function() {
        hideAuthAlert();
        elements.btnGuestAuth.disabled = true;
        elements.btnGuestAuth.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>جاري تسجيل الدخول كزائر...</span>';

        try {
            const user = await window.authManager.signInAsGuest();
            state.currentUser = user;
            updateUserUI(user);
            elements.authScreenView.style.display = 'none';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
            switchView('customer-home');
            showToast("تم الدخول بنجاح بحساب زائر");
        } catch (err) {
            showAuthAlert(err.message, 'error');
        } finally {
            elements.btnGuestAuth.disabled = false;
            elements.btnGuestAuth.innerHTML = '<i class="fas fa-user-clock"></i> <span>المتابعة كـ زائر</span>';
        }
    };

    window.handleSignOut = async function() {
        if (confirm("هل أنت متأكد من تسجيل الخروج من حسابك؟")) {
            closeUserProfileModal();
            await window.authManager.signOut();
            state.currentUser = null;
            updateUserUI(null);
            showAuthScreen();
            showToast("تم تسجيل الخروج بنجاح");
        }
    };

    window.openUserProfileModal = function() {
        if (elements.userProfileModal) {
            if (state.currentUser) {
                updateUserUI(state.currentUser);
            }
            elements.userProfileModal.classList.add('active');
        }
    };

    window.closeUserProfileModal = function() {
        if (elements.userProfileModal) {
            elements.userProfileModal.classList.remove('active');
        }
    };

    window.resetCategoryFilter = function() {
        state.selectedCategory = 'all';
        renderCategories();
        renderRestaurants();
    };

    // ==========================================
    // Render Functions
    // ==========================================
    function renderCategories() {
        if (!elements.categoriesContainer) return;
        elements.categoriesContainer.innerHTML = APP_DATA.categories.map(cat => `
            <div class="category-circle-item ${cat.id === state.selectedCategory ? 'active' : ''}" data-id="${cat.id}">
                <div class="category-icon-bubble">
                    <i class="fas ${cat.icon}"></i>
                </div>
                <span class="category-label">${cat.name}</span>
            </div>
        `).join('');

        elements.categoriesContainer.querySelectorAll('.category-circle-item').forEach(item => {
            item.addEventListener('click', () => {
                state.selectedCategory = item.dataset.id;
                renderCategories();
                renderRestaurants();
            });
        });
    }

    async function loadAllRestaurants() {
        if (window.apiClient) {
            try {
                const apiRests = await window.apiClient.getRestaurants();
                if (apiRests && apiRests.length > 0) {
                    state.allRestaurants = apiRests;
                    if (state.allRestaurants.length > 0) {
                        state.activeRestaurant = state.allRestaurants[0];
                    }
                    renderRestaurants();
                    return;
                }
            } catch (e) {
                console.warn("Failed to load restaurants from MySQL API:", e);
            }
        }
        state.allRestaurants = [...APP_DATA.restaurants];
        renderRestaurants();
    }

        // 2. Load from Firestore
        const db = window.authManager ? window.authManager.db : null;
        if (db) {
            db.collection('restaurants').where('isActive', '==', true).get().then(snapshot => {
                snapshot.forEach(doc => {
                    const r = doc.data();
                    const idx = state.allRestaurants.findIndex(item => item.id === r.id);
                    const mappedRest = {
                        id: r.id,
                        name: r.name,
                        description: r.description || 'مطعم النعمانية للوجبات الشهية',
                        image: r.image || (r.menu && r.menu[0] && r.menu[0].image ? r.menu[0].image : 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80'),
                        cover: r.image || (r.menu && r.menu[0] && r.menu[0].image ? r.menu[0].image : 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80'),
                        rating: r.rating || 5.0,
                        badge: r.type === 'home' ? 'مطبخ منزلي' : 'مطعم تجاري',
                        category: r.categories && r.categories[0] ? r.categories[0] : 'fastfood',
                        deliveryTime: '25-35 دقيقة',
                        deliveryFee: '2000 د.ع',
                        menu: r.menu || [],
                        isActive: r.isActive !== false
                    };
                    if (idx !== -1) {
                        state.allRestaurants[idx] = mappedRest;
                    } else {
                        state.allRestaurants.push(mappedRest);
                    }
                });
                renderRestaurants(); // Re-render once firebase data is ready
            }).catch(e => console.warn("Error loading restaurants from Firestore:", e));
        }
    }

    function renderRestaurants() {
        if (!elements.restaurantsListContainer) return;
        let filtered = state.allRestaurants || [];

        if (state.selectedCategory !== 'all') {
            filtered = filtered.filter(r => r.category === state.selectedCategory);
        }

        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r.name.toLowerCase().includes(q) || 
                r.description.toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            elements.restaurantsListContainer.innerHTML = `
                <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
                    <i class="fas fa-search" style="font-size:2rem; margin-bottom:0.6rem; opacity:0.35;"></i>
                    <p style="font-weight:700;">لا توجد مطاعم مطابقة لبحثك</p>
                </div>
            `;
            return;
        }

        elements.restaurantsListContainer.innerHTML = filtered.map(r => `
            <div class="restaurant-featured-card" data-id="${r.id}">
                <div class="rest-card-image-box">
                    <img src="${r.image}" alt="${r.name}">
                    <div class="rating-top-badge">
                        <i class="fas fa-star"></i>
                        <span>${r.rating}</span>
                    </div>
                    <div class="category-tag-pill">${r.badge}</div>
                </div>
                <div class="rest-card-info">
                    <h3 class="rest-card-title">${r.name}</h3>
                    <div class="rest-card-meta-row">
                        <div class="meta-delivery-item">
                            <i class="far fa-clock"></i>
                            <span>${r.deliveryTime}</span>
                        </div>
                        <div class="meta-delivery-item">
                            <i class="fas fa-motorcycle"></i>
                            <span>${r.deliveryFee}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        elements.restaurantsListContainer.querySelectorAll('.restaurant-featured-card').forEach(card => {
            card.addEventListener('click', () => {
                const restId = card.dataset.id;
                openRestaurantMenu(restId);
            });
        });
    }

    function openRestaurantMenu(restId) {
        const rest = state.allRestaurants.find(r => r.id === restId);
        if (!rest) return;

        state.activeRestaurant = rest;
        
        document.getElementById('menuRestCover').src = rest.cover || rest.image;
        document.getElementById('menuRestName').textContent = rest.name;
        document.getElementById('menuRestDesc').textContent = rest.description;

        const dishesContainer = document.getElementById('menuDishesContainer');
        dishesContainer.innerHTML = rest.menu.map(dish => `
            <div class="restaurant-featured-card" style="margin-bottom:0.8rem; cursor:pointer;" data-dishid="${dish.id}">
                <div style="display:flex; gap:0.9rem; padding:0.9rem; align-items:center;">
                    <img src="${dish.image}" style="width:80px; height:80px; border-radius:14px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="font-weight:900; font-size:0.98rem; margin-bottom:0.2rem;">${dish.name}</h4>
                        <p style="font-size:0.78rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.4rem;">${dish.description}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:900; font-size:1.05rem; color:var(--terracotta);">${dish.price.toLocaleString()} ${APP_DATA.currency}</span>
                            <button class="btn-accept-order" style="padding:0.35rem 0.9rem; font-size:0.8rem;">+ إضافة للسلة</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        dishesContainer.querySelectorAll('[data-dishid]').forEach(item => {
            item.addEventListener('click', () => {
                const dishId = item.dataset.dishid;
                const dish = rest.menu.find(d => d.id === dishId);
                if (dish) {
                    addToCart(dish);
                }
            });
        });

        switchView('restaurant-menu');
    }

    function addToCart(dish) {
        const notes = prompt(`ملاحظات خاصة لوجبة (${dish.name}):\n(مثال: بدون بصل، حار، زيادة صوص...)`, '');

        state.cart.push({
            dish: dish,
            quantity: 1,
            notes: notes ? notes.trim() : '',
            unitPrice: dish.price,
            restaurantName: state.activeRestaurant.name
        });

        updateCartUI();
        openCartDrawer();
        showToast(`تمت إضافة ${dish.name} إلى السلة`);
    }

    function updateCartUI() {
        const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        elements.cartBadge.textContent = count;

        if (state.cart.length === 0) {
            elements.cartItemsContainer.innerHTML = `
                <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted);">
                    <i class="fas fa-shopping-bag" style="font-size:2.5rem; color:#e5dcd3; margin-bottom:0.8rem;"></i>
                    <h4>سلة الطلبات فارغة</h4>
                    <p style="font-size:0.8rem;">أضف أطباقك المفضلة للمتابعة.</p>
                </div>
            `;
            elements.cartSubtotalText.textContent = `0 ${APP_DATA.currency}`;
            elements.cartDeliveryText.textContent = `2,000 ${APP_DATA.currency}`;
            elements.cartTotalText.textContent = `0 ${APP_DATA.currency}`;
            elements.btnOpenCheckout.disabled = true;
            return;
        }

        elements.btnOpenCheckout.disabled = false;

        let subtotal = 0;
        elements.cartItemsContainer.innerHTML = state.cart.map((item, idx) => {
            const itemTotal = item.unitPrice * item.quantity;
            subtotal += itemTotal;

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EFE6DE; padding-bottom:0.6rem; margin-bottom:0.6rem;">
                    <div>
                        <div style="font-weight:900; font-size:0.92rem;">${item.dish.name}</div>
                        ${item.notes ? `<div style="font-size:0.74rem; color:var(--terracotta); font-weight:700;">ملاحظة: ${item.notes}</div>` : ''}
                        <div style="font-size:0.88rem; font-weight:800; color:var(--terracotta-dark); margin-top:0.1rem;">${itemTotal.toLocaleString()} ${APP_DATA.currency}</div>
                    </div>
                    <button class="btn-reject-order btn-remove-item" data-idx="${idx}" style="padding:0.25rem 0.6rem; font-size:0.75rem;">حذف</button>
                </div>
            `;
        }).join('');

        const deliveryFee = 2000;
        const grandTotal = subtotal + deliveryFee;

        elements.cartSubtotalText.textContent = `${subtotal.toLocaleString()} ${APP_DATA.currency}`;
        elements.cartDeliveryText.textContent = `${deliveryFee.toLocaleString()} ${APP_DATA.currency}`;
        elements.cartTotalText.textContent = `${grandTotal.toLocaleString()} ${APP_DATA.currency}`;

        elements.cartItemsContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                state.cart.splice(idx, 1);
                updateCartUI();
            });
        });
    }

    function openCartDrawer() {
        elements.cartOverlay.classList.add('active');
    }

    function closeCartDrawer() {
        elements.cartOverlay.classList.remove('active');
    }

    function renderOrderTracking() {
        const order = state.activeTrackingOrder;
        if (!order) return;

        elements.trackingOrderIdText.textContent = `رقم الطلب: ${order.id}`;
        elements.trackingEstTimeText.textContent = order.estTime;
        elements.driverStatusNameText.textContent = order.driverName;

        elements.stepReceived.classList.remove('done', 'active');
        elements.stepPreparing.classList.remove('done', 'active');
        elements.stepOnTheWay.classList.remove('done', 'active');
        elements.stepDelivered.classList.remove('done', 'active');

        let progressWidth = '10%';
        let alertMsg = 'طلبك قيد المعالجة الآن.';

        if (order.status === 'new') {
            elements.stepReceived.classList.add('active');
            progressWidth = '10%';
            alertMsg = 'تم استلام طلبك وبانتظار تأكيد المطعم.';
        } else if (order.status === 'preparing') {
            elements.stepReceived.classList.add('done');
            elements.stepPreparing.classList.add('active');
            progressWidth = '38%';
            alertMsg = 'طلبك يتم تحضيره وتغليفه الآن بعناية.';
        } else if (order.status === 'ready' || order.status === 'delivering') {
            elements.stepReceived.classList.add('done');
            elements.stepPreparing.classList.add('done');
            elements.stepOnTheWay.classList.add('active');
            progressWidth = '70%';
            alertMsg = 'كابتن التوصيل في الطريق إلى موقعك الآن.';
        } else if (order.status === 'delivered') {
            elements.stepReceived.classList.add('done');
            elements.stepPreparing.classList.add('done');
            elements.stepOnTheWay.classList.add('done');
            elements.stepDelivered.classList.add('active');
            progressWidth = '100%';
            alertMsg = 'تم تسليم الطلب بنجاح. شكراً لاختيارك مطاعم النعمانية.';
        }

        elements.timelineProgressLine.style.width = progressWidth;
        elements.trackingAlertText.textContent = alertMsg;

        elements.receiptItemsContainer.innerHTML = order.items.map(item => `
            <div class="receipt-item-row">
                <div>
                    <span class="qty-badge-pill">${item.qty}x</span>
                    <span>${item.name}</span>
                </div>
                <span>${(item.price * item.qty).toLocaleString()} ${APP_DATA.currency}</span>
            </div>
        `).join('');

        elements.receiptSubtotalText.textContent = `${order.subtotal.toLocaleString()} ${APP_DATA.currency}`;
        elements.receiptDeliveryText.textContent = `${order.deliveryFee.toLocaleString()} ${APP_DATA.currency}`;
        elements.receiptTotalText.textContent = `${order.total.toLocaleString()} ${APP_DATA.currency}`;
    }

    function renderRestaurantPanel() {
        const todayCount = state.orders.length;
        const totalSalesSum = state.orders.reduce((sum, o) => sum + o.total, 0);

        elements.restTodayOrdersCount.textContent = todayCount;
        elements.restTotalSalesSum.textContent = `${totalSalesSum.toLocaleString()} ${APP_DATA.currency}`;

        const incomingList = state.orders.filter(o => o.status === 'new');
        elements.incomingOrdersBadgeCount.textContent = `${incomingList.length} جديدة`;

        elements.incomingOrdersContainer.innerHTML = incomingList.length === 0 ? `
            <div style="background:var(--card-white); padding:1rem; border-radius:14px; text-align:center; color:var(--text-muted); font-size:0.85rem;">
                لا توجد طلبات جديدة واردة حالياً
            </div>
        ` : incomingList.map(o => `
            <div class="incoming-order-card">
                <div class="order-card-header-row">
                    <span class="order-badge-id">${o.displayId}</span>
                    <span class="order-customer-name">${o.customerName}</span>
                </div>
                <div class="order-items-summary">
                    ${o.items.map(i => `${i.qty}x ${i.name}`).join('، ')}
                    ${o.notes ? `<br><span style="color:var(--terracotta); font-weight:bold;">ملاحظات: ${o.notes}</span>` : ''}
                </div>
                <div class="order-card-actions">
                    <span class="order-total-price">${o.total.toLocaleString()} ${APP_DATA.currency}</span>
                    <div style="display:flex; gap:0.4rem;">
                        <button class="btn-reject-order" onclick="rejectOrder('${o.id}')">رفض</button>
                        <button class="btn-accept-order" onclick="acceptOrder('${o.id}')">قبول الطلب</button>
                    </div>
                </div>
            </div>
        `).join('');

        const preparingList = state.orders.filter(o => o.status === 'preparing' || o.status === 'ready');
        elements.preparingOrdersContainer.innerHTML = preparingList.length === 0 ? `
            <div style="background:var(--card-white); padding:1rem; border-radius:14px; text-align:center; color:var(--text-muted); font-size:0.85rem;">
                لا توجد طلبات قيد التجهيز
            </div>
        ` : preparingList.map(o => `
            <div class="incoming-order-card">
                <div class="order-card-header-row">
                    <span class="order-badge-id">${o.displayId}</span>
                    <span class="order-customer-name">${o.customerName}</span>
                    <span style="font-size:0.75rem; font-weight:bold; color:var(--terracotta);">${o.status === 'ready' ? 'جاهز للاستلام' : 'جاري التحضير'}</span>
                </div>
                ${o.status === 'preparing' ? `
                    <button class="btn-accept-order btn-block" onclick="markOrderReady('${o.id}')">تحديد كجاهز للتسليم</button>
                ` : `
                    <div style="font-size:0.82rem; color:#059669; font-weight:bold; text-align:center; margin-top:0.4rem;"><i class="fas fa-check-circle"></i> في انتظار استلام الكابتن</div>
                `}
            </div>
        `).join('');
    }

    function saveStateAndUpdate() {
        localStorage.setItem('al_noamaniah_orders', JSON.stringify(state.orders));
        renderOrderTracking();
        renderRestaurantPanel();
        renderDriverPanel();
        renderAdminDashboard();
        if (state.currentUser && elements.profileModalOrderCount) {
            elements.profileModalOrderCount.textContent = `${state.orders.length} طلبات`;
        }
    }

    function renderDriverPanel() {
        if (!elements.driverOrdersContainer) return;

        const readyOrders = state.orders.filter(o => o.status === 'ready' || o.status === 'delivering');

        elements.driverOrdersContainer.innerHTML = readyOrders.length === 0 ? `
            <div style="background:var(--card-white); padding:1.8rem; border-radius:16px; text-align:center; color:var(--text-muted);">
                <i class="fas fa-motorcycle" style="font-size:2.2rem; color:#cbd5e1; margin-bottom:0.6rem;"></i>
                <h4>لا توجد طلبات جاهزة للتوصيل</h4>
            </div>
        ` : readyOrders.map(o => `
            <div class="incoming-order-card">
                <div class="order-card-header-row">
                    <span class="order-badge-id">${o.displayId}</span>
                    <span class="order-customer-name">${o.restaurantName} &laquo; ${o.customerName}</span>
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.6rem;">
                    العنوان: ${o.neighborhood}<br>
                    الهاتف: ${o.phone}
                </p>
                ${o.status === 'ready' ? `
                    <button class="btn-accept-order btn-block" onclick="driverPickupOrder('${o.id}')">استلام الطلب من المطعم</button>
                ` : `
                    <button class="btn-accept-order btn-block" style="background:#059669;" onclick="driverDeliverOrder('${o.id}')">تأكيد التسليم للزبون</button>
                `}
            </div>
        `).join('');
    }

    function renderAdminDashboard() {
        if (!elements.adminRestCount) return;

        elements.adminRestCount.textContent = APP_DATA.restaurants.length;
        const totalSalesSum = state.orders.reduce((sum, o) => sum + o.total, 0);
        elements.adminSystemSales.textContent = `${totalSalesSum.toLocaleString()} ${APP_DATA.currency}`;

        elements.adminLiveOrdersTable.innerHTML = state.orders.map(o => `
            <tr style="border-bottom:1px solid var(--border-light);">
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName}</td>
                <td>${o.restaurantName}</td>
                <td><strong>${o.total.toLocaleString()} ${APP_DATA.currency}</strong></td>
                <td><span class="category-tag-pill" style="position:static; display:inline-block;">${o.statusLabel || o.status}</span></td>
            </tr>
        `).join('');
    }

    function switchView(viewName) {
        state.currentView = viewName;

        elements.splashScreenView.style.display = 'none';
        elements.authScreenView.style.display = 'none';
        elements.customerHomeView.style.display = 'none';
        elements.restaurantMenuView.style.display = 'none';
        elements.orderTrackingView.style.display = 'none';
        elements.restaurantPanelView.style.display = 'none';
        elements.driverPanelView.style.display = 'none';
        elements.adminDashboardView.style.display = 'none';

        document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));

        if (viewName === 'customer-home') {
            elements.customerHomeView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
            elements.navHomeBtn.classList.add('active');
        } else if (viewName === 'restaurant-menu') {
            elements.restaurantMenuView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
        } else if (viewName === 'order-tracking') {
            renderOrderTracking();
            elements.orderTrackingView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
            elements.navOrdersBtn.classList.add('active');
        } else if (viewName === 'restaurant-panel') {
            renderRestaurantPanel();
            elements.restaurantPanelView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
            elements.navModeToggleBtn.classList.add('active');
        } else if (viewName === 'driver-panel') {
            renderDriverPanel();
            elements.driverPanelView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
        } else if (viewName === 'admin-dashboard') {
            renderAdminDashboard();
            elements.adminDashboardView.style.display = 'block';
            elements.mainAppHeader.style.display = 'block';
            elements.mainBottomNav.style.display = 'flex';
        }

        const scrollContainer = document.querySelector('.app-scroll-content');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }

    // ==========================================
    // Global Management Handlers
    // ==========================================
    window.acceptOrder = function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'preparing';
            order.statusLabel = 'قيد التحضير';
            saveStateAndUpdate();
            showToast(`تم قبول الطلب ${order.displayId}`);
        }
    };

    window.rejectOrder = function(orderId) {
        if (confirm('هل أنت متأكد من رفض الطلب؟')) {
            state.orders = state.orders.filter(o => o.id !== orderId);
            saveStateAndUpdate();
            showToast('تم رفض الطلب', 'error');
        }
    };

    window.markOrderReady = function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'ready';
            order.statusLabel = 'جاهز للاستلام';
            order.driverName = 'كابتن علي (07801234567)';
            saveStateAndUpdate();
            showToast(`الطلب ${order.displayId} جاهز للاستلام`);
        }
    };

    window.driverPickupOrder = function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'delivering';
            order.statusLabel = 'في الطريق للزبون';
            saveStateAndUpdate();
            showToast(`تم استلام الطلب وبدء التوصيل`);
        }
    };

    window.driverDeliverOrder = function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'delivered';
            order.statusLabel = 'تم التسليم';
            saveStateAndUpdate();
            showToast('تم تأكيد تسليم الطلب بنجاح');
        }
    };

    window.switchView = switchView;

    // ==========================================
    // Event Listeners
    // ==========================================
    function bindEvents() {
        elements.navHomeBtn.addEventListener('click', () => switchView('customer-home'));
        elements.navSearchBtn.addEventListener('click', () => {
            switchView('customer-home');
            elements.searchInput.focus();
        });
        elements.navOrdersBtn.addEventListener('click', () => switchView('order-tracking'));
        elements.navModeToggleBtn.addEventListener('click', () => {
            const views = ['restaurant-panel', 'driver-panel', 'admin-dashboard', 'customer-home'];
            const currentIdx = views.indexOf(state.currentView);
            const nextView = views[(currentIdx + 1) % views.length];
            switchView(nextView);
        });

        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderRestaurants();
        });

        document.getElementById('cartHeaderTrigger').addEventListener('click', openCartDrawer);
        document.getElementById('btnCloseCartDrawer').addEventListener('click', closeCartDrawer);
        elements.cartOverlay.addEventListener('click', (e) => {
            if (e.target === elements.cartOverlay) closeCartDrawer();
        });

        let checkoutMapObj = null;
        let checkoutMarker = null;

        elements.btnOpenCheckout.addEventListener('click', () => {
            closeCartDrawer();
            elements.checkoutModal.classList.add('active');
            
            // Initialize Leaflet Map
            setTimeout(() => {
                if (typeof L !== 'undefined' && document.getElementById('checkoutMap')) {
                    if (!checkoutMapObj) {
                        // Coordinates for Numaniyah, Iraq (approx)
                        const numaniyahLat = 32.5333;
                        const numaniyahLng = 45.4167;
                        
                        checkoutMapObj = L.map('checkoutMap').setView([numaniyahLat, numaniyahLng], 14);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; OpenStreetMap'
                        }).addTo(checkoutMapObj);
                        
                        checkoutMarker = L.marker([numaniyahLat, numaniyahLng], {draggable: true}).addTo(checkoutMapObj);
                        
                        document.getElementById('checkoutLat').value = numaniyahLat;
                        document.getElementById('checkoutLng').value = numaniyahLng;
                        
                        checkoutMapObj.on('click', function(e) {
                            checkoutMarker.setLatLng(e.latlng);
                            document.getElementById('checkoutLat').value = e.latlng.lat;
                            document.getElementById('checkoutLng').value = e.latlng.lng;
                        });

                        checkoutMarker.on('dragend', function(e) {
                            const position = checkoutMarker.getLatLng();
                            document.getElementById('checkoutLat').value = position.lat;
                            document.getElementById('checkoutLng').value = position.lng;
                        });
                    } else {
                        checkoutMapObj.invalidateSize();
                    }
                }
            }, 300);
        });

        elements.btnCloseCheckout.addEventListener('click', () => {
            elements.checkoutModal.classList.remove('active');
        });

        elements.checkoutModal.addEventListener('click', (e) => {
            if (e.target === elements.checkoutModal) {
                elements.checkoutModal.classList.remove('active');
            }
        });

        elements.userProfileModal.addEventListener('click', (e) => {
            if (e.target === elements.userProfileModal) {
                closeUserProfileModal();
            }
        });

        // 1. معالجة تسجيل الدخول بالبريد الإلكتروني
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthAlert();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            elements.btnLoginSubmit.disabled = true;
            elements.btnLoginSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>جاري تسجيل الدخول...</span>';

            try {
                const user = await window.authManager.signInWithEmail(email, password);
                state.currentUser = user;
                updateUserUI(user);
                elements.authScreenView.style.display = 'none';
                elements.mainAppHeader.style.display = 'block';
                elements.mainBottomNav.style.display = 'flex';
                switchView('customer-home');
                showToast(`مرحباً بك مجدداً ${user.displayName}`);
            } catch (err) {
                showAuthAlert(err.message, 'error');
            } finally {
                elements.btnLoginSubmit.disabled = false;
                elements.btnLoginSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول بالبريد';
            }
        });

        // 2. معالجة إنشاء حساب جديد
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthAlert();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            if (password.length < 6) {
                showAuthAlert('يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.', 'error');
                return;
            }

            elements.btnRegisterSubmit.disabled = true;
            elements.btnRegisterSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>جاري إنشاء الحساب في Firebase...</span>';

            try {
                const user = await window.authManager.signUpWithEmail(name, email, password);
                state.currentUser = user;
                updateUserUI(user);
                elements.authScreenView.style.display = 'none';
                elements.mainAppHeader.style.display = 'block';
                elements.mainBottomNav.style.display = 'flex';
                switchView('customer-home');
                showToast(`تم إنشاء الحساب بنجاح! أهلاً بك يا ${user.displayName}`);
            } catch (err) {
                showAuthAlert(err.message, 'error');
            } finally {
                elements.btnRegisterSubmit.disabled = false;
                elements.btnRegisterSubmit.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
            }
        });

        // 3. معالجة استعادة كلمة المرور
        elements.resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthAlert();
            const email = document.getElementById('resetEmail').value;

            elements.btnResetSubmit.disabled = true;
            elements.btnResetSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>جاري الإرسال...</span>';

            try {
                await window.authManager.resetPassword(email);
                showAuthAlert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.', 'success');
                showToast('تم إرسال رابط الاستعادة إلى بريدك');
            } catch (err) {
                showAuthAlert(err.message, 'error');
            } finally {
                elements.btnResetSubmit.disabled = false;
                elements.btnResetSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال رابط الاستعادة';
            }
        });

        // 4. معالجة تأكيد الطلب
        elements.checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = elements.checkoutCustName.value || (state.currentUser ? state.currentUser.displayName : 'عميل معتمد');
            const phone = elements.checkoutCustPhone.value;
            const address = elements.checkoutCustAddress.value;

            const subtotal = state.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const deliveryFee = 2000;
            const grandTotal = subtotal + deliveryFee;

            const newOrder = {
                id: `ORD-2023-${Math.floor(8000 + Math.random() * 1000)}`,
                displayId: `#${Math.floor(80 + Math.random() * 20)}`,
                userId: state.currentUser ? state.currentUser.uid : 'guest',
                customerName: name,
                phone: phone,
                neighborhood: address,
                location: {
                    lat: document.getElementById('checkoutLat').value || null,
                    lng: document.getElementById('checkoutLng').value || null
                },
                restaurantId: state.activeRestaurant.id,
                restaurantName: state.activeRestaurant.name,
                items: state.cart.map(i => ({ name: i.dish.name, qty: i.quantity, price: i.unitPrice })),
                notes: state.cart.map(i => i.notes).filter(Boolean).join(' | '),
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: grandTotal,
                status: 'new',
                statusLabel: 'تم الاستلام',
                estTime: '25 - 35 دقيقة',
                time: 'الآن',
                driverName: 'جاري تعيين مندوب',
                driverPhone: '07800001122',
                timestamp: new Date().toISOString()
            };

            state.orders.unshift(newOrder);
            state.activeTrackingOrder = newOrder;
            saveStateAndUpdate();

            // Push to MySQL API if available
            if (window.apiClient) {
                window.apiClient.createOrder({
                    customerUid: state.currentUser ? state.currentUser.uid : null,
                    customerName: name,
                    customerPhone: phone,
                    neighborhoodName: address,
                    addressDetails: address,
                    notes: newOrder.notes,
                    paymentMethod: 'cash',
                    subtotal: subtotal,
                    deliveryFee: deliveryFee,
                    totalPrice: grandTotal,
                    items: newOrder.items
                }).then(res => {
                    if (res && res.order) {
                        newOrder.id = res.order.id;
                    }
                }).catch(e => console.warn('MySQL API order fallback to local:', e));
            }

            state.cart = [];
            updateCartUI();
            elements.checkoutModal.classList.remove('active');

            playAudioChime();
            showToast("تم إرسال طلبك إلى المطعم بنجاح");
            switchView('order-tracking');
        });
    }

    init();
});
