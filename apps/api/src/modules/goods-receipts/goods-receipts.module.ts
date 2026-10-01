import { Module } from "@nestjs/common";
import { GoodsReceiptsService } from "./goods-receipts.service";
import { GoodsReceiptsController } from "./goods-receipts.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [PrismaModule, JournalEntriesModule, DocumentsModule],
  controllers: [GoodsReceiptsController],
  providers: [GoodsReceiptsService],
  exports: [GoodsReceiptsService],
})
export class GoodsReceiptsModule {}
