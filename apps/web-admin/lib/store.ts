"use client";

import { RideRecord, Invoice, InvoiceSettings, DEFAULT_INVOICE_SETTINGS, Driver, AttendanceMonth, AttendanceStatus } from "./types";

const STORAGE_KEY = "ride_admin_records";
const CUSTOMER_KEY = "ride_admin_customers";
const CUSTOMER_SEQ_KEY = "ride_admin_customer_seq";

export function getRecords(): RideRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecord(record: RideRecord): void {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function updateRecord(id: string, data: Partial<RideRecord>): void {
  const records = getRecords().map((r) => r.id === id ? { ...r, ...data } : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Customer store ───────────────────────────────────────────────
import { Customer, CustomerListItem } from "./types";

function nextCustomerNo(): number {
  const seq = parseInt(localStorage.getItem(CUSTOMER_SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(CUSTOMER_SEQ_KEY, String(seq));
  return seq;
}

/** 빈 목록일 때 자동 등록할 기본 고객 (데모용) */
function getDefaultCustomers(): Customer[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: "demo-1", no: 1, registeredAt: today, dmSend: false, smsSend: true, category: "일반회원", name: "홍길동", info: "", memberNo: "", address: "서울시 강남구", addressDetail: "", phone: "02-1234-5678", mobile: "010-1234-5678", otherPhone: "", notes: "", referrerId: "" },
    { id: "demo-2", no: 2, registeredAt: today, dmSend: false, smsSend: false, category: "지인", name: "김철수", info: "", memberNo: "", address: "경기도 성남시", addressDetail: "", phone: "", mobile: "010-9876-5432", otherPhone: "", notes: "", referrerId: "" },
  ];
}

export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    let arr: Customer[] = raw ? JSON.parse(raw) : [];
    // 빈 목록이면 기본 고객 자동 등록
    if (arr.length === 0) {
      arr = getDefaultCustomers();
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(arr));
      const seq = Math.max(...arr.map((c) => c.no), 0);
      localStorage.setItem(CUSTOMER_SEQ_KEY, String(seq));
    }
    return arr;
  } catch { return []; }
}

export function saveCustomer(c: Omit<Customer, "id" | "no">): Customer {
  const customers = getCustomers();
  const newC: Customer = { ...c, id: generateId(), no: nextCustomerNo() };
  customers.push(newC);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
  return newC;
}

export function updateCustomer(id: string, data: Partial<Customer>): void {
  const customers = getCustomers().map((c) => c.id === id ? { ...c, ...data } : c);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
}

export function getCustomerRides(customerId: string) {
  return getRecords().filter((r) => (r as any).customerId === customerId);
}

/** localStorage Customer를 CustomerListItem 형태로 변환 */
export function getCustomersAsListItems(): CustomerListItem[] {
  const cs = getCustomers();
  return cs.map((c) => ({
    id: c.id,
    source: "customer" as const,
    no: c.no,
    registeredAt: c.registeredAt,
    category: c.category,
    name: c.name,
    phone: c.phone,
    mobile: c.mobile,
    otherPhone: c.otherPhone,
    address: c.address,
    addressDetail: c.addressDetail,
    info: c.info,
    dmSend: c.dmSend,
    smsSend: c.smsSend,
    referrerId: c.referrerId,
    memberNo: c.memberNo,
    notes: c.notes,
  }));
}

/** API 목록 + localStorage 전용 고객(API에 없는) 병합 */
export function mergeApiWithLocalCustomers(
  apiList: CustomerListItem[] | null,
  localListItems: CustomerListItem[]
): CustomerListItem[] {
  if (!apiList) return localListItems;
  const apiIds = new Set(apiList.map((c) => c.id));
  const localOnly = localListItems.filter((c) => !apiIds.has(c.id));
  return [...apiList, ...localOnly];
}

// ─── Driver store ─────────────────────────────────────────────────
const DRIVER_KEY = "ride_admin_drivers";
const DRIVER_SEQ_KEY = "ride_admin_driver_seq";

function nextDriverNo(): number {
  const seq = parseInt(localStorage.getItem(DRIVER_SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(DRIVER_SEQ_KEY, String(seq));
  return seq;
}

export function getDrivers(): Driver[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DRIVER_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveDriver(d: Omit<Driver, "id" | "no">): Driver {
  const list = getDrivers();
  const newD: Driver = { ...d, id: generateId(), no: nextDriverNo() };
  list.push(newD);
  localStorage.setItem(DRIVER_KEY, JSON.stringify(list));
  return newD;
}

export function updateDriver(id: string, data: Partial<Driver>): void {
  const list = getDrivers().map((d) => d.id === id ? { ...d, ...data } : d);
  localStorage.setItem(DRIVER_KEY, JSON.stringify(list));
}

export function deleteDriver(id: string): void {
  const list = getDrivers().filter((d) => d.id !== id);
  localStorage.setItem(DRIVER_KEY, JSON.stringify(list));
}

export function getDriverRides(driverName: string) {
  return getRecords().filter((r) => r.driverName === driverName);
}

// ─── Invoice store ────────────────────────────────────────────────
const INVOICE_KEY = "ride_admin_invoices";
const INVOICE_SETTINGS_KEY = "ride_admin_invoice_settings";
const INVOICE_SEQ_KEY = "ride_admin_invoice_seq";

function nextInvoiceSeq(): number {
  const seq = parseInt(localStorage.getItem(INVOICE_SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(INVOICE_SEQ_KEY, String(seq));
  return seq;
}

export function generateDocNo(): string {
  const seq = nextInvoiceSeq();
  return String(seq).padStart(6, "0");
}

export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INVOICE_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveInvoice(inv: Omit<Invoice, "id" | "docNo">): Invoice {
  const list = getInvoices();
  const newInv: Invoice = { ...inv, id: generateId(), docNo: generateDocNo() };
  list.push(newInv);
  localStorage.setItem(INVOICE_KEY, JSON.stringify(list));
  return newInv;
}

export function updateInvoice(id: string, data: Partial<Invoice>): void {
  const list = getInvoices().map((inv) => inv.id === id ? { ...inv, ...data } : inv);
  localStorage.setItem(INVOICE_KEY, JSON.stringify(list));
}

export function deleteInvoice(id: string): void {
  const list = getInvoices().filter((inv) => inv.id !== id);
  localStorage.setItem(INVOICE_KEY, JSON.stringify(list));
}

export function getInvoiceSettings(): InvoiceSettings {
  if (typeof window === "undefined") return DEFAULT_INVOICE_SETTINGS;
  try { return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(localStorage.getItem(INVOICE_SETTINGS_KEY) ?? "{}") }; }
  catch { return DEFAULT_INVOICE_SETTINGS; }
}

export function saveInvoiceSettings(s: InvoiceSettings): void {
  localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(s));
}

// ─── Attendance store ─────────────────────────────────────────────
const ATTENDANCE_KEY = "ride_admin_attendance";

export function getAttendanceList(): AttendanceMonth[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) ?? "[]"); }
  catch { return []; }
}

export function getAttendanceMonth(driverId: string, year: number, month: number): AttendanceMonth | null {
  return getAttendanceList().find((a) => a.driverId === driverId && a.year === year && a.month === month) ?? null;
}

export function upsertAttendance(driverId: string, driverName: string, year: number, month: number, day: number, status: AttendanceStatus): void {
  const list = getAttendanceList();
  const idx = list.findIndex((a) => a.driverId === driverId && a.year === year && a.month === month);
  if (idx >= 0) {
    list[idx].entries[day] = status;
  } else {
    list.push({ id: generateId(), driverId, driverName, year, month, entries: { [day]: status } });
  }
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
}

export function clearAttendanceMonth(driverId: string, year: number, month: number): void {
  const list = getAttendanceList().filter(
    (a) => !(a.driverId === driverId && a.year === year && a.month === month)
  );
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
}
