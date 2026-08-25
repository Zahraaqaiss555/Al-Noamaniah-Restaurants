-- ==========================================================================
-- قاعدة بيانات مطاعم النعمانية (Al-Noamaniah Restaurants Database Schema)
-- MySQL / MariaDB Compatible
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS `al_noamaniah_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `al_noamaniah_db`;

-- 1. جدول الأحياء ورسوم التوصيل (Neighborhoods)
CREATE TABLE IF NOT EXISTS `neighborhoods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `delivery_fee` INT NOT NULL DEFAULT 2000,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول تصنيفات الطعام (Categories)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول المستخدمين (Users)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(100) UNIQUE NOT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `password` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `role` ENUM('customer', 'restaurant', 'driver', 'admin') DEFAULT 'customer',
    `restaurant_id` VARCHAR(50) NULL,
    `photo_url` TEXT NULL,
    `provider` VARCHAR(50) DEFAULT 'email',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول المطاعم (Restaurants)
CREATE TABLE IF NOT EXISTS `restaurants` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `category_id` VARCHAR(50) NOT NULL,
    `rating` DECIMAL(2,1) DEFAULT 4.5,
    `rating_count` INT DEFAULT 100,
    `delivery_time` VARCHAR(50) DEFAULT '20-35 دقيقة',
    `delivery_fee` VARCHAR(50) DEFAULT '2,000 د.ع',
    `badge` VARCHAR(100) NULL,
    `image` TEXT NULL,
    `cover` TEXT NULL,
    `description` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول عناصر قائمة الطعام (Menu Items)
CREATE TABLE IF NOT EXISTS `menu_items` (
    `id` VARCHAR(50) PRIMARY KEY,
    `restaurant_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `price` INT NOT NULL,
    `image` TEXT NULL,
    `popular` TINYINT(1) DEFAULT 0,
    `is_available` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول الطلبات (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
    `id` VARCHAR(50) PRIMARY KEY,
    `customer_uid` VARCHAR(100) NULL,
    `customer_name` VARCHAR(150) NOT NULL,
    `customer_phone` VARCHAR(30) NOT NULL,
    `neighborhood_name` VARCHAR(100) NOT NULL,
    `address_details` TEXT NULL,
    `notes` TEXT NULL,
    `payment_method` VARCHAR(50) DEFAULT 'cash',
    `subtotal` INT NOT NULL,
    `delivery_fee` INT NOT NULL,
    `total_price` INT NOT NULL,
    `items_json` JSON NOT NULL,
    `status` ENUM('new', 'preparing', 'delivering', 'completed', 'cancelled') DEFAULT 'new',
    `driver_uid` VARCHAR(100) NULL,
    `driver_name` VARCHAR(150) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================================
-- بيانات أولية (Initial Seed Data)
-- ==========================================================================

-- 1. إدخال الأحياء
INSERT INTO `neighborhoods` (`id`, `name`, `delivery_fee`) VALUES
(1, 'حي المعلمين', 2000),
(2, 'حي الربيع', 2000),
(3, 'حي السراي', 1500),
(4, 'الشارع العام / السوق', 1500),
(5, 'حي العسكري', 2500)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 2. إدخال التصنيفات
INSERT INTO `categories` (`id`, `name`, `icon`) VALUES
('all', 'الكل', 'fa-border-all'),
('mandi', 'مندي وقوزي', 'fa-utensils'),
('grills', 'مشاوي وكباب', 'fa-drumstick-bite'),
('shawarma', 'شاورما وصاج', 'fa-bread-slice'),
('burger', 'برجر وسريع', 'fa-burger'),
('pizza', 'بيتزا وفطاير', 'fa-pizza-slice'),
('fish', 'سمك مسكوف', 'fa-fish'),
('drinks', 'عصائر وكافيه', 'fa-mug-hot'),
('sweets', 'حلويات وكنافة', 'fa-ice-cream')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 3. إدخال المطاعم
INSERT INTO `restaurants` (`id`, `name`, `category_id`, `rating`, `rating_count`, `delivery_time`, `delivery_fee`, `badge`, `image`, `cover`, `description`) VALUES
('r1', 'مطبخ وحنيذ الشيوخ', 'mandi', 4.9, 520, '25-35 دقيقة', '2,000 د.ع', 'مندي أصيل', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80', 'متخصصون في المندي العراقي، حنيذ اللحم، والقوزي على تمن البسمتي.'),
('r2', 'كباب وكاساس النعمانية', 'grills', 4.8, 380, '20-30 دقيقة', '2,000 د.ع', 'مشاوي عادية وفحم', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 'أجود أنواع الكباب العراقي والمشاوي المشكلة على الفحم الطبيعي.'),
('r3', 'شاورما وصاج الفراشة', 'shawarma', 4.7, 410, '15-25 دقيقة', '1,500 د.ع', 'شاورما وصاج', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=1200&q=80', 'شاورما عراقي دبل ومشروبات وصاج كلاسيك مع صوصات خاصة.'),
('r4', 'مسكوف دجلة النعمانية', 'fish', 4.9, 290, '35-45 دقيقة', 'مجاناً', 'سمك مسكوف', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80', 'سمك مسكوف حطب عراقي من نهر دجلة طازج يومياً.')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 4. إدخال عناصر القائمة
INSERT INTO `menu_items` (`id`, `restaurant_id`, `name`, `description`, `price`, `image`, `popular`) VALUES
('m101', 'r1', 'وجبة مندي لحم غنم سبيشل', 'لحم غنم طازج محمر مع رز مندي بسمتي فاخر والمكسرات.', 14000, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80', 1),
('m102', 'r1', 'صينية قوزي الشيوخ (نفرين)', 'كتف غنم بلدي محمر مع رز أحمر وأصفر ومقبلات مشكلة.', 26000, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 1),
('m201', 'r2', 'نفر كباب لحم بلدي (4 شيش)', 'كباب لحم غنم عراقي مشوي على الفحم مع الخبز الحار والطماطم.', 10000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', 1),
('m301', 'r3', 'وجبة صاج شاورما عربي دبل', 'شاورما لحم بلدي محشوة مع بطاطس ومخلل وصوص الثوم الفاخر.', 7000, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80', 1),
('m501', 'r4', 'كيلو سمك مسكوف حطب', 'سمك بني أو كطان عراقي مسكوف على الخشب مع التوشيح والعنبة.', 16000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', 1)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 5. إدخال مستخدمين تجريبين (سائق، مدير مطعم، زبون)
INSERT INTO `users` (`uid`, `display_name`, `email`, `password`, `role`, `restaurant_id`, `phone`) VALUES
('usr_driver1', 'سائق النعمانية 1', 'driver@alnoamaniah.iq', '123456', 'driver', NULL, '07700000001'),
('usr_rest1', 'مدير مطبخ الشيوخ', 'rest1@alnoamaniah.iq', '123456', 'restaurant', 'r1', '07700000002'),
('usr_customer1', 'أحمد النعماني', 'ahmed@alnoamaniah.iq', '123456', 'customer', NULL, '07700000003')
ON DUPLICATE KEY UPDATE `display_name`=`display_name`;
