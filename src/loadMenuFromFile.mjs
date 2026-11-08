import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbook } from './parseWorkbook.mjs';

export function loadMenuFromFile(filePath) {
  return parseWorkbook(XLSX.read(readFileSync(filePath)));
}
