import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ActivityLogsModule } from "./modules/activity-logs/activity-logs.module";
import { FilesModule } from "./modules/files/files.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { TaxesModule } from "./modules/taxes/taxes.module";
import { UnitsModule } from "./modules/units/units.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { ProductVariantsModule } from "./modules/product-variants/product-variants.module";
import { ProductPricesModule } from "./modules/product-prices/product-prices.module";
import { WarehousesModule } from "./modules/warehouses/warehouses.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { InventoryBatchesModule } from "./modules/inventory-batches/inventory-batches.module";
import { InventorySerialNumbersModule } from "./modules/inventory-serial-numbers/inventory-serial-numbers.module";
import { InventoryMovementsModule } from "./modules/inventory-movements/inventory-movements.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { InventoryTransfersModule } from "./modules/inventory-transfers/inventory-transfers.module";
import { InventoryAdjustmentsModule } from "./modules/inventory-adjustments/inventory-adjustments.module";
import { InventoryReservationsModule } from "./modules/inventory-reservations/inventory-reservations.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { PurchaseRequestsModule } from "./modules/purchase-requests/purchase-requests.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { GoodsReceiptsModule } from "./modules/goods-receipts/goods-receipts.module";
import { LandedCostsModule } from "./modules/landed-costs/landed-costs.module";
import { SupplierInvoicesModule } from "./modules/supplier-invoices/supplier-invoices.module";
import { SupplierPaymentsModule } from "./modules/supplier-payments/supplier-payments.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { QuotationsModule } from "./modules/quotations/quotations.module";
import { SalesOrdersModule } from "./modules/sales-orders/sales-orders.module";
import { DeliveryNotesModule } from "./modules/delivery-notes/delivery-notes.module";
import { SalesInvoicesModule } from "./modules/sales-invoices/sales-invoices.module";
import { CustomerPaymentsModule } from "./modules/customer-payments/customer-payments.module";
import { SalesReturnsModule } from "./modules/sales-returns/sales-returns.module";
import { SalesCreditNotesModule } from "./modules/sales-credit-notes/sales-credit-notes.module";
import { PosModule } from "./modules/pos/pos.module";
import { CrmModule } from "./modules/crm/crm.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { FiscalYearsModule } from "./modules/fiscal-years/fiscal-years.module";
import { AccountingPeriodsModule } from "./modules/accounting-periods/accounting-periods.module";
import { CostCentersModule } from "./modules/cost-centers/cost-centers.module";
import { JournalEntriesModule } from "./modules/journal-entries/journal-entries.module";
import { ArApModule } from "./modules/ar-ap/ar-ap.module";
import { BankAccountingModule } from "./modules/bank-accounting/bank-accounting.module";
import { TaxAccountingModule } from "./modules/tax-accounting/tax-accounting.module";
import { FinancialReportsModule } from "./modules/financial-reports/financial-reports.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    TeamsModule,
    SettingsModule,
    NotificationsModule,
    ActivityLogsModule,
    FilesModule,
    SessionsModule,
    TaxesModule,
    UnitsModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    ProductVariantsModule,
    ProductPricesModule,
    WarehousesModule,
    LocationsModule,
    InventoryBatchesModule,
    InventorySerialNumbersModule,
    InventoryMovementsModule,
    InventoryModule,
    InventoryTransfersModule,
    InventoryAdjustmentsModule,
    InventoryReservationsModule,
    SuppliersModule,
    PurchaseRequestsModule,
    PurchaseOrdersModule,
    GoodsReceiptsModule,
    LandedCostsModule,
    SupplierInvoicesModule,
    SupplierPaymentsModule,
    CustomersModule,
    QuotationsModule,
    SalesOrdersModule,
    DeliveryNotesModule,
    SalesInvoicesModule,
    CustomerPaymentsModule,
    SalesReturnsModule,
    SalesCreditNotesModule,
    PosModule,
    CrmModule,
    AccountsModule,
    FiscalYearsModule,
    AccountingPeriodsModule,
    CostCentersModule,
    JournalEntriesModule,
    ArApModule,
    BankAccountingModule,
    TaxAccountingModule,
    FinancialReportsModule,
    ReportsModule,
    DashboardModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
