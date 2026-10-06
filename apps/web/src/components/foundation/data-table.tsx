import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { EmptyState, ErrorState, LoadingSkeleton } from "./states";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

const ANIMATED_ROWS = 20;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  toolbar,
  paginate = true,
  isLoading = false,
  isError = false,
  onRetry,
}: {
  columns: Column<T>[];
  rows: T[];
  toolbar?: ReactNode;
  paginate?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="panel overflow-hidden">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          {toolbar}
        </div>
      ) : null}
      {isLoading && rows.length === 0 ? (
        <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
          <LoadingSkeleton rows={5} />
        </div>
      ) : isError && rows.length === 0 ? (
        <ErrorState
          className="m-4"
          {...(onRetry ? { onRetry } : {})}
        />
      ) : rows.length === 0 ? (
        <EmptyState className="rounded-none border-0" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            {/* Stagger runs once per mount; refetches update rows without replaying it. */}
            <motion.tbody
              variants={staggerContainer(0.02)}
              initial="hidden"
              animate="show"
              className="[&_tr:last-child]:border-0"
            >
              {rows.map((row, i) => {
                const cells = columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </TableCell>
                ));
                return i < ANIMATED_ROWS ? (
                  <motion.tr
                    key={i}
                    variants={staggerItem}
                    className="border-b transition-colors hover:bg-surface-2/70"
                  >
                    {cells}
                  </motion.tr>
                ) : (
                  <TableRow key={i}>{cells}</TableRow>
                );
              })}
            </motion.tbody>
          </Table>
        </div>
      )}
      {paginate && rows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
          <p className="tabular text-xs text-muted-foreground">
            Showing {rows.length} {rows.length === 1 ? "record" : "records"}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
