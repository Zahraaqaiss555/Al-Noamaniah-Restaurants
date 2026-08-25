document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let currentStep = 1;
    let selectedType = '';
    
    // Map variables
    let onboardingMap = null;
    let restaurantMarker = null;
    const defaultLat = 32.5414; // Al-Noamaniah center
    const defaultLng = 46.2415;

    // Elements
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    authManager.onAuthStateChanged((user) => {
        if (!user || user.isAnonymous || user.provider === 'guest') {
            alert('الزوار غير مخولين بإنشاء حساب مطعم. يرجى تسجيل الدخول بحساب معتمد أولاً.');
            window.location.href = 'index.html';
            return;
        }
        currentUser = user;
    });

    // Populate categories
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (typeof APP_DATA !== 'undefined' && APP_DATA.categories) {
        // Skip 'all' category
        APP_DATA.categories.filter(c => c.id !== 'all').forEach(cat => {
            const label = document.createElement('label');
            label.className = 'category-checkbox';
            label.innerHTML = `
                <input type="checkbox" name="categories" value="${cat.id}">
                <span>${cat.name}</span>
            `;
            categoriesGrid.appendChild(label);
        });
    }

    // Step 1: Select Type
    window.selectAccountType = function(type) {
        selectedType = type;
        const cards = document.querySelectorAll('.card-choice');
        cards[0].classList.toggle('selected', type === 'commercial');
        cards[1].classList.toggle('selected', type === 'home');
        
        // Auto-advance to step 2
        setTimeout(() => nextStep(), 300);
    };

    window.nextStep = function() {
        if (currentStep === 1 && !selectedType) {
            alert('يرجى اختيار نوع النشاط أولاً');
            return;
        }
        if (currentStep === 2) {
            const name = document.getElementById('restName').value.trim();
            const phone = document.getElementById('restPhone').value.trim();
            if (!name || !phone) {
                alert('يرجى ملء الاسم ورقم الهاتف');
                return;
            }
        }
        if (currentStep === 3) {
            const lat = document.getElementById('restLat').value;
            const lng = document.getElementById('restLng').value;
            if (!lat || !lng) {
                alert('يرجى تحديد موقع المطعم على الخريطة');
                return;
            }
        }

        if (currentStep < 4) {
            document.getElementById(`step${currentStep}`).classList.remove('active');
            currentStep++;
            document.getElementById(`step${currentStep}`).classList.add('active');
            
            // Map trigger
            if (currentStep === 3) {
                initMap();
            }
            
            updateNavigation();
        } else {
            // Submit onboarding data
            saveOnboardingData();
        }
    };

    window.prevStep = function() {
        if (currentStep > 1) {
            document.getElementById(`step${currentStep}`).classList.remove('active');
            currentStep--;
            document.getElementById(`step${currentStep}`).classList.add('active');
            updateNavigation();
        }
    };

    function updateNavigation() {
        btnPrev.style.display = currentStep > 1 ? 'flex' : 'none';
        btnNext.textContent = currentStep === 4 ? 'تأكيد وحفظ الحساب' : 'التالي';
    }

    function initMap() {
        if (onboardingMap) return;
        setTimeout(() => {
            onboardingMap = L.map('onboardingMap').setView([defaultLat, defaultLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(onboardingMap);

            restaurantMarker = L.marker([defaultLat, defaultLng], {draggable: true}).addTo(onboardingMap);
            
            document.getElementById('restLat').value = defaultLat;
            document.getElementById('restLng').value = defaultLng;

            // Invalidate size to prevent gray map glitch
            setTimeout(() => {
                onboardingMap.invalidateSize();
            }, 200);

            onboardingMap.on('click', (e) => {
                restaurantMarker.setLatLng(e.latlng);
                document.getElementById('restLat').value = e.latlng.lat;
                document.getElementById('restLng').value = e.latlng.lng;
            });

            restaurantMarker.on('dragend', () => {
                const pos = restaurantMarker.getLatLng();
                document.getElementById('restLat').value = pos.lat;
                document.getElementById('restLng').value = pos.lng;
            });
        }, 100);
    }

    // Menu builder
    let mealIndex = 0;
    window.addMenuItemForm = function() {
        const list = document.getElementById('menuBuilderList');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item-form';
        itemDiv.id = `meal-${mealIndex}`;
        itemDiv.innerHTML = `
            <button class="btn-remove-item" onclick="removeMenuItemForm(${mealIndex})"><i class="fas fa-trash"></i></button>
            <div class="form-group" style="margin-bottom:8px;">
                <label>اسم الوجبة *</label>
                <input type="text" name="mealName" required placeholder="مثال: نفر كباب غنم">
            </div>
            <div class="form-group" style="margin-bottom:8px;">
                <label>السعر بالدينار العراقي *</label>
                <input type="number" name="mealPrice" required placeholder="10000">
            </div>
            <div class="form-group">
                <label>الوصف</label>
                <input type="text" name="mealDesc" placeholder="مكونات الوجبة أو الحجم...">
            </div>
        `;
        list.appendChild(itemDiv);
        mealIndex++;
    };

    window.removeMenuItemForm = function(idx) {
        document.getElementById(`meal-${idx}`).remove();
    };

    // Add first meal input by default
    addMenuItemForm();

    function saveOnboardingData() {
        try {
            const db = authManager.db;
            if (!db) {
                alert('تعذر الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.');
                return;
            }

            if (!currentUser) {
                alert('لم يتم العثور على جلسة مستخدم صالحة. يرجى تسجيل الدخول مجدداً.');
                return;
            }

            btnNext.disabled = true;
            btnNext.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جاري حفظ البيانات...';

            const name = document.getElementById('restName').value.trim();
            const phone = document.getElementById('restPhone').value.trim();
            const description = document.getElementById('restDesc').value.trim();
            
            let lat = parseFloat(document.getElementById('restLat').value);
            let lng = parseFloat(document.getElementById('restLng').value);

            // Fallback if coordinates are invalid to prevent Firestore write crashes (NaN is unsupported in Firestore)
            if (isNaN(lat) || isNaN(lng)) {
                console.warn("Invalid coordinates detected, falling back to default Al-Noamaniah center.");
                lat = defaultLat;
                lng = defaultLng;
            }

            // Get categories
            const checkedCats = Array.from(document.querySelectorAll('input[name="categories"]:checked')).map(el => el.value);

            // Get meals
            const mealForms = document.querySelectorAll('.menu-item-form');
            const menuItems = [];
            mealForms.forEach(form => {
                const mealName = form.querySelector('input[name="mealName"]').value.trim();
                const mealPriceInput = form.querySelector('input[name="mealPrice"]').value;
                const mealPrice = parseFloat(mealPriceInput);
                const mealDesc = form.querySelector('input[name="mealDesc"]').value.trim();

                if (mealName && !isNaN(mealPrice)) {
                    menuItems.push({
                        id: 'm_' + Math.random().toString(36).substr(2, 9),
                        name: mealName,
                        price: mealPrice,
                        description: mealDesc,
                        isAvailable: true
                    });
                }
            });

            const restaurantId = 'rest_' + currentUser.uid;

            // 1. Create Restaurant document & 2. Update User profile role in users collection
            const savePromise = db.collection('restaurants').doc(restaurantId).set({
                id: restaurantId,
                ownerUid: currentUser.uid,
                name: name,
                type: selectedType,
                description: description,
                phone: phone,
                categories: checkedCats,
                rating: 5.0,
                ratingCount: 0,
                lat: lat,
                lng: lng,
                isActive: true,
                menu: menuItems
            }).then(() => {
                return db.collection('users').doc(currentUser.uid).set({
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    role: 'restaurant',
                    restaurantId: restaurantId
                }, { merge: true });
            });

            // 1.5 seconds timeout to prevent hanging UI
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("TIMEOUT")), 1500);
            });

            // Race them
            Promise.race([savePromise, timeoutPromise])
                .then(() => {
                    // Save backup to Local Storage on success for instant offline-first customer display
                    const localRestData = {
                        id: restaurantId,
                        ownerUid: currentUser.uid,
                        name: name,
                        type: selectedType,
                        description: description,
                        phone: phone,
                        categories: checkedCats,
                        rating: 5.0,
                        ratingCount: 0,
                        lat: lat,
                        lng: lng,
                        isActive: true,
                        menu: menuItems
                    };
                    localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(localRestData));

                    // Update local storage user state
                    const localUser = {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        email: currentUser.email,
                        role: 'restaurant',
                        restaurantId: restaurantId
                    };
                    localStorage.setItem('al_noamaniah_user', JSON.stringify(localUser));

                    alert('تم تأسيس الحساب بنجاح! سيتم توجيهك إلى لوحة التحكم الخاصة بك.');
                    window.location.href = 'restaurant.html';
                })
                .catch(err => {
                    if (err.message === "TIMEOUT") {
                        console.warn("Save operation timed out. Saving locally as fallback.");
                        
                        // Save backup to Local Storage
                        const localRestData = {
                            id: restaurantId,
                            ownerUid: currentUser.uid,
                            name: name,
                            type: selectedType,
                            description: description,
                            phone: phone,
                            categories: checkedCats,
                            rating: 5.0,
                            ratingCount: 0,
                            lat: lat,
                            lng: lng,
                            isActive: true,
                            menu: menuItems
                        };
                        localStorage.setItem('fallback_restaurant_data_' + restaurantId, JSON.stringify(localRestData));
                        
                        const localUser = {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName,
                            email: currentUser.email,
                            role: 'restaurant',
                            restaurantId: restaurantId
                        };
                        localStorage.setItem('al_noamaniah_user', JSON.stringify(localUser));
                        
                        alert('تنبيه: تعذر تأكيد الحفظ الفوري على السيرفر بسبب بطء شبكة Firebase، ولكن تم حفظ البيانات محلياً على جهازك لتتمكن من المتابعة واختبار التطبيق فوراً!');
                        window.location.href = 'restaurant.html';
                    } else {
                        console.error("Error saving onboarding data asynchronously:", err);
                        alert('حدث خطأ أثناء حفظ البيانات: ' + err.message);
                        btnNext.disabled = false;
                        btnNext.textContent = 'تأكيد وحفظ الحساب';
                    }
                });
        } catch (e) {
            console.error("Synchronous error during saveOnboardingData execution:", e);
            alert("حدث خطأ فني غير متوقع: " + e.message);
            btnNext.disabled = false;
            btnNext.textContent = 'تأكيد وحفظ الحساب';
        }
    }
});
