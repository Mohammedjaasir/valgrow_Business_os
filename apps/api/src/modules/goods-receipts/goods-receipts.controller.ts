import { Controller, Get, Post, Param, Body, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { GoodsReceiptsService } from "./goods-receipts.service";
import { PdfGeneratorService } from "../documents/pdf-generator.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";

@Controller("goods-receipts")
export class GoodsReceiptsController {
  constructor(
    private readonly service: GoodsReceiptsService,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string, @Query("status") status?: string) {
    return this.service.getGoodsReceipts(orgId, status);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getGoodsReceiptById(id, orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id/pdf")
  async downloadPdf(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.pdfService.generateGoodsReceiptPdf(
      id,
      orgId,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @RequirePermissions("purchasing.receive")
  @Post()
  create(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateGoodsReceiptDto,
  ) {
    return this.service.createGoodsReceipt(orgId, userId, dto);
  }

  @RequirePermissions("purchasing.receive")
  @Post(":id/post")
  post(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.postGoodsReceipt(id, orgId, userId);
  }

  @RequirePermissions("purchasing.update")
  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.cancelGoodsReceipt(id, orgId, userId);
  }
}
