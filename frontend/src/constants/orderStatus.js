import { CreditCard, ShieldCheck, Clock, Bike, PackageCheck, Shirt, Truck, CheckCircle2 } from 'lucide-react';

export const ORDER_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',       // รอชำระเงิน
  PAYMENT_VERIFICATION: 'payment_verification', // ลูกค้าแนบสลิปแล้ว กำลังรอตรวจยอด
  PENDING: 'pending',                         // ยอดเงินผ่านแล้ว รอไรเดอร์รับงาน
  ACCEPTED: 'accepted',                       // ไรเดอร์รับงาน กำลังมารับผ้า
  PICKED_UP: 'picked_up',                     // ไรเดอร์รับผ้าแล้ว กำลังนำส่งร้าน
  WASHING: 'washing',                         // ร้านกำลังดำเนินการซักอบ
  OUT_FOR_DELIVERY: 'out_for_delivery',       // ซักเสร็จแล้ว อยู่ระหว่างส่งคืนผ้า
  COMPLETED: 'completed',                     // ส่งคืนผ้าสำเร็จ
};

export const ORDER_STEPS = [
  { status: ORDER_STATUS.PAYMENT_VERIFICATION, label: 'ตรวจสอบยอดเงิน', icon: ShieldCheck },
  { status: ORDER_STATUS.PENDING, label: 'รอรับงาน', icon: Clock },
  { status: ORDER_STATUS.ACCEPTED, label: 'กำลังมารับ', icon: Bike },
  { status: ORDER_STATUS.PICKED_UP, label: 'รับผ้าแล้ว นำส่งร้าน', icon: PackageCheck },
  { status: ORDER_STATUS.WASHING, label: 'กำลังซักอบ', icon: Shirt },
  { status: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'อยู่ระหว่าง ส่งคืนผ้า', icon: Truck },
  { status: ORDER_STATUS.COMPLETED, label: 'ส่งคืนผ้าสำเร็จ', icon: CheckCircle2 },
];