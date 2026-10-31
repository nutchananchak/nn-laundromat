import pool from '../config/db.js';
import { uploadImage } from '../utils/cloudinary.js';

const getNextRunningOrderId = async (connection) => {
  const [rows] = await connection.query(`
    SELECT CAST(SUBSTRING(order_id, 4) AS UNSIGNED) AS max_num 
    FROM \`Order\` 
    WHERE order_id REGEXP '^NN-[0-9]+$' 
    ORDER BY max_num DESC 
    LIMIT 1 
    FOR UPDATE
  `);

  let nextNum = 1;
  if (rows.length > 0 && rows[0].max_num !== null) {
    nextNum = Number(rows[0].max_num) + 1;
  }

  return `NN-${String(nextNum).padStart(6, '0')}`;
};

// 1. ดึงรายการออเดอร์ทั้งหมด
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.query;

    const params = [];
    let whereSql = '';
    if (userId) {
      whereSql = 'WHERE o.customer_phone = ?';
      params.push(userId);
    }

    const [rows] = await pool.query(`
      SELECT
        o.order_id AS id,
        o.customer_id AS customerId,
        o.customer_name AS customerName,
        o.customer_phone AS customerPhone,
        o.service_name AS serviceName,
        o.package_name AS packageName,
        o.total_price AS totalPrice,
        o.status,
        o.status_step AS statusStep,
        o.status_title AS statusTitle,
        o.pickup_time AS pickupTime,
        o.delivery_time AS deliveryTime,
        o.note,
        o.address,
        o.lat,
        o.lng,
        o.plastic_bag_count AS plasticBagCount,
        o.rider_basket_image AS basketImageFromOrder,
        o.proof_image AS proofImageFromOrder,
        o.payment_status AS paymentStatus,
        o.payment_verified AS paymentVerified,
        o.payment_rejected AS paymentRejected,
        o.reject_reason AS rejectReason,
        o.cancel_reason AS cancelReason,
        o.cancelled_at AS cancelledAt,
        o.verified_at AS verifiedAt,
        o.delivered_at AS deliveredAt,
        o.created_at AS createdAt,
        p.slip_image AS slipImage,
        p.amount AS paymentAmount,
        r.rider_id AS riderId,
        r.name AS riderName,
        r.phone_number AS riderPhone
      FROM \`Order\` o
      LEFT JOIN Payment p ON p.order_id = o.order_id
      LEFT JOIN Rider r ON r.rider_id = COALESCE(o.delivery_rider_id, o.pickup_rider_id)
      ${whereSql}
      ORDER BY o.created_at_ts DESC, o.order_id DESC
    `, params);

    // ดึงรูปหลักฐานและรายการพิเศษของทุกออเดอร์ "ครั้งเดียว" แทนที่จะวนยิงทีละออเดอร์
    const ids = rows.map(r => r.id);
    const photosByOrder = {};
    const itemsByOrder = {};

    if (ids.length > 0) {
      const [photos] = await pool.query(
        'SELECT order_id, photo_type, photo_url FROM Evidence_Photo WHERE order_id IN (?) ORDER BY photo_id ASC',
        [ids]
      );
      photos.forEach(p => {
        (photosByOrder[p.order_id] = photosByOrder[p.order_id] || []).push(p);
      });

      const [items] = await pool.query(
        'SELECT item_id AS id, order_id, name, count, unit, price, total FROM Order_Special_Items WHERE order_id IN (?)',
        [ids]
      );
      items.forEach(i => {
        (itemsByOrder[i.order_id] = itemsByOrder[i.order_id] || []).push(i);
      });
    }

    const formattedOrders = rows.map((row) => {
      const photos = photosByOrder[row.id] || [];

      let proofImage = row.proofImageFromOrder || null;
      let riderPickupImage = row.basketImageFromOrder || null;
      let customerBasketImage = null;

      photos.forEach(p => {
        if (p.photo_type === 'delivery' || p.photo_type === 'delivery_proof') {
          proofImage = p.photo_url;
        }
        if (p.photo_type === 'customer_basket' || p.photo_type === 'customer_place' || p.photo_type === 'basket') {
          customerBasketImage = p.photo_url;
        }
        if (p.photo_type === 'rider_pickup' || p.photo_type === 'rider_basket' || p.photo_type === 'pickup') {
          riderPickupImage = p.photo_url;
        }
      });

      if (!customerBasketImage && row.basketImageFromOrder && Number(row.statusStep) <= 3) {
        customerBasketImage = row.basketImageFromOrder;
      }

      const specialItems = (itemsByOrder[row.id] || []).map(({ order_id, ...rest }) => rest);

      return {
        id: row.id,
        customerName: row.customerName || 'คุณลูกค้า',
        customerPhone: row.customerPhone || '-',
        address: row.address,
        lat: row.lat ? Number(row.lat) : null,
        lng: row.lng ? Number(row.lng) : null,
        serviceName: row.serviceName,
        packageName: row.packageName,
        specialItems,
        status: row.status,
        statusStep: Number(row.statusStep),
        statusTitle: row.statusTitle,
        totalPrice: Number(row.totalPrice || row.paymentAmount || 0),
        pickupTime: row.pickupTime,
        deliveryTime: row.deliveryTime,
        note: row.note || '',
        plasticBagCount: Number(row.plasticBagCount || 0),
        slipImage: row.slipImage,
        proofImage,
        riderPickupImage,
        riderBasketImage: riderPickupImage,
        customerBasketImage,
        basketImage: customerBasketImage || riderPickupImage,
        paymentVerified: Boolean(row.paymentVerified),
        paymentRejected: Boolean(row.paymentRejected),
        rejectReason: row.rejectReason,
        cancelReason: row.cancelReason,
        cancelledAt: row.cancelledAt,
        verifiedAt: row.verifiedAt,
        deliveredAt: row.deliveredAt,
        createdAt: row.createdAt,
        rider: row.riderId ? {
          id: row.riderId,
          name: row.riderName,
          phone: row.riderPhone
        } : null
      };
    });

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('🔥 Error SQL Detail:', error.message);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
      detail: error.message
    });
  }
};

// 2. สร้างคำสั่งซื้อใหม่
export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body;
        data.slipImage = await uploadImage(data.slipImage, 'slips');
        data.customerBasketImage = await uploadImage(
        data.customerBasketImage || data.basketImage || data.riderBasketImage || null,
        'basket'
    );
    const orderId = await getNextRunningOrderId(connection);
    const cleanPhone = String(data.customerPhone || '0800000000').replace(/\D/g, '');

    // 1. ตรวจสอบหรือสร้าง Customer
    const [existingCustomers] = await connection.query(
      'SELECT customer_id FROM Customer WHERE phone_number = ?',
      [cleanPhone]
    );

    let customerId;
    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].customer_id;
    } else {
      const [newCustomer] = await connection.query(
        'INSERT INTO Customer (name, phone_number, password, address) VALUES (?, ?, ?, ?)',
        [data.customerName || 'คุณลูกค้า', cleanPhone, 'User1234', data.address || '']
      );
      customerId = newCustomer.insertId;
    }

    // 2. ตรวจสอบ Service_Type
    const [services] = await connection.query(
      'SELECT service_id, name FROM Service_Type WHERE name LIKE ? LIMIT 1',
      [`%${data.serviceName || 'ซัก อบ พับ'}%`]
    );
    const serviceId = services.length > 0 ? services[0].service_id : 'wash_dry_fold';
    const actualServiceName = services.length > 0 ? services[0].name : (data.serviceName || 'ซัก อบ พับ');

    // 3. บันทึกลงตาราง Order
    const insertOrderSql = `
      INSERT INTO \`Order\` (
        order_id, customer_id, customer_name, customer_phone,
        service_id, service_name, package_name,
        pickup_time, delivery_time, address, lat, lng,
        total_price, plastic_bag_count, note,
        rider_basket_image,
        status, status_step, status_title,
        payment_status, payment_verified, payment_rejected,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // รูปจุดวางผ้าของลูกค้าตอนสั่งซื้อ
    const customerBasketPhoto = data.customerBasketImage || data.basketImage || data.riderBasketImage || null;

    await connection.query(insertOrderSql, [
      orderId,
      customerId,
      data.customerName || 'คุณลูกค้า',
      cleanPhone,
      serviceId,
      actualServiceName,
      data.packageName || '',
      data.pickupTime || '09:00 - 10:00 น.',
      data.deliveryTime || '18:00 - 19:00 น.',
      data.address || '',
      data.lat || null,
      data.lng || null,
      Number(data.totalPrice || 0),
      Number(data.plasticBagCount || 0),
      data.note || '',
      null, // rider_basket_image ยังเป็น null รอไรเดอร์ถ่าย
      data.status || 'pending',
      Number(data.statusStep || 1),
      data.statusTitle || 'รอตรวจสอบสลิป',
      'pending',
      false,
      false,
      data.createdAt || new Date().toLocaleString('th-TH')
    ]);

    // บันทึกรูปถ่ายจุดวางผ้าของลูกค้าลง Evidence_Photo เป็น 'customer_basket' (หรือ 'pickup' ถ้า schema บังคับ)
    if (customerBasketPhoto) {
      await connection.query(
        'INSERT INTO Evidence_Photo (order_id, photo_type, photo_url) VALUES (?, ?, ?)',
        [orderId, 'customer_basket', customerBasketPhoto]
      ).catch(async () => {
        // Fallback หาก Database ยังเป็น ENUM ตัวเก่า
        await connection.query(
          'INSERT INTO Evidence_Photo (order_id, photo_type, photo_url) VALUES (?, ?, ?)',
          [orderId, 'pickup', customerBasketPhoto]
        );
      });
    }

    // 4. บันทึกหลักฐานสลิปลงตาราง Payment
    if (data.slipImage) {
      const insertPaymentSql = `
        INSERT INTO Payment (order_id, method, amount, slip_image, is_verified, is_rejected)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.query(insertPaymentSql, [
        orderId,
        'promptpay',
        Number(data.totalPrice || 0),
        data.slipImage,
        false,
        false
      ]);
    }

    // 5. บันทึกรายการพิเศษ Order_Special_Items
    if (data.specialItems && Array.isArray(data.specialItems) && data.specialItems.length > 0) {
      for (const item of data.specialItems) {
        await connection.query(
          'INSERT INTO Order_Special_Items (order_id, name, count, unit, price, total) VALUES (?, ?, ?, ?, ?, ?)',
          [
            orderId,
            item.name,
            Number(item.count || 1),
            item.unit || 'ชิ้น',
            Number(item.price || 0),
            Number(item.total || (item.price * (item.count || 1)))
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      order: { 
        ...data, 
        id: orderId, 
        orderId: orderId,
        customerBasketImage: customerBasketPhoto,
        riderBasketImage: null, 
        basketImage: null 
      } 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'สร้างออเดอร์ลงฐานข้อมูลไม่สำเร็จ', detail: error.message });
  } finally {
    connection.release();
  }
};

// 3. อัปเดตสถานะออเดอร์
export const updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const body = req.body;
        body.slipImage = await uploadImage(body.slipImage, 'slips');
        body.riderPickupImage = await uploadImage(body.riderPickupImage, 'pickup');
        body.riderBasketImage = await uploadImage(body.riderBasketImage, 'pickup');
    const deliveryUrl = await uploadImage(body.proofImage || body.riderDeliveryImage, 'delivery');
        body.proofImage = deliveryUrl;
        body.riderDeliveryImage = deliveryUrl;

    const orderFields = [];
    const orderValues = [];

    // อัปเดตสถานะการชำระเงิน
    if (body.paymentVerified !== undefined) {
      orderFields.push('payment_verified = ?');
      orderValues.push(Boolean(body.paymentVerified));

      await connection.query(
        'UPDATE Payment SET is_verified = ?, is_rejected = FALSE WHERE order_id = ?',
        [Boolean(body.paymentVerified), id]
      );
    }

    if (body.paymentRejected !== undefined) {
      orderFields.push('payment_rejected = ?');
      orderValues.push(Boolean(body.paymentRejected));
      orderFields.push('reject_reason = ?');
      orderValues.push(body.rejectReason || null);

      await connection.query(
        'UPDATE Payment SET is_rejected = ?, reject_reason = ? WHERE order_id = ?',
        [Boolean(body.paymentRejected), body.rejectReason || null, id]
      );
    }

    // อัปเดตสลิปใหม่
    if (body.slipImage) {
      await connection.query(
        'UPDATE Payment SET slip_image = ?, is_rejected = FALSE, reject_reason = NULL WHERE order_id = ?',
        [body.slipImage, id]
      );
    }

    // รูปถ่ายจุดรับผ้าที่ไรเดอร์ถ่าย (บันทึกลง rider_basket_image ใน Order)
    const riderCapturedPickup = body.riderPickupImage || (Number(body.statusStep) >= 4 ? body.riderBasketImage : null);
    if (riderCapturedPickup) {
      orderFields.push('rider_basket_image = ?');
      orderValues.push(riderCapturedPickup);

      await connection.query(
        'INSERT INTO Evidence_Photo (order_id, photo_type, photo_url) VALUES (?, ?, ?)',
        [id, 'rider_pickup', riderCapturedPickup]
      ).catch(async () => {
        await connection.query(
          'INSERT INTO Evidence_Photo (order_id, photo_type, photo_url) VALUES (?, ?, ?)',
          [id, 'pickup', riderCapturedPickup]
        );
      });
    }

    // รูปส่งมอบผ้าคืนสำเร็จ
    if (body.proofImage || body.riderDeliveryImage) {
      const deliveryImg = body.proofImage || body.riderDeliveryImage;
      orderFields.push('proof_image = ?');
      orderValues.push(deliveryImg);

      await connection.query(
        'INSERT INTO Evidence_Photo (order_id, photo_type, photo_url) VALUES (?, ?, ?)',
        [id, 'delivery', deliveryImg]
      );
    }

    // อัปเดตสถานะทั่วไป
    if (body.statusStep !== undefined) { orderFields.push('status_step = ?'); orderValues.push(Number(body.statusStep)); }
    if (body.statusTitle !== undefined) { orderFields.push('status_title = ?'); orderValues.push(body.statusTitle); }
    if (body.status !== undefined) { orderFields.push('status = ?'); orderValues.push(body.status); }
    if (body.verifiedAt !== undefined) { orderFields.push('verified_at = ?'); orderValues.push(body.verifiedAt); }
    if (body.cancelReason !== undefined) { orderFields.push('cancel_reason = ?'); orderValues.push(body.cancelReason); }
    if (body.cancelledAt !== undefined) { orderFields.push('cancelled_at = ?'); orderValues.push(body.cancelledAt); }

    // มอบหมายไรเดอร์
    if (body.rider && body.rider.id) {
      orderFields.push('pickup_rider_id = ?', 'delivery_rider_id = ?');
      orderValues.push(String(body.rider.id), String(body.rider.id));
    }

    if (orderFields.length > 0) {
      orderValues.push(id);
      await connection.query(
        `UPDATE \`Order\` SET ${orderFields.join(', ')} WHERE order_id = ?`,
        orderValues
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'อัปเดตสถานะออเดอร์ไม่สำเร็จ', detail: error.message });
  } finally {
    connection.release();
  }
};