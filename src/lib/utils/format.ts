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
