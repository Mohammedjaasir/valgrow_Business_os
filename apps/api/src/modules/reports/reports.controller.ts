import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ReportsService } from "./reports.service";
import { ExportService } from "./export.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import {
  SalesReportQueryDto,
  CustomerReportQueryDto,
  InventoryMovementReportQueryDto,
} from "./dto/report-query.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  @Get("sales")
  @RequirePermissions("sales.read")
  getSalesReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: SalesReportQueryDto,
  ) {
    return this.reportsService.getSalesReport(orgId, query);
  }

  @Get("sales/export")
  @RequirePermissions("sales.read")
  exportSalesReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: SalesReportQueryDto,
    @Query("format") format: "csv" | "xlsx" = "csv",
    @Res() res: Response,
  ) {
    return this.exportService.exportSalesReport(orgId, query, format, res);
  }

  @Get("customers")
  @RequirePermissions("sales.read")
  getCustomerReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: CustomerReportQueryDto,
  ) {
    return this.reportsService.getCustomerReport(orgId, query);
  }

  @Get("inventory-movements")
  @RequirePermissions("inventory.read")
  getInventoryMovementReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: InventoryMovementReportQueryDto,
  ) {
    return this.reportsService.getInventoryMovementReport(orgId, query);
  }

  @Get("inventory-movements/export")
  @RequirePermissions("inventory.read")
  exportInventoryMovementReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: InventoryMovementReportQueryDto,
    @Query("format") format: "csv" | "xlsx" = "csv",
    @Res() res: Response,
  ) {
    return this.exportService.exportInventoryMovementReport(orgId, query, format, res);
  }
}
