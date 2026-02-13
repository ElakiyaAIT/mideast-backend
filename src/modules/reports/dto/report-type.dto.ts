// reports/dto/report.types.ts

export interface ReportPeriod {
  start: Date;
  end: Date;
}

/* ---------- SALES REPORT ---------- */

export interface SalesCategoryGroup {
  category: string;
  sales: number;
  orders: number;
}

export interface SalesReport {
  period: ReportPeriod;
  totalSales: number;
  totalOrders: number;
  byCategory: SalesCategoryGroup[];
}

/* ---------- AUCTION REPORT ---------- */

export interface AuctionSummary {
  title: string;
  totalLots: number;
  soldLots: number;
  revenue: number;
}

export interface AuctionReport {
  period: ReportPeriod;
  totalAuctions: number;
  totalRevenue: number;
  auctions: AuctionSummary[];
}

/* ---------- USER ACTIVITY REPORT ---------- */

export interface UserActivityReport {
  period: ReportPeriod;
  newRegistrations: number;
}
