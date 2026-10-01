import { Module } from "@nestjs/common";
import { SalesInvoicesService } from "./sales-invoices.service";
import { SalesInvoicesController } from "./sales-invoices.controller";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [JournalEntriesModule, DocumentsModule],
  controllers: [SalesInvoicesController],
  providers: [SalesInvoicesService],
  exports: [SalesInvoicesService],
})
export class SalesInvoicesModule {}
