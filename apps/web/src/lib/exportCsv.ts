import { toast } from "sonner";

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes a cell value for CSV output according to RFC 4180 rules.
 * Correctly handles null, undefined, numbers, commas, double quotes, and newlines.
 */
export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads a CSV file given filename, columns specification, and records array.
 */
export function exportToCsv<T>({
  filename,
  columns,
  data,
}: {
  filename: string;
  columns: CsvColumn<T>[];
  data: T[];
}): boolean {
  if (!data || data.length === 0) {
    toast.error("No records available to export.");
    return false;
  }

  try {
    const BOM = "\uFEFF"; // UTF-8 BOM for proper character encoding in Excel & spreadsheet software
    const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(",");
    const dataRows = data.map((item) =>
      columns.map((col) => escapeCsvCell(col.accessor(item))).join(",")
    );

    const csvContent = BOM + [headerRow, ...dataRows].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} record${data.length === 1 ? "" : "s"} successfully.`);
    return true;
  } catch (err: any) {
    toast.error(err?.message || "Failed to export CSV file.");
    return false;
  }
}

/**
 * Returns formatted filename with current local date YYYY-MM-DD.
 */
export function getExportFilename(prefix: string): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${prefix}-${year}-${month}-${day}.csv`;
}
