export interface FiltrationItem {
  id: string;
  nameKey: string; // i18n key
  type: 'document' | 'form_section';
  descriptionKey: string; // i18n key
}

export const PHASE1_DOCUMENT_ITEMS: FiltrationItem[] = [
  { id: 'compro', nameKey: 'filtration.items.compro', type: 'document', descriptionKey: 'filtration.itemDesc.compro' },
  { id: 'statement_eoi', nameKey: 'filtration.items.statementEoi', type: 'document', descriptionKey: 'filtration.itemDesc.statementEoi' },
  { id: 'portfolio', nameKey: 'filtration.items.portfolio', type: 'document', descriptionKey: 'filtration.itemDesc.portfolio' },
  { id: 'financial_overview', nameKey: 'filtration.items.financialOverview', type: 'document', descriptionKey: 'filtration.itemDesc.financialOverview' },
  { id: 'requirements_fulfillment', nameKey: 'filtration.items.requirementsFulfillment', type: 'document', descriptionKey: 'filtration.itemDesc.requirementsFulfillment' },
];

export const PHASE1_FORM_SECTION_ITEMS: FiltrationItem[] = [
  { id: 'section_compro', nameKey: 'filtration.items.sectionCompro', type: 'form_section', descriptionKey: 'filtration.itemDesc.sectionCompro' },
  { id: 'section_statement_eoi', nameKey: 'filtration.items.sectionStatementEoi', type: 'form_section', descriptionKey: 'filtration.itemDesc.sectionStatementEoi' },
  { id: 'section_portfolio', nameKey: 'filtration.items.sectionPortfolio', type: 'form_section', descriptionKey: 'filtration.itemDesc.sectionPortfolio' },
  { id: 'section_financial', nameKey: 'filtration.items.sectionFinancial', type: 'form_section', descriptionKey: 'filtration.itemDesc.sectionFinancial' },
  { id: 'section_requirements', nameKey: 'filtration.items.sectionRequirements', type: 'form_section', descriptionKey: 'filtration.itemDesc.sectionRequirements' },
];

export const ALL_FILTRATION_ITEMS: FiltrationItem[] = [...PHASE1_DOCUMENT_ITEMS, ...PHASE1_FORM_SECTION_ITEMS];
