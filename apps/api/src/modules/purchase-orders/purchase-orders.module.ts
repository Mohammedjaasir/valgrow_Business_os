import { Module } from "@nestjs/common";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
