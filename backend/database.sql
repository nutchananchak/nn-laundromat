CREATE TABLE IF NOT EXISTS Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT 'User1234',
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Rider (
    rider_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Admin (
    admin_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Service_Type (
    service_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Service_Pricing (
    pricing_id VARCHAR(50) PRIMARY KEY,
    category ENUM('washDry', 'bedding', 'specialWashDry', 'specialBedding', 'extra') NOT NULL,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น',
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Order` (
    order_id VARCHAR(50) PRIMARY KEY,
    customer_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    service_id VARCHAR(50) NULL,
    service_name VARCHAR(100) NOT NULL,
    package_name VARCHAR(100) NULL,
    pickup_time VARCHAR(100) NULL,
    delivery_time VARCHAR(100) NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10, 7) NULL,
    lng DECIMAL(10, 7) NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    plastic_bag_count INT DEFAULT 0,
    note TEXT NULL,

    -- โปรโมชันสะสมแต้ม 10 ฟรี 1
    is_reward_used BOOLEAN DEFAULT FALSE,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,

    -- รูปที่โค้ดใช้จริง (รูปอื่นๆ เก็บใน Evidence_Photo)
    rider_basket_image LONGTEXT NULL,
    proof_image LONGTEXT NULL,

    -- สถานะขั้นตอนงาน
    status VARCHAR(50) DEFAULT 'pending',
    status_step INT DEFAULT 1,
    status_title VARCHAR(100) DEFAULT 'รอตรวจสอบยอดเงิน',

    -- การชำระเงิน
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_verified BOOLEAN DEFAULT FALSE,
    payment_rejected BOOLEAN DEFAULT FALSE,
    reject_reason TEXT NULL,

    -- การยกเลิกและคืนเงิน
    cancelled_at VARCHAR(100) NULL,
    cancel_reason TEXT NULL,
    refund_status ENUM('none', 'pending', 'refunded') DEFAULT 'none',
    refund_amount DECIMAL(10, 2) DEFAULT 0.00,
    refunded_at VARCHAR(100) NULL,

    -- การมอบหมายไรเดอร์
    pickup_rider_id VARCHAR(20) NULL,
    delivery_rider_id VARCHAR(20) NULL,

    -- ไทม์สแตมป์ (ข้อความภาษาไทยไว้แสดงผล เพราะหน้าเว็บกรองด้วยข้อความนี้อยู่)
    created_at VARCHAR(100) NOT NULL,
    verified_at VARCHAR(100) NULL,
    picked_up_at VARCHAR(100) NULL,
    delivering_at VARCHAR(100) NULL,
    delivered_at VARCHAR(100) NULL,

    -- เวลาจริงสำหรับเรียงลำดับ (created_at เป็นข้อความ เรียงตามเวลาไม่ได้)
    created_at_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order_phone (customer_phone),
    INDEX idx_order_step (status_step),
    INDEX idx_order_created_ts (created_at_ts),

    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE SET NULL,
    CONSTRAINT fk_order_pickup_rider FOREIGN KEY (pickup_rider_id) REFERENCES Rider(rider_id) ON DELETE SET NULL,
    CONSTRAINT fk_order_delivery_rider FOREIGN KEY (delivery_rider_id) REFERENCES Rider(rider_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Order_Special_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    count INT NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'ชิ้น',
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_special_order FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- หนึ่งออเดอร์มีหนึ่งการชำระเงิน (โค้ดอัปเดตด้วย WHERE order_id และ JOIN กับ Order)
CREATE TABLE IF NOT EXISTS Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    method VARCHAR(50) DEFAULT 'promptpay',
    amount DECIMAL(10, 2) NOT NULL,
    slip_image LONGTEXT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_rejected BOOLEAN DEFAULT FALSE,
    reject_reason TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment_order (order_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- photo_type เป็น VARCHAR เพราะโค้ดบันทึกค่า customer_basket, rider_pickup, pickup, delivery
CREATE TABLE IF NOT EXISTS Evidence_Photo (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    photo_type VARCHAR(30) NOT NULL,
    photo_url LONGTEXT NOT NULL,
    uploaded_by_rider_id VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_order FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_rider FOREIGN KEY (uploaded_by_rider_id) REFERENCES Rider(rider_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Customer_Report (
    report_id VARCHAR(50) PRIMARY KEY,
    customer_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at VARCHAR(100) NOT NULL,
    INDEX idx_report_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ข้อมูลตั้งต้น: INSERT IGNORE จึงรันซ้ำได้ ไม่ทับข้อมูลที่แอดมินแก้ไว้
-- ============================================================
INSERT IGNORE INTO Service_Type (service_id, name, base_price) VALUES
('wash_dry_fold', 'ซัก อบ พับ', 160.00),
('bedding', 'ชุดเครื่องนอน / แยกชิ้น', 200.00);

INSERT IGNORE INTO Service_Pricing (pricing_id, category, name, price, unit, description) VALUES
('S', 'washDry', 'ตะกร้า S (ไม่เกิน 15 ชิ้น)', 160.00, 'ตะกร้า', 'ผ้าไม่เกิน 15 ชิ้น'),
('M', 'washDry', 'ตะกร้า M (ไม่เกิน 35 ชิ้น)', 180.00, 'ตะกร้า', 'ผ้าไม่เกิน 35 ชิ้น'),
('L', 'washDry', 'ตะกร้า L (ไม่เกิน 65 ชิ้น)', 240.00, 'ตะกร้า', 'ผ้าไม่เกิน 65 ชิ้น'),
('3.5ft', 'bedding', 'ชุดเครื่องนอน 3.5 ฟุต (5 ชิ้น)', 200.00, 'ชุด', 'ชุดเครื่องนอน 3.5 ฟุต (5 ชิ้น)'),
('5ft', 'bedding', 'ชุดเครื่องนอน 5 ฟุต (5 ชิ้น)', 230.00, 'ชุด', 'ชุดเครื่องนอน 5 ฟุต (5 ชิ้น)'),
('6ft', 'bedding', 'ชุดเครื่องนอน 6 ฟุต (5 ชิ้น)', 250.00, 'ชุด', 'ชุดเครื่องนอน 6 ฟุต (5 ชิ้น)'),
('silk', 'specialWashDry', 'ผ้าไหม', 120.00, 'ตัว', 'ซักถนอมพิเศษ'),
('leather', 'specialWashDry', 'เสื้อหนัง', 150.00, 'ตัว', 'ซักถนอมพิเศษ'),
('fur', 'specialWashDry', 'ขนสัตว์', 150.00, 'ตัว', 'ซักถนอมพิเศษ'),
('evening_dress', 'specialWashDry', 'ชุดราตรี', 150.00, 'ตัว', 'ซักถนอมพิเศษ'),
('suit_top', 'specialWashDry', 'สูท (เฉพาะเสื้อ)', 120.00, 'ตัว', 'ซักแห้งเฉพาะเสื้อ'),
('suit_full', 'specialWashDry', 'สูท (เสื้อและกางเกง)', 180.00, 'ชุด', 'ซักแห้งครบชุด'),
('sequin', 'specialWashDry', 'เสื้อผ้าติดเลื่อม/เพชรประดับ', 120.00, 'ตัว', 'ซักถนอมพิเศษ'),
('brandname', 'specialWashDry', 'เสื้อผ้าแบรนด์เนม', 100.00, 'ตัว', 'ซักถนอมพิเศษ'),
('dry_clean_only', 'specialWashDry', 'เสื้อผ้าคำแนะนำ "ซักแห้งเท่านั้น"', 120.00, 'ตัว', 'ซักแห้งพิเศษ'),
('bed_sheet', 'specialBedding', 'ผ้าปู', 50.00, 'ชิ้น', 'ผ้าปูที่นอนแยกชิ้น'),
('pillow_case', 'specialBedding', 'ปลอกหมอน', 10.00, 'ชิ้น', 'ปลอกหมอนแยกชิ้น'),
('bolster_case', 'specialBedding', 'ปลอกหมอนข้าง', 10.00, 'ชิ้น', 'ปลอกหมอนข้างแยกชิ้น'),
('duvet_3_5', 'specialBedding', 'ผ้านวม 3.5 ฟุต', 130.00, 'ผืน', 'ผ้านวมแยกผืน'),
('duvet_5', 'specialBedding', 'ผ้านวม 5 ฟุต', 160.00, 'ผืน', 'ผ้านวมแยกผืน'),
('duvet_6', 'specialBedding', 'ผ้านวม 6 ฟุต', 180.00, 'ผืน', 'ผ้านวมแยกผืน'),
('extra_bag', 'extra', 'ถุงพลาสติกใส่ผ้า', 5.00, 'ใบ', 'ถุงกันเปื้อนสำหรับจัดส่ง');

-- รหัสผ่านตั้งต้นเป็นข้อความธรรมดา ต้องเปลี่ยนหลังติดตั้งจริง (ดูหมายเหตุเรื่อง bcrypt)
INSERT IGNORE INTO Rider (rider_id, name, phone_number, password, status) VALUES
('RD-01', 'วรรณา สีดา', '0942855891', 'rider1', 'active'),
('RD-02', 'วันดี ทองอ่อน', '0831887742', 'rider2', 'active'),
('RD-03', 'สตาร์ วินเพียว', '0840788915', 'rider3', 'inactive');

INSERT IGNORE INTO Admin (admin_id, username, name, password) VALUES
('ADM-01', 'admin@nnlaundromat.com', 'ฝ่ายปฏิบัติการกลาง', 'admin123'),
('ADM-02', 'manager', 'ผู้จัดการ', 'admin123');

SELECT 'Riders Ready' AS Status, COUNT(*) AS Total FROM Rider;
SELECT 'Admins Ready' AS Status, COUNT(*) AS Total FROM Admin;
SELECT 'Services Ready' AS Status, COUNT(*) AS Total FROM Service_Type;
SELECT 'Pricings Ready' AS Status, COUNT(*) AS Total FROM Service_Pricing;