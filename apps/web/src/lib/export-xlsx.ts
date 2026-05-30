import * as XLSX from "xlsx";

/** Build an .xlsx from an array of flat row objects and trigger a download. */
export function exportToXlsx(filename: string, rows: Record<string, unknown>[], sheetName = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
