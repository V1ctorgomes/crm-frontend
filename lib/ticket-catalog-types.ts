export type TicketCatalogCategory = 'MARCA' | 'MODELO' | 'CUSTOMER_TYPE' | 'TICKET_TYPE';

export type TicketCatalogOptions = Record<TicketCatalogCategory, string[]>;

export const TICKET_CATALOG_ORDER: TicketCatalogCategory[] = ['MARCA', 'MODELO', 'CUSTOMER_TYPE', 'TICKET_TYPE'];

export const CATALOG_CATEGORY_LABELS: Record<TicketCatalogCategory, string> = {
  MARCA: 'Marca',
  MODELO: 'Modelo',
  CUSTOMER_TYPE: 'Tipo de cliente',
  TICKET_TYPE: 'Tipo de solicitação',
};
