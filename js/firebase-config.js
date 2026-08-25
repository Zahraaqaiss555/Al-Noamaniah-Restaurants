// ==========================================================================
// Firebase Authentication Configuration & Service Layer (Al-Noamaniah App)
// ==========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyAXSrupLOPKw2XcMTFXVnUueZwcDfVNNLY",
    authDomain: "city-resturant.firebaseapp.com",
    projectId: "city-resturant",
    storageBucket: "city-resturant.firebasestorage.app",
    messagingSenderId: "326730264944",
    appId: "1:326730264944:web:af6d4d47afb98ae9f49fb5",
    measurementId: "G-GDV14HCT1E"
};

// Initialize Firebase
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        
        // Initialize Auth
        firebaseAuth = firebase.auth();
        
        // Initialize Firestore
        firebaseDb = firebase.firestore();

        // Enable offline persistence for smoother local testing
        firebaseDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time.
                console.warn("Firestore persistence failed: Multiple tabs open.");
            } else if (err.code == 'unimplemented') {
                // The current browser does not support all of the features required to enable persistence
                console.warn("Firestore persistence failed: Browser not supported.");
            }
        });

        // Set Arabic Language for Auth SMS & Email templates
        firebaseAuth.useDeviceLanguage();
    }
} catch (e) {
    console.warn("Firebase initialization warning:", e);
}

class FirebaseAuthManager {
    constructor() {
        this.auth = firebaseAuth;
        this.db = firebaseDb;
        this.currentUser = null;
    }

    // 1. مراقبة حالة جلسة المستخدم الحقيقية
    onAuthStateChanged(callback) {
        if (!this.auth) {
            // Fallback for offline / direct simulation
            const saved = localStorage.getItem('al_noamaniah_user');
            const user = saved ? JSON.parse(saved) : null;
            this.currentUser = user;
            callback(user);
            return () => {};
        }

        return this.auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                localStorage.removeItem('explicit_sign_out');
                
                // Get existing local storage data to preserve role and restaurantId
                let role = null;
                let restaurantId = null;
                const saved = localStorage.getItem('al_noamaniah_user');
                if (saved) {
                    try {
                        const localUser = JSON.parse(saved);
                        if (localUser.uid === firebaseUser.uid) {
                            role = localUser.role;
                            restaurantId = localUser.restaurantId;
                        }
                    } catch(e) {}
                }

                const userModel = this._formatUser(firebaseUser);
                if (role) userModel.role = role;
                if (restaurantId) userModel.restaurantId = restaurantId;

                this.currentUser = userModel;
                localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
                callback(userModel);
            } else {
                // If it is an explicit sign out, clear everything
                if (localStorage.getItem('explicit_sign_out') === 'true') {
                    this.currentUser = null;
                    localStorage.removeItem('al_noamaniah_user');
                    callback(null);
                    return;
                }

                // If Firebase Auth returns null (e.g. initial check or guest mode), check if there is a saved local session
                const saved = localStorage.getItem('al_noamaniah_user');
                if (saved) {
                    try {
                        const localUser = JSON.parse(saved);
                        this.currentUser = localUser;
                        callback(localUser);
                    } catch (e) {
                        this.currentUser = null;
                        localStorage.removeItem('al_noamaniah_user');
                        callback(null);
                    }
                } else {
                    this.currentUser = null;
                    callback(null);
                }
            }
        });
    }

    // 2. تسجيل الدخول الحقيقي عبر حساب Google
    async signInWithGoogle() {
        if (!this.auth) {
            throw new Error('خدمة المصادقة غير متاحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({ prompt: 'select_account' });

            // نحاول Popup أولاً - إذا فشل نلجأ لـ Redirect
            try {
                const result = await this.auth.signInWithPopup(provider);
                const userModel = this._formatUser(result.user, 'google');
                this.currentUser = userModel;
                localStorage.removeItem('explicit_sign_out');
                localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
                return userModel;
            } catch (popupError) {
                // إذا رُفض الـ Popup أو كان النطاق غير مصرح، انتقل لـ Redirect
                if (
                    popupError.code === 'auth/popup-blocked' ||
                    popupError.code === 'auth/unauthorized-domain' ||
                    popupError.code === 'auth/operation-not-supported-in-this-environment'
                ) {
                    console.warn('Popup failed, falling back to redirect:', popupError.code);
                    // احفظ مسار العودة
                    sessionStorage.setItem('google_auth_redirect', 'true');
                    await this.auth.signInWithRedirect(provider);
                    return null; // الصفحة ستُعاد تحميلها
                }
                throw popupError;
            }
        } catch (error) {
            console.error("Firebase Google Auth Error:", error);
            throw new Error(this.formatFirebaseError(error));
        }
    }

    // 2b. معالجة نتيجة Redirect بعد العودة من Google
    async handleRedirectResult() {
        if (!this.auth) return null;
        try {
            const result = await this.auth.getRedirectResult();
            if (result && result.user) {
                const userModel = this._formatUser(result.user, 'google');
                this.currentUser = userModel;
                localStorage.removeItem('explicit_sign_out');
                localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
                sessionStorage.removeItem('google_auth_redirect');
                return userModel;
            }
            return null;
        } catch (error) {
            console.error("Firebase Redirect Result Error:", error);
            sessionStorage.removeItem('google_auth_redirect');
            return null;
        }
    }

    // 3. تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
    async signInWithEmail(email, password) {
        if (!this.auth) {
            return this._mockEmailLogin(email);
        }

        try {
            const result = await this.auth.signInWithEmailAndPassword(email.trim(), password);
            const userModel = this._formatUser(result.user, 'email');
            this.currentUser = userModel;
            localStorage.removeItem('explicit_sign_out');
            localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
            return userModel;
        } catch (error) {
            console.error("Firebase Email SignIn Error:", error);
            throw new Error(this.formatFirebaseError(error));
        }
    }

    // 4. إنشاء حساب جديد بالاسم والبريد وكلمة المرور
    async signUpWithEmail(fullName, email, password) {
        if (!this.auth) {
            return this._mockEmailRegister(fullName, email);
        }

        try {
            const result = await this.auth.createUserWithEmailAndPassword(email.trim(), password);
            if (result.user) {
                await result.user.updateProfile({
                    displayName: fullName.trim()
                });
            }
            const userModel = this._formatUser(result.user, 'email', fullName.trim());
            this.currentUser = userModel;
            localStorage.removeItem('explicit_sign_out');
            localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
            return userModel;
        } catch (error) {
            console.error("Firebase Email SignUp Error:", error);
            throw new Error(this.formatFirebaseError(error));
        }
    }

    // 5. استعادة كلمة المرور
    async resetPassword(email) {
        if (!this.auth) {
            return true;
        }

        try {
            await this.auth.sendPasswordResetEmail(email.trim());
            return true;
        } catch (error) {
            console.error("Firebase Password Reset Error:", error);
            throw new Error(this.formatFirebaseError(error));
        }
    }

    // 6. الدخول السريع كزائر / ضيف عبر Firebase Anonymous Auth
    async signInAsGuest() {
        if (!this.auth) {
            return this._mockGuestLogin();
        }

        try {
            const result = await this.auth.signInAnonymously();
            const userModel = this._formatUser(result.user, 'guest', 'زائر النعمانية');
            this.currentUser = userModel;
            localStorage.removeItem('explicit_sign_out');
            localStorage.setItem('al_noamaniah_user', JSON.stringify(userModel));
            return userModel;
        } catch (error) {
            console.warn("Firebase Anonymous Auth Fallback:", error);
            return this._mockGuestLogin();
        }
    }

    // 7. تسجيل الخروج الفعلي
    async signOut() {
        localStorage.setItem('explicit_sign_out', 'true');
        if (this.auth) {
            try {
                await this.auth.signOut();
            } catch (e) {
                console.error("Signout error:", e);
            }
        }
        this.currentUser = null;
        localStorage.removeItem('al_noamaniah_user');
    }

    // تنسيق كائن المستخدم الموحد
    _formatUser(firebaseUser, providerOverride = null, customName = null) {
        const isAnonymous = firebaseUser.isAnonymous;
        const providerId = providerOverride || (firebaseUser.providerData && firebaseUser.providerData[0] ? firebaseUser.providerData[0].providerId : (isAnonymous ? 'guest' : 'email'));

        let displayName = customName || firebaseUser.displayName;
        if (!displayName) {
            if (isAnonymous || providerId === 'guest') {
                displayName = 'زائر النعمانية';
            } else if (firebaseUser.email) {
                displayName = firebaseUser.email.split('@')[0];
            } else {
                displayName = 'مستخدم معتمد';
            }
        }

        return {
            uid: firebaseUser.uid,
            displayName: displayName,
            email: firebaseUser.email || (isAnonymous ? 'guest@alnoamaniah.iq' : 'user@alnoamaniah.iq'),
            photoUrl: firebaseUser.photoURL || (isAnonymous ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
            provider: providerId.includes('google') ? 'google' : (isAnonymous || providerId === 'guest' ? 'guest' : 'email'),
            isAnonymous: isAnonymous,
            createdAt: firebaseUser.metadata ? firebaseUser.metadata.creationTime : new Date().toISOString()
        };
    }

    // ترجمة وتوضيح أخطاء Firebase بالعربية الفصحى
    formatFirebaseError(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'البريد الإلكتروني المدخل غير صالح.';
            case 'auth/user-disabled':
                return 'تم تعطيل هذا الحساب من قبل الإدارة.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            case 'auth/email-already-in-use':
                return 'البريد الإلكتروني مسجل بالفعل مسبقاً، يرجى تسجيل الدخول.';
            case 'auth/weak-password':
                return 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف أو أرقام على الأقل.';
            case 'auth/popup-closed-by-user':
                return 'تم إلغاء عملية تسجيل الدخول قبل استكمالها.';
            case 'auth/unauthorized-domain':
                return 'النطاق غير مصرح له. يرجى التواصل مع الدعم الفني.';
            case 'auth/popup-blocked':
                return 'تم حجب النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة في إعدادات المتصفح.';
            case 'auth/network-request-failed':
                return 'فشل الاتصال بالشبكة، يرجى التحقق من اتصال الإنترنت.';
            case 'auth/too-many-requests':
                return 'تم حظر المحاولات مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة لاحقاً.';
            default:
                return error.message || 'حدث خطأ أثناء الاتصال بخدمة Firebase.';
        }
    }

    _mockGoogleLogin() {
        const user = {
            uid: 'google_' + Math.random().toString(36).substr(2, 9),
            displayName: 'أحمد النعماني',
            email: 'ahmed.alnoamani@gmail.com',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            provider: 'google',
            isAnonymous: false,
            createdAt: new Date().toISOString()
        };
        this.currentUser = user;
        localStorage.removeItem('explicit_sign_out');
        localStorage.setItem('al_noamaniah_user', JSON.stringify(user));
        return user;
    }

    _mockEmailLogin(email) {
        const name = email.split('@')[0];
        const user = {
            uid: 'usr_' + Math.random().toString(36).substr(2, 9),
            displayName: name,
            email: email,
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            provider: 'email',
            isAnonymous: false,
            createdAt: new Date().toISOString()
        };
        this.currentUser = user;
        localStorage.removeItem('explicit_sign_out');
        localStorage.setItem('al_noamaniah_user', JSON.stringify(user));
        return user;
    }

    _mockEmailRegister(name, email) {
        const user = {
            uid: 'usr_' + Math.random().toString(36).substr(2, 9),
            displayName: name,
            email: email,
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            provider: 'email',
            isAnonymous: false,
            createdAt: new Date().toISOString()
        };
        this.currentUser = user;
        localStorage.removeItem('explicit_sign_out');
        localStorage.setItem('al_noamaniah_user', JSON.stringify(user));
        return user;
    }

    _mockGuestLogin() {
        const user = {
            uid: 'guest_' + Math.random().toString(36).substr(2, 9),
            displayName: 'زائر النعمانية',
            email: 'guest@alnoamaniah.iq',
            photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            provider: 'guest',
            isAnonymous: true,
            createdAt: new Date().toISOString()
        };
        this.currentUser = user;
        localStorage.removeItem('explicit_sign_out');
        localStorage.setItem('al_noamaniah_user', JSON.stringify(user));
        return user;
    }
}

window.authManager = new FirebaseAuthManager();
