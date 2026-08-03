/**
 * Format angka ke format mata uang Rupiah Indonesia
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return `Rp ${formatted}`;
}

/**
 * Format tanggal ke format "DD MMM YYYY" dalam Bahasa Indonesia
 * Contoh: "2024-01-15" -> "15 Jan 2024"
 */
export function formatDate(date: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  const d = new Date(date);
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format angka ke format persen Indonesia
 * Contoh: 85.5 -> "85,5%"
 */
export function formatPercent(value: number): string {
  const formatted = value.toFixed(1).replace('.', ',');
  return `${formatted}%`;
}

/**
 * Format jam HH:mm untuk bubble chat WhatsApp-style
 * Contoh: "2026-04-08T17:06:00" -> "17:06"
 */
export function formatChatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format label pemisah hari untuk chat WhatsApp-style
 * - Hari ini -> "Hari ini"
 * - Kemarin -> "Kemarin"
 * - 2-6 hari lalu -> nama hari (Rabu, Jumat)
 * - > 7 hari -> "18 April"
 * - Tahun berbeda -> "18 April 2025"
 */
export function formatChatDaySeparator(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  if (diffDays > 1 && diffDays < 7) return dayNames[d.getDay()];

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNum = d.getDate();
  const monthName = months[d.getMonth()];
  if (d.getFullYear() !== now.getFullYear()) {
    return `${dayNum} ${monthName} ${d.getFullYear()}`;
  }
  return `${dayNum} ${monthName}`;
}

/** String datetime tanpa offset timezone (hasil input datetime-local) dianggap WIB */
const HAS_TZ_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

function asWibDate(value: string | Date): Date {
  if (typeof value !== 'string') return value;
  return new Date(HAS_TZ_OFFSET.test(value) ? value : `${value}:00+07:00`);
}

/**
 * Konversi timestamp (ISO/offset apapun) ke nilai input datetime-local
 * dalam wall-clock WIB, independen dari timezone browser.
 * Contoh: "2026-08-03T05:00:00.000Z" -> "2026-08-03T12:00"
 */
export function toWibInputValue(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(asWibDate(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/**
 * Format timestamp ke teks lengkap WIB 24 jam.
 * Contoh: "2026-08-03T12:00" -> "Senin, 3 Agustus 2026 pukul 12.00 WIB"
 */
export function formatWibDateTime(value: string | Date): string {
  const d = asWibDate(value);
  if (isNaN(d.getTime())) return '';
  const text = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
  return `${text} WIB`;
}

/**
 * Check if two dates are on the same calendar day
 */
export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
