export interface KEP100Threshold {
  min: number;
  max: number;
  score: number;
}

export interface KEP100IndicatorDef {
  id: string;
  name: string;
  formula: string;
  weight: number;
  unit: string;
  thresholds: KEP100Threshold[];
}

/**
 * 8 Indikator KEP-100 (Keputusan Menteri BUMN No. KEP-100/MBU/2002)
 * untuk penilaian tingkat kesehatan keuangan BUMN.
 */
export const KEP100_INDICATORS: KEP100IndicatorDef[] = [
  {
    id: 'roe',
    name: 'Return on Equity (ROE)',
    formula: 'Laba Setelah Pajak / Ekuitas x 100%',
    weight: 20,
    unit: '%',
    thresholds: [
      { min: 15, max: Infinity, score: 20 },
      { min: 13, max: 15, score: 18 },
      { min: 11, max: 13, score: 16 },
      { min: 9, max: 11, score: 14 },
      { min: 7.9, max: 9, score: 12 },
      { min: 6.6, max: 7.9, score: 10 },
      { min: 5.3, max: 6.6, score: 8.5 },
      { min: 4, max: 5.3, score: 7 },
      { min: 2.5, max: 4, score: 5.5 },
      { min: 1, max: 2.5, score: 4 },
      { min: 0, max: 1, score: 2 },
      { min: -Infinity, max: 0, score: 0 },
    ],
  },
  {
    id: 'roa',
    name: 'Return on Assets (ROA)',
    formula: 'EBIT / Total Aset x 100%',
    weight: 15,
    unit: '%',
    thresholds: [
      { min: 18, max: Infinity, score: 15 },
      { min: 15, max: 18, score: 13.5 },
      { min: 13, max: 15, score: 12 },
      { min: 12, max: 13, score: 10.5 },
      { min: 10.5, max: 12, score: 9 },
      { min: 9, max: 10.5, score: 7.5 },
      { min: 7, max: 9, score: 6 },
      { min: 5, max: 7, score: 5 },
      { min: 3, max: 5, score: 4 },
      { min: 1, max: 3, score: 3 },
      { min: 0, max: 1, score: 2 },
      { min: -Infinity, max: 0, score: 1 },
    ],
  },
  {
    id: 'cash_ratio',
    name: 'Cash Ratio',
    formula: '(Kas + Setara Kas) / Kewajiban Lancar x 100%',
    weight: 5,
    unit: '%',
    thresholds: [
      { min: 35, max: Infinity, score: 5 },
      { min: 25, max: 35, score: 4 },
      { min: 15, max: 25, score: 3 },
      { min: 10, max: 15, score: 2 },
      { min: 5, max: 10, score: 1 },
      { min: -Infinity, max: 5, score: 0 },
    ],
  },
  {
    id: 'current_ratio',
    name: 'Current Ratio',
    formula: 'Aset Lancar / Kewajiban Lancar x 100%',
    weight: 5,
    unit: '%',
    thresholds: [
      { min: 125, max: Infinity, score: 5 },
      { min: 110, max: 125, score: 4 },
      { min: 100, max: 110, score: 3 },
      { min: 95, max: 100, score: 2 },
      { min: 90, max: 95, score: 1 },
      { min: -Infinity, max: 90, score: 0 },
    ],
  },
  {
    id: 'collection_period',
    name: 'Collection Period',
    formula: 'Piutang Usaha / Pendapatan x 365 hari',
    weight: 5,
    unit: 'hari',
    thresholds: [
      { min: -Infinity, max: 60, score: 5 },
      { min: 60, max: 90, score: 4.5 },
      { min: 90, max: 120, score: 4 },
      { min: 120, max: 150, score: 3.5 },
      { min: 150, max: 180, score: 3 },
      { min: 180, max: 210, score: 2.4 },
      { min: 210, max: 240, score: 1.8 },
      { min: 240, max: 270, score: 1.2 },
      { min: 270, max: 300, score: 0.6 },
      { min: 300, max: Infinity, score: 0 },
    ],
  },
  {
    id: 'inventory_turnover',
    name: 'Inventory Turnover',
    formula: 'Persediaan / Pendapatan x 365 hari',
    weight: 5,
    unit: 'hari',
    thresholds: [
      { min: -Infinity, max: 60, score: 5 },
      { min: 60, max: 90, score: 4.5 },
      { min: 90, max: 120, score: 4 },
      { min: 120, max: 150, score: 3.5 },
      { min: 150, max: 180, score: 3 },
      { min: 180, max: 210, score: 2.4 },
      { min: 210, max: 240, score: 1.8 },
      { min: 240, max: 270, score: 1.2 },
      { min: 270, max: 300, score: 0.6 },
      { min: 300, max: Infinity, score: 0 },
    ],
  },
  {
    id: 'total_asset_turnover',
    name: 'Total Asset Turnover (TATO)',
    formula: 'Pendapatan / Total Aset x 100%',
    weight: 5,
    unit: '%',
    thresholds: [
      { min: 120, max: Infinity, score: 5 },
      { min: 105, max: 120, score: 4.5 },
      { min: 90, max: 105, score: 4 },
      { min: 75, max: 90, score: 3.5 },
      { min: 60, max: 75, score: 3 },
      { min: 40, max: 60, score: 2.5 },
      { min: 20, max: 40, score: 2 },
      { min: -Infinity, max: 20, score: 1.5 },
    ],
  },
  {
    id: 'equity_to_total_asset',
    name: 'Rasio Modal Sendiri terhadap Total Aset',
    formula: 'Ekuitas / Total Aset x 100%',
    weight: 10,
    unit: '%',
    thresholds: [
      { min: 50, max: Infinity, score: 10 },
      { min: 40, max: 50, score: 9 },
      { min: 30, max: 40, score: 8 },
      { min: 20, max: 30, score: 7 },
      { min: 10, max: 20, score: 6 },
      { min: 0, max: 10, score: 5 },
      { min: -Infinity, max: 0, score: 0 },
    ],
  },
];

/**
 * Total bobot semua indikator KEP-100 = 70 (dari total 100 termasuk aspek operasional)
 */
export const KEP100_TOTAL_WEIGHT = KEP100_INDICATORS.reduce(
  (sum, indicator) => sum + indicator.weight,
  0
);
