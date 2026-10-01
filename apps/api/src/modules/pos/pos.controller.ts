import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PosSessionService } from "./services/pos-session.service";
import { PosProductSearchService } from "./services/pos-product-search.service";
import { PosCartService } from "./services/pos-cart.service";
import { PosCheckoutService } from "./services/pos-checkout.service";
import { PosRefundService } from "./services/pos-refund.service";
import { PdfGeneratorService } from "../documents/pdf-generator.service";
import { OpenPosSessionDto, ClosePosSessionDto } from "./dto/session.dto";
import {
  CreatePosCartDto,
  AddPosCartItemDto,
  UpdatePosCartItemDto,
} from "./dto/cart.dto";
import { PosCheckoutDto, PosRefundDto } from "./dto/checkout.dto";

@Controller("pos")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PosController {
  constructor(
    private readonly sessionService: PosSessionService,
    private readonly searchService: PosProductSearchService,
    private readonly cartService: PosCartService,
    private readonly checkoutService: PosCheckoutService,
    private readonly refundService: PosRefundService,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  // ==================================================
  // SESSIONS
  // ==================================================

  @Post("sessions/open")
  @RequirePermissions("pos.session")
  openSession(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: OpenPosSessionDto,
  ) {
    return this.sessionService.openSession(orgId, userId, dto);
  }

  @Get("sessions")
  @RequirePermissions("pos.read")
  getSessions(
    @CurrentOrg("id") orgId: string,
    @Query("status") status?: string,
    @Query("terminalId") terminalId?: string,
  ) {
    return this.sessionService.getSessions(orgId, status, terminalId);
  }

  @Get("sessions/:id")
  @RequirePermissions("pos.read")
  getSessionById(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.sessionService.getSessionById(orgId, id);
  }

  @Post("sessions/:id/close")
  @RequirePermissions("pos.close")
  closeSession(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: ClosePosSessionDto,
  ) {
    return this.sessionService.closeSession(orgId, userId, id, dto);
  }

  @Post("sessions/:id/suspend")
  @RequirePermissions("pos.session")
  suspendSession(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.sessionService.suspendSession(orgId, id);
  }

  @Post("sessions/:id/resume")
  @RequirePermissions("pos.session")
  resumeSession(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.sessionService.resumeSession(orgId, id);
  }

  // ==================================================
  // PRODUCT SEARCH & BARCODE
  // ==================================================

  @Get("products/search")
  @RequirePermissions("pos.read")
  searchProducts(
    @CurrentOrg("id") orgId: string,
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
    @Query("brandId") brandId?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.searchService.searchProducts(orgId, {
      search,
      categoryId,
      brandId,
      warehouseId,
      page,
      limit,
    });
  }

  @Get("products/barcode/:code")
  @RequirePermissions("pos.read")
  findByBarcode(@CurrentOrg("id") orgId: string, @Param("code") code: string) {
    return this.searchService.findByBarcode(orgId, code);
  }

  // ==================================================
  // CARTS
  // ==================================================

  @Post("carts")
  @RequirePermissions("pos.create")
  createCart(@CurrentOrg("id") orgId: string, @Body() dto: CreatePosCartDto) {
    return this.cartService.createCart(orgId, dto);
  }

  @Get("carts/:id")
  @RequirePermissions("pos.read")
  getCart(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.cartService.getCart(orgId, id);
  }

  @Post("carts/:id/items")
  @RequirePermissions("pos.create")
  addItem(
    @CurrentOrg("id") orgId: string,
    @Param("id") id: string,
    @Body() dto: AddPosCartItemDto,
  ) {
    return this.cartService.addItem(orgId, id, dto);
  }

  @Patch("carts/:id/items/:itemId")
  @RequirePermissions("pos.create")
  updateItem(
    @CurrentOrg("id") orgId: string,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdatePosCartItemDto,
  ) {
    return this.cartService.updateItem(orgId, id, itemId, dto);
  }

  @Delete("carts/:id/items/:itemId")
  @RequirePermissions("pos.create")
  removeItem(
    @CurrentOrg("id") orgId: string,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ) {
    return this.cartService.removeItem(orgId, id, itemId);
  }

  @Post("carts/:id/hold")
  @RequirePermissions("pos.create")
  holdCart(
    @CurrentOrg("id") orgId: string,
    @Param("id") id: string,
    @Body("notes") notes?: string,
  ) {
    return this.cartService.holdCart(orgId, id, notes);
  }

  @Post("carts/:id/resume")
  @RequirePermissions("pos.create")
  resumeCart(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.cartService.resumeCart(orgId, id);
  }

  @Delete("carts/:id")
  @RequirePermissions("pos.create")
  clearCart(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.cartService.clearCart(orgId, id);
  }

  // ==================================================
  // CHECKOUT & SALES
  // ==================================================

  @Post("checkout")
  @RequirePermissions("pos.checkout")
  checkout(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") cashierId: string,
    @Body() dto: PosCheckoutDto,
  ) {
    return this.checkoutService.checkout(orgId, cashierId, dto);
  }

  @Get("sales")
  @RequirePermissions("pos.read")
  getSales(
    @CurrentOrg("id") orgId: string,
    @Query("sessionId") sessionId?: string,
  ) {
    return this.checkoutService.getSales(orgId, sessionId);
  }

  @Get("sales/:id")
  @RequirePermissions("pos.read")
  getSaleById(@CurrentOrg("id") orgId: string, @Param("id") id: string) {
    return this.checkoutService.getSaleById(orgId, id);
  }

  @Get("sales/:id/receipt")
  @RequirePermissions("pos.read")
  async downloadReceipt(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.pdfService.generatePosReceiptPdf(
      id,
      orgId,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get("sales/:id/pdf")
  @RequirePermissions("pos.read")
  async downloadPdf(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Res() res: Response,
  ) {
    return this.downloadReceipt(id, orgId, res);
  }

  @Post("sales/:id/refund")
  @RequirePermissions("pos.refund")
  refundSale(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") actorId: string,
    @Param("id") id: string,
    @Body() dto: PosRefundDto,
  ) {
    return this.refundService.refundPOSSale(orgId, actorId, id, dto);
  }
}
