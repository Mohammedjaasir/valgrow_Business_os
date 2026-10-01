import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { SalesReportQueryDto, InventoryMovementReportQueryDto } from "./dto/report-query.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  }

  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "";
    return new Date(date).toISOString().replace("T", " ").substring(0, 19);
  }

  // ============================================================================
  // 1. SALES REPORT EXPORT (CSV / XLSX)
  // ============================================================================
  async exportSalesReport(
    organizationId: string,
    query: SalesReportQueryDto,
    format: "csv" | "xlsx",
    res: Response,
  ) {
    // Database-level filtering for POS Sales
    const posWhere: Prisma.POSSaleWhereInput = {
      organizationId,
      status: "COMPLETED",
    };

    if (query.branchId && query.branchId !== "ALL") {
      posWhere.branchId = query.branchId;
    }
    if (query.customerId && query.customerId !== "ALL") {
      posWhere.customerId = query.customerId;
    }
    if (query.dateFrom || query.dateTo) {
      posWhere.createdAt = {};
      if (query.dateFrom) posWhere.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        posWhere.createdAt.lte = endDate;
      }
    }
    if (query.search) {
      const term = query.search.trim();
      posWhere.OR = [
        { receiptNumber: { contains: term, mode: "insensitive" } },
        { customer: { name: { contains: term, mode: "insensitive" } } },
      ];
    }

    const posSales = await this.prisma.pOSSale.findMany({
      where: posWhere,
      select: {
        id: true,
        receiptNumber: true,
        createdAt: true,
        subtotalAmount: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        customer: { select: { customerCode: true, name: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        payments: { select: { paymentMethod: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Database-level filtering for Direct B2B Invoices
    const invWhere: Prisma.SalesInvoiceWhereInput = {
      organizationId,
      status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
      posSales: { none: {} },
    };

    if (query.customerId && query.customerId !== "ALL") {
      invWhere.customerId = query.customerId;
    }
    if (query.dateFrom || query.dateTo) {
      invWhere.invoiceDate = {};
      if (query.dateFrom) invWhere.invoiceDate.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        invWhere.invoiceDate.lte = endDate;
      }
    }

    const b2bInvoices = await this.prisma.salesInvoice.findMany({
      where: invWhere,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        subtotalAmount: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        customer: { select: { customerCode: true, name: true } },
        customerPayments: { select: { paymentMethod: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    // Build Rows
    const rows = [
      ...posSales.map((s) => ({
        number: s.receiptNumber,
        type: "POS Sale",
        date: this.formatDateTime(s.createdAt),
        customerCode: s.customer?.customerCode || "-",
        customerName: s.customer?.name || "Walk-in Retail Customer",
        branch: s.branch?.name || "-",
        warehouse: s.warehouse?.name || "-",
        subtotal: Number(s.subtotalAmount),
        tax: Number(s.taxAmount),
        discount: Number(s.discountAmount),
        total: Number(s.totalAmount),
        paid: Number(s.paidAmount),
        paymentMethods: s.payments.map((p) => p.paymentMethod).join(", ") || "CASH",
        status: s.status,
      })),
      ...b2bInvoices.map((inv) => ({
        number: inv.invoiceNumber,
        type: "Invoice",
        date: this.formatDateTime(inv.invoiceDate),
        customerCode: inv.customer?.customerCode || "-",
        customerName: inv.customer?.name || "Direct Customer",
        branch: "Direct Sales",
        warehouse: "Main Warehouse",
        subtotal: Number(inv.subtotalAmount),
        tax: Number(inv.taxAmount),
        discount: Number(inv.discountAmount),
        total: Number(inv.totalAmount),
        paid: Number(inv.paidAmount),
        paymentMethods: inv.customerPayments.map((p) => p.paymentMethod).join(", ") || "ACCOUNT",
        status: inv.status,
      })),
    ];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Receipt / Invoice #", key: "number", width: 22 },
      { header: "Type", key: "type", width: 14 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer Code", key: "customerCode", width: 16 },
      { header: "Customer Name", key: "customerName", width: 26 },
      { header: "Branch", key: "branch", width: 18 },
      { header: "Warehouse", key: "warehouse", width: 18 },
      { header: "Subtotal", key: "subtotal", width: 14 },
      { header: "Tax", key: "tax", width: 12 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "Total", key: "total", width: 14 },
      { header: "Paid Amount", key: "paid", width: 14 },
      { header: "Payment Methods", key: "paymentMethods", width: 20 },
      { header: "Status", key: "status", width: 14 },
    ];

    sheet.addRows(rows);

    const todayStr = this.formatDate(new Date());
    if (format === "xlsx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="sales-report-${todayStr}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="sales-report-${todayStr}.csv"`);
      await workbook.csv.write(res);
      res.end();
    }
  }

  // ============================================================================
  // 2. INVENTORY MOVEMENT REPORT EXPORT (CSV / XLSX)
  // ============================================================================
  async exportInventoryMovementReport(
    organizationId: string,
    query: InventoryMovementReportQueryDto,
    format: "csv" | "xlsx",
    res: Response,
  ) {
    const where: Prisma.StockMovementWhereInput = {
      organizationId,
    };

    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.movementType) where.movementType = query.movementType as any;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        movementType: true,
        quantity: true,
        unitCost: true,
        totalCost: true,
        referenceType: true,
        referenceId: true,
        notes: true,
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        location: { select: { name: true } },
        actor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = movements.map((m) => ({
      dateTime: this.formatDateTime(m.createdAt),
      productName: m.product?.name || "-",
      sku: m.product?.sku || "-",
      movementType: m.movementType,
      quantity: Number(m.quantity),
      unitCost: Number(m.unitCost),
      totalCost: Number(m.totalCost),
      warehouse: m.warehouse?.name || "-",
      location: m.location?.name || "-",
      referenceType: m.referenceType || "-",
      referenceId: m.referenceId || "-",
      performedBy: m.actor ? `${m.actor.firstName} ${m.actor.lastName}` : "System",
      notes: m.notes || "-",
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory Movements");

    sheet.columns = [
      { header: "Date & Time", key: "dateTime", width: 20 },
      { header: "Product Name", key: "productName", width: 26 },
      { header: "SKU", key: "sku", width: 16 },
      { header: "Movement Type", key: "movementType", width: 22 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Unit Cost", key: "unitCost", width: 14 },
      { header: "Total Cost", key: "totalCost", width: 14 },
      { header: "Warehouse", key: "warehouse", width: 18 },
      { header: "Location", key: "location", width: 18 },
      { header: "Ref Type", key: "referenceType", width: 16 },
      { header: "Ref ID / Number", key: "referenceId", width: 22 },
      { header: "Performed By", key: "performedBy", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    sheet.addRows(rows);

    const todayStr = this.formatDate(new Date());
    if (format === "xlsx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="inventory-movements-${todayStr}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="inventory-movements-${todayStr}.csv"`);
      await workbook.csv.write(res);
      res.end();
    }
  }
}
