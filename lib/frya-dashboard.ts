import "server-only";

import {
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { companies } from "@/db/schema";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import {
  actionSchemas,
  appointments,
  businessProfiles,
  collections,
  documents,
  sales,
  tenants,
} from "@/src/db";
import type {
  ActionSchema,
  Appointment,
  BusinessProfile,
  Collection,
  Document,
  Sale,
  Tenant,
} from "@/src/db/types";

export interface DashboardWorkspace {
  company: typeof companies.$inferSelect;
  tenant: Tenant;
  businessProfile: BusinessProfile | null;
  actionSchemas: ActionSchema[];
}

export interface DashboardActivityItem {
  id: string;
  type: "sale" | "document" | "collection" | "appointment";
  title: string;
  description: string;
  createdAt: Date;
}

export interface DashboardSummaryData {
  salesMonthCount: number;
  salesMonthValue: number;
  pendingCollectionsCount: number;
  pendingCollectionsValue: number;
  nextAppointment: Appointment | null;
  documentsCount: number;
  salesLast30Days: Array<{
    date: string;
    label: string;
    value: number;
    count: number;
  }>;
  recentActivities: DashboardActivityItem[];
}

export interface SalesFilters {
  period?: string | null;
  from?: string | null;
  to?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

export interface DocumentsFilters {
  period?: string | null;
  from?: string | null;
  to?: string | null;
  type?: string | null;
}

export interface CollectionsFilters {
  period?: string | null;
  from?: string | null;
  to?: string | null;
  status?: string | null;
}

export interface AppointmentsFilters {
  month?: string | null;
}

export interface SalesPageData {
  rows: Sale[];
  totalCount: number;
  totalValue: number;
}

export interface DocumentsPageRow extends Document {
  linkedSale: Pick<Sale, "id" | "customerName" | "productOrService" | "totalValue"> | null;
}

export interface DocumentsPageData {
  rows: DocumentsPageRow[];
  totalCount: number;
}

export interface CollectionsPageData {
  rows: Collection[];
  pendingTotal: number;
  receivedThisMonth: number;
}

export interface AppointmentsPageData {
  selectedMonth: Date;
  rows: Appointment[];
  upcoming: Appointment[];
}

export interface SettingsPageData {
  tenant: Tenant;
  businessProfile: BusinessProfile | null;
  actionSchemas: ActionSchema[];
  whatsappStatus: {
    connected: boolean;
    instanceName: string | null;
    hasApiCredentials: boolean;
  };
}

export function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function resolveRange(period?: string | null, from?: string | null, to?: string | null) {
  const now = new Date();

  if (from || to) {
    return {
      start: from ? startOfDay(parseISO(from)) : null,
      end: to ? endOfDay(parseISO(to)) : null,
    };
  }

  switch (period) {
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "30d":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "90d":
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    default:
      return { start: null, end: null };
  }
}

function applyRange(
  column: Parameters<typeof gte>[0],
  period?: string | null,
  from?: string | null,
  to?: string | null,
) {
  const range = resolveRange(period, from, to);
  const clauses = [];

  if (range.start) {
    clauses.push(gte(column, range.start));
  }

  if (range.end) {
    clauses.push(lte(column, range.end));
  }

  return clauses;
}

export async function getDashboardWorkspaceByUserId(userId: string) {
  const company = (
    await db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .limit(1)
  )[0];

  if (!company || !company.onboardingCompleted) {
    return null;
  }

  const [tenantRows, businessProfileRows, tenantActionSchemas] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, company.id)).limit(1),
    db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.tenantId, company.id))
      .limit(1),
    db.select().from(actionSchemas).where(eq(actionSchemas.tenantId, company.id)),
  ]);

  if (!tenantRows[0]) {
    return null;
  }

  return {
    company,
    tenant: tenantRows[0],
    businessProfile: businessProfileRows[0] ?? null,
    actionSchemas: tenantActionSchemas,
  } satisfies DashboardWorkspace;
}

export async function getDashboardSummary(
  tenantId: string,
): Promise<DashboardSummaryData> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastThirtyDays = startOfDay(subDays(now, 29));

  const [
    monthSales,
    pendingCollections,
    nextAppointments,
    documentTotals,
    chartSales,
    recentSales,
    recentDocuments,
    recentCollections,
    recentAppointments,
  ] = await Promise.all([
    db
      .select({ id: sales.id, totalValue: sales.totalValue })
      .from(sales)
      .where(and(eq(sales.tenantId, tenantId), gte(sales.saleDate, monthStart))),
    db
      .select({ id: collections.id, amount: collections.amount })
      .from(collections)
      .where(
        and(
          eq(collections.tenantId, tenantId),
          inArray(collections.status, ["pending", "sent", "overdue"]),
        ),
      ),
    db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.status, "scheduled"),
          gte(appointments.scheduledAt, now),
        ),
      )
      .orderBy(appointments.scheduledAt)
      .limit(1),
    db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.tenantId, tenantId)),
    db
      .select({ saleDate: sales.saleDate, totalValue: sales.totalValue })
      .from(sales)
      .where(and(eq(sales.tenantId, tenantId), gte(sales.saleDate, lastThirtyDays)))
      .orderBy(sales.saleDate),
    db
      .select({
        id: sales.id,
        customerName: sales.customerName,
        productOrService: sales.productOrService,
        totalValue: sales.totalValue,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .where(eq(sales.tenantId, tenantId))
      .orderBy(desc(sales.createdAt))
      .limit(5),
    db
      .select({ id: documents.id, type: documents.type, createdAt: documents.createdAt })
      .from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(desc(documents.createdAt))
      .limit(5),
    db
      .select({
        id: collections.id,
        customerName: collections.customerName,
        amount: collections.amount,
        status: collections.status,
        createdAt: collections.createdAt,
      })
      .from(collections)
      .where(eq(collections.tenantId, tenantId))
      .orderBy(desc(collections.createdAt))
      .limit(5),
    db
      .select({
        id: appointments.id,
        title: appointments.title,
        customerName: appointments.customerName,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(eq(appointments.tenantId, tenantId))
      .orderBy(desc(appointments.createdAt))
      .limit(5),
  ]);

  const chartMap = new Map<
    string,
    { date: string; label: string; value: number; count: number }
  >();

  for (let index = 29; index >= 0; index -= 1) {
    const day = startOfDay(subDays(now, index));
    const key = format(day, "yyyy-MM-dd");
    chartMap.set(key, {
      date: key,
      label: format(day, "dd/MM"),
      value: 0,
      count: 0,
    });
  }

  for (const row of chartSales) {
    const key = format(startOfDay(row.saleDate), "yyyy-MM-dd");
    const bucket = chartMap.get(key);

    if (!bucket) {
      continue;
    }

    bucket.value += toNumber(row.totalValue);
    bucket.count += 1;
  }

  const recentActivities: DashboardActivityItem[] = [
    ...recentSales.map((row) => ({
      id: `sale:${row.id}`,
      type: "sale" as const,
      title: `Venda registrada para ${row.customerName}`,
      description: `${row.productOrService} • ${formatCurrency(row.totalValue)}`,
      createdAt: row.createdAt,
    })),
    ...recentDocuments.map((row) => ({
      id: `document:${row.id}`,
      type: "document" as const,
      title: "Documento armazenado",
      description: `Tipo ${row.type.toUpperCase()}`,
      createdAt: row.createdAt,
    })),
    ...recentCollections.map((row) => ({
      id: `collection:${row.id}`,
      type: "collection" as const,
      title: `Cobranca ${row.status}`,
      description: `${row.customerName} • ${formatCurrency(row.amount)}`,
      createdAt: row.createdAt,
    })),
    ...recentAppointments.map((row) => ({
      id: `appointment:${row.id}`,
      type: "appointment" as const,
      title: "Compromisso criado",
      description: `${row.title} • ${row.customerName}`,
      createdAt: row.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);

  return {
    salesMonthCount: monthSales.length,
    salesMonthValue: monthSales.reduce(
      (sum, row) => sum + toNumber(row.totalValue),
      0,
    ),
    pendingCollectionsCount: pendingCollections.length,
    pendingCollectionsValue: pendingCollections.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0,
    ),
    nextAppointment: nextAppointments[0] ?? null,
    documentsCount: documentTotals[0]?.count ?? 0,
    salesLast30Days: [...chartMap.values()],
    recentActivities,
  };
}

export async function getSalesPageData(
  tenantId: string,
  filters: SalesFilters,
): Promise<SalesPageData> {
  const clauses = [
    eq(sales.tenantId, tenantId),
    ...applyRange(sales.saleDate, filters.period, filters.from, filters.to),
  ];

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    clauses.push(eq(sales.paymentStatus, filters.paymentStatus as Sale["paymentStatus"]));
  }

  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    clauses.push(eq(sales.paymentMethod, filters.paymentMethod));
  }

  const rows = await db
    .select()
    .from(sales)
    .where(and(...clauses))
    .orderBy(desc(sales.saleDate));

  return {
    rows,
    totalCount: rows.length,
    totalValue: rows.reduce((sum, row) => sum + toNumber(row.totalValue), 0),
  };
}

export async function getDocumentsPageData(
  tenantId: string,
  filters: DocumentsFilters,
): Promise<DocumentsPageData> {
  const clauses = [
    eq(documents.tenantId, tenantId),
    ...applyRange(documents.createdAt, filters.period, filters.from, filters.to),
  ];

  if (filters.type && filters.type !== "all") {
    clauses.push(eq(documents.type, filters.type as Document["type"]));
  }

  const rows = await db
    .select()
    .from(documents)
    .where(and(...clauses))
    .orderBy(desc(documents.createdAt));

  const linkedSaleIds = rows
    .map((row) => row.linkedSaleId)
    .filter((value): value is string => Boolean(value));
  const linkedSales =
    linkedSaleIds.length > 0
      ? await db
          .select({
            id: sales.id,
            customerName: sales.customerName,
            productOrService: sales.productOrService,
            totalValue: sales.totalValue,
          })
          .from(sales)
          .where(and(eq(sales.tenantId, tenantId), inArray(sales.id, linkedSaleIds)))
      : [];
  const linkedSalesMap = new Map(linkedSales.map((row) => [row.id, row]));

  return {
    rows: rows.map((row) => ({
      ...row,
      linkedSale: row.linkedSaleId ? linkedSalesMap.get(row.linkedSaleId) ?? null : null,
    })),
    totalCount: rows.length,
  };
}

export async function getCollectionsPageData(
  tenantId: string,
  filters: CollectionsFilters,
): Promise<CollectionsPageData> {
  const clauses = [
    eq(collections.tenantId, tenantId),
    ...applyRange(collections.dueDate, filters.period, filters.from, filters.to),
  ];

  if (filters.status && filters.status !== "all") {
    clauses.push(eq(collections.status, filters.status as Collection["status"]));
  }

  const monthStart = startOfMonth(new Date());
  const [rows, receivedThisMonthRows] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(and(...clauses))
      .orderBy(desc(collections.dueDate)),
    db
      .select({ amount: collections.amount })
      .from(collections)
      .where(
        and(
          eq(collections.tenantId, tenantId),
          eq(collections.status, "paid"),
          gte(collections.createdAt, monthStart),
        ),
      ),
  ]);

  return {
    rows,
    pendingTotal: rows
      .filter((row) => row.status !== "paid")
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
    receivedThisMonth: receivedThisMonthRows.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0,
    ),
  };
}

export async function getAppointmentsPageData(
  tenantId: string,
  filters: AppointmentsFilters,
): Promise<AppointmentsPageData> {
  const selectedMonth =
    filters.month && /^\d{4}-\d{2}$/.test(filters.month)
      ? parseISO(`${filters.month}-01`)
      : new Date();
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const now = new Date();

  const [rows, upcoming] = await Promise.all([
    db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.scheduledAt, monthStart),
          lte(appointments.scheduledAt, endOfDay(monthEnd)),
        ),
      )
      .orderBy(appointments.scheduledAt),
    db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.status, "scheduled"),
          gte(appointments.scheduledAt, now),
        ),
      )
      .orderBy(appointments.scheduledAt)
      .limit(6),
  ]);

  return {
    selectedMonth,
    rows,
    upcoming,
  };
}

export async function getSettingsPageData(
  tenantId: string,
): Promise<SettingsPageData> {
  const [tenantRows, businessProfileRows, tenantActionSchemas] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),
    db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.tenantId, tenantId))
      .limit(1),
    db
      .select()
      .from(actionSchemas)
      .where(eq(actionSchemas.tenantId, tenantId))
      .orderBy(actionSchemas.actionType),
  ]);

  if (!tenantRows[0]) {
    throw new Error("Tenant nao encontrado.");
  }

  return {
    tenant: tenantRows[0],
    businessProfile: businessProfileRows[0] ?? null,
    actionSchemas: tenantActionSchemas,
    whatsappStatus: {
      connected: Boolean(
        process.env.EVOLUTION_API_URL &&
          process.env.EVOLUTION_API_KEY &&
          process.env.EVOLUTION_INSTANCE,
      ),
      instanceName: process.env.EVOLUTION_INSTANCE ?? null,
      hasApiCredentials: Boolean(
        process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY,
      ),
    },
  };
}
