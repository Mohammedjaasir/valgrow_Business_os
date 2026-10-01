import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { PdfGeneratorService } from "../documents/pdf-generator.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import {
  UpdatePurchaseOrderDto,
  POActionDto,
} from "./dto/update-purchase-order.dto";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string, @Query("status") status?: string) {
    return this.service.getPurchaseOrders(orgId, status);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getPurchaseOrderById(id, orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id/pdf")
  async downloadPdf(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.pdfService.generatePurchaseOrderPdf(
      id,
      orgId,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @RequirePermissions("purchasing.create")
  @Post()
  create(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.service.createPurchaseOrder(orgId, userId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.service.updatePurchaseOrder(id, orgId, dto);
  }

  @RequirePermissions("purchasing.create")
  @Post(":id/submit")
  submit(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: POActionDto,
  ) {
    return this.service.submit(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.approve")
  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: POActionDto,
  ) {
    return this.service.approve(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.create")
  @Post(":id/send")
  send(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: POActionDto,
  ) {
    return this.service.send(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: POActionDto,
  ) {
    return this.service.cancel(id, orgId, userId, dto);
  }
}
