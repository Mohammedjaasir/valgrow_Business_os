import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SalesReportQueryDto,
  CustomerReportQueryDto,
  InventoryMovementReportQueryDto,
} from "./dto/report-query.dto";
import { Prisma, StockMovementType } from "@prisma/client";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. SALES REPORT
   * Reads persisted POSSale and SalesInvoice records as source of truth for completed transactions.
   */
  async getSalesReport(organizationId: string, query: SalesReportQueryDto) {
    const where: Prisma.POSSaleWhereInput = {
      organizationId,
      status: "COMPLETED",
    };

    if (query.branchId && query.branchId !== "ALL") {
      where.branchId = query.branchId;
    }
    if (query.customerId && query.customerId !== "ALL") {
      where.customerId = query.customerId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { receiptNumber: { contains: term, mode: "insensitive" } },
        { customer: { name: { contains: term, mode: "insensitive" } } },
        { cashier: { firstName: { contains: term, mode: "insensitive" } } },
        { cashier: { lastName: { contains: term, mode: "insensitive" } } },
      ];
    }

    const posSales = await this.prisma.pOSSale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        cashier: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        payments: true,
        salesOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch SalesInvoices that are not POS sales (B2B / Wholesale Direct Invoices)
    const invWhere: Prisma.SalesInvoiceWhereInput = {
      organizationId,
      status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
      posSales: { none: {} }, // Exclude invoices created by POS to prevent double-counting
    };

    if (query.customerId && query.customerId !== "ALL") {
      invWhere.customerId = query.customerId;
    }
    if (query.dateFrom || query.dateTo) {
      invWhere.invoiceDate = {};
      if (query.dateFrom) {
        invWhere.invoiceDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        invWhere.invoiceDate.lte = endDate;
      }
    }

    const b2bInvoices = await this.prisma.salesInvoice.findMany({
      where: invWhere,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        customerPayments: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    // Filter by payment method if specified
    let filteredPosSales = posSales;
    if (query.paymentMethod && query.paymentMethod !== ("ALL" as any)) {
      filteredPosSales = posSales.filter((s: any) =>
        s.payments.some((p: any) => p.paymentMethod === query.paymentMethod),
      );
    }

    // Combine & calculate summary
    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let orderCount = filteredPosSales.length + b2bInvoices.length;

    const customerMap = new Map<
      string,
      { customerId: string; customerName: string; totalSales: number; orderCount: number }
    >();
    const productMap = new Map<
      string,
      { productId: string; productName: string; quantitySold: number; totalSales: number }
    >();
    const paymentMethodMap = new Map<string, { paymentMethod: string; totalAmount: number; count: number }>();
    const branchMap = new Map<string, { branchId: string; branchName: string; totalSales: number; orderCount: number }>();
    const dateMap = new Map<string, { date: string; totalSales: number; orderCount: number }>();

    // Process POS Sales
    for (const sale of filteredPosSales) {
      const saleAmt = Number(sale.totalAmount);
      const taxAmt = Number(sale.taxAmount);
      const discAmt = Number(sale.discountAmount);
      const paidAmt = Number(sale.paidAmount);

      totalSales += saleAmt;
      totalTax += taxAmt;
      totalDiscount += discAmt;
      totalPaid += paidAmt;

      // Customer breakdown
      const cId = sale.customerId || "WALKIN";
      const cName = sale.customer?.name || "Walk-in Retail Customer";
      const cEntry = customerMap.get(cId) || { customerId: cId, customerName: cName, totalSales: 0, orderCount: 0 };
      cEntry.totalSales += saleAmt;
      cEntry.orderCount += 1;
      customerMap.set(cId, cEntry);

      // Branch breakdown
      const bId = sale.branchId;
      const bName = sale.branch?.name || "Main Branch";
      const bEntry = branchMap.get(bId) || { branchId: bId, branchName: bName, totalSales: 0, orderCount: 0 };
      bEntry.totalSales += saleAmt;
      bEntry.orderCount += 1;
      branchMap.set(bId, bEntry);

      // Date breakdown
      const dStr = new Date(sale.createdAt).toISOString().split("T")[0];
      const dEntry = dateMap.get(dStr) || { date: dStr, totalSales: 0, orderCount: 0 };
      dEntry.totalSales += saleAmt;
      dEntry.orderCount += 1;
      dateMap.set(dStr, dEntry);

      // Payment method breakdown
      for (const p of sale.payments) {
        const pm = p.paymentMethod;
        const pAmt = Number(p.amount);
        const pmEntry = paymentMethodMap.get(pm) || { paymentMethod: pm, totalAmount: 0, count: 0 };
        pmEntry.totalAmount += pAmt;
        pmEntry.count += 1;
        paymentMethodMap.set(pm, pmEntry);
      }

      // Product breakdown
      if (sale.salesOrder?.items) {
        for (const item of sale.salesOrder.items) {
          const pId = item.productId;
          const pName = item.product?.name || "Product";
          const qSold = Number(item.deliveredQty || item.orderedQty);
          const itemTotal = Number(item.totalAmount);
          const prodEntry = productMap.get(pId) || { productId: pId, productName: pName, quantitySold: 0, totalSales: 0 };
          prodEntry.quantitySold += qSold;
          prodEntry.totalSales += itemTotal;
          productMap.set(pId, prodEntry);
        }
      }
    }

    // Process B2B Invoices
    for (const inv of b2bInvoices) {
      const invAmt = Number(inv.totalAmount);
      const taxAmt = Number(inv.taxAmount);
      const discAmt = Number(inv.discountAmount);
      const paidAmt = Number(inv.paidAmount);

      totalSales += invAmt;
      totalTax += taxAmt;
      totalDiscount += discAmt;
      totalPaid += paidAmt;

      const cId = inv.customerId;
      const cName = inv.customer?.name || "Direct Customer";
      const cEntry = customerMap.get(cId) || { customerId: cId, customerName: cName, totalSales: 0, orderCount: 0 };
      cEntry.totalSales += invAmt;
      cEntry.orderCount += 1;
      customerMap.set(cId, cEntry);

      const dStr = new Date(inv.invoiceDate).toISOString().split("T")[0];
      const dEntry = dateMap.get(dStr) || { date: dStr, totalSales: 0, orderCount: 0 };
      dEntry.totalSales += invAmt;
      dEntry.orderCount += 1;
      dateMap.set(dStr, dEntry);

      if (inv.items) {
        for (const item of inv.items) {
          const pId = item.productId;
          const pName = item.product?.name || "Product";
          const qSold = Number(item.quantity);
          const itemTotal = Number(item.totalAmount);
          const prodEntry = productMap.get(pId) || { productId: pId, productName: pName, quantitySold: 0, totalSales: 0 };
          prodEntry.quantitySold += qSold;
          prodEntry.totalSales += itemTotal;
          productMap.set(pId, prodEntry);
        }
      }
    }

    // Standardized Records List
    const records = [
      ...filteredPosSales.map((s: any) => ({
        id: s.id,
        type: "POS_SALE",
        number: s.receiptNumber,
        date: s.createdAt,
        customerId: s.customerId,
        customerName: s.customer?.name || "Walk-in Retail Customer",
        branchName: s.branch?.name || "Default Branch",
        warehouseName: s.warehouse?.name || "Default Warehouse",
        subtotal: Number(s.subtotalAmount),
        tax: Number(s.taxAmount),
        discount: Number(s.discountAmount),
        total: Number(s.totalAmount),
        paid: Number(s.paidAmount),
        status: s.status,
        paymentMethods: s.payments.map((p: any) => p.paymentMethod).join(", "),
      })),
      ...b2bInvoices.map((inv: any) => ({
        id: inv.id,
        type: "INVOICE",
        number: inv.invoiceNumber,
        date: inv.invoiceDate,
        customerId: inv.customerId,
        customerName: inv.customer?.name || "Direct Customer",
        branchName: "Direct Sales",
        warehouseName: "Main Warehouse",
        subtotal: Number(inv.subtotalAmount),
        tax: Number(inv.taxAmount),
        discount: Number(inv.discountAmount),
        total: Number(inv.totalAmount),
        paid: Number(inv.paidAmount),
        status: inv.status,
        paymentMethods: inv.customerPayments.map((p: any) => p.paymentMethod).join(", ") || "ACCOUNT",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      summary: {
        totalSales,
        orderCount,
        totalTax,
        totalDiscount,
        totalPaid,
        outstandingAmount: Math.max(0, totalSales - totalPaid),
      },
      breakdowns: {
        salesByCustomer: Array.from(customerMap.values()).sort((a, b) => b.totalSales - a.totalSales),
        salesByProduct: Array.from(productMap.values()).sort((a, b) => b.totalSales - a.totalSales),
        salesByPaymentMethod: Array.from(paymentMethodMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
        salesByBranch: Array.from(branchMap.values()).sort((a, b) => b.totalSales - a.totalSales),
        salesByDate: Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      },
      records,
    };
  }

  /**
   * 2. CUSTOMER REPORT
   * Calculates factual customer order history, total purchases, payments, and outstanding balances.
   */
  async getCustomerReport(organizationId: string, query: CustomerReportQueryDto) {
    const custWhere: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (query.customerId && query.customerId !== "ALL") {
      custWhere.id = query.customerId;
    }
    if (query.search) {
      const term = query.search.trim();
      custWhere.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { customerCode: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where: custWhere,
      include: {
        posSales: {
          where: { status: "COMPLETED" },
          select: { id: true, totalAmount: true, paidAmount: true, createdAt: true },
        },
        salesInvoices: {
          where: {
            status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
            posSales: { none: {} },
          },
          select: { id: true, totalAmount: true, paidAmount: true, invoiceDate: true },
        },
        customerPayments: {
          where: {
            OR: [
              { salesInvoiceId: null },
              { invoice: { posSales: { none: {} } } },
            ],
          },
          select: { id: true, amount: true, paymentDate: true },
        },
      },
      orderBy: { name: "asc" },
    });

    let totalCustomers = customers.length;
    let totalOrdersAll = 0;
    let totalPurchasesAll = 0;
    let totalPaidAll = 0;
    let totalOutstandingAll = 0;

    const reportItems = customers.map((c: any) => {
      const posCount = c.posSales.length;
      const invCount = c.salesInvoices.length;
      const totalOrders = posCount + invCount;

      const posPurchases = c.posSales.reduce((acc: number, s: any) => acc + Number(s.totalAmount), 0);
      const invPurchases = c.salesInvoices.reduce((acc: number, i: any) => acc + Number(i.totalAmount), 0);
      const totalPurchases = posPurchases + invPurchases;

      const posPaid = c.posSales.reduce((acc: number, s: any) => acc + Number(s.paidAmount), 0);
      const paymentSum = c.customerPayments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
      const totalPaid = posPaid + paymentSum;

      const outstandingAmount = Math.max(0, totalPurchases - totalPaid);

      const dates: Date[] = [
        ...c.posSales.map((s: any) => new Date(s.createdAt)),
        ...c.salesInvoices.map((i: any) => new Date(i.invoiceDate)),
      ];
      const lastPurchaseDate = dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString()
        : null;

      totalOrdersAll += totalOrders;
      totalPurchasesAll += totalPurchases;
      totalPaidAll += totalPaid;
      totalOutstandingAll += outstandingAmount;

      return {
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        email: c.email || "-",
        phone: c.phone || "-",
        city: c.city || "-",
        status: c.status,
        totalOrders,
        totalPurchases,
        totalPaid,
        outstandingAmount,
        lastPurchaseDate,
      };
    });

    return {
      summary: {
        totalCustomers,
        totalOrders: totalOrdersAll,
        totalPurchases: totalPurchasesAll,
        totalPaid: totalPaidAll,
        totalOutstanding: totalOutstandingAll,
      },
      customers: reportItems,
    };
  }

  /**
   * 3. INVENTORY STOCK MOVEMENT REPORT
   * Uses StockMovement table as the absolute source of truth for stock history.
   */
  async getInventoryMovementReport(organizationId: string, query: InventoryMovementReportQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = { organizationId };

    if (query.warehouseId && query.warehouseId !== "ALL") {
      where.warehouseId = query.warehouseId;
    }
    if (query.locationId && query.locationId !== "ALL") {
      where.locationId = query.locationId;
    }
    if (query.productId && query.productId !== "ALL") {
      where.productId = query.productId;
    }
    if (query.movementType && query.movementType !== ("ALL" as any)) {
      where.movementType = query.movementType as StockMovementType;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { sku: { contains: term, mode: "insensitive" } } },
        { referenceId: { contains: term, mode: "insensitive" } },
        { serialNumber: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } },
      ];
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const allMovementsForStats = await this.prisma.stockMovement.findMany({
      where,
      select: { quantity: true, totalCost: true, movementType: true },
    });

    let totalInboundQty = 0;
    let totalOutboundQty = 0;

    for (const m of allMovementsForStats) {
      const q = Number(m.quantity);
      if (q > 0) {
        totalInboundQty += q;
      } else {
        totalOutboundQty += Math.abs(q);
      }
    }

    const records = movements.map((m: any) => {
      const qtyNum = Number(m.quantity);
      const isOutbound = qtyNum < 0;

      return {
        id: m.id,
        createdAt: m.createdAt,
        productName: m.product?.name || "Unassigned Product",
        productSku: m.product?.sku || "-",
        variantName: m.variant?.name || null,
        warehouseName: m.warehouse?.name || "-",
        locationName: m.location?.name || "-",
        movementType: m.movementType,
        quantity: qtyNum,
        unitCost: Number(m.unitCost),
        totalCost: Number(m.totalCost),
        referenceType: m.referenceType || "Manual",
        referenceId: m.referenceId || "-",
        performedBy: m.actor
          ? `${m.actor.firstName || ""} ${m.actor.lastName || ""}`.trim()
          : "System Admin",
        notes: m.notes || "-",
        isOutbound,
      };
    });

    return {
      summary: {
        totalMovements: total,
        totalInboundQty,
        totalOutboundQty,
        netQtyChange: totalInboundQty - totalOutboundQty,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      records,
    };
  }
}
