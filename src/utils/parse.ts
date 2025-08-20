import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function parseExcel(file: File): Promise<RawData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '', // Set default value for empty cells
        });

        // Extract header and rows
        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          reject(new Error('Excel file is empty or invalid.'));
          return;
        }

        const header = rawRows[0] as string[];
        const rows = rawRows.slice(1);

        // Clean up the data, converting to number/boolean/string
        const cleanedRows = rows.map((row: any) =>
          header.map((_h, colIdx) => {
            const value = row[colIdx];
            if (value === null || typeof value === 'undefined') {
              return '';
            }
            // Attempt to parse as number or boolean
            if (typeof value === 'string') {
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && isFinite(numValue)) {
                return numValue;
              }
              if (value.toLowerCase() === 'true') return true;
              if (value.toLowerCase() === 'false') return false;
            }
            return value;
          })
        );
        resolve({ header, rows: cleanedRows });
      } catch (error) {
        reject(new Error('Failed to parse Excel file.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSV(file: File): Promise<RawData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const header = results.meta.fields || [];
        const rows = results.data.map((row: any) =>
          header.map(key => {
            const value = row[key];
            if (value === null || typeof value === 'undefined') {
              return '';
            }
            return value;
          })
        );
        resolve({ header, rows });
      },
      error: (_: any) => {
        reject(new Error('Failed to parse CSV file.'));
      }
    });
  });
}

export function parseFile(file: File): Promise<RawData> {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (isExcel) {
    return parseExcel(file);
  } else {
    return parseCSV(file);
  }
}
