import { CellValue } from 'exceljs';

export interface GridDiffDict {
  [prop: `origin-col-${number}` | `origin-row-${number}`]: 'delete';
  [prop: `target-col-${number}` | `target-row-${number}`]: 'append';
  [prop: `origin-col-mapping-${number}` | `target-col-mapping-${number}`]: number;
  [prop: `origin-row-mapping-${number}` | `target-row-mapping-${number}`]: number;
}

export interface DiffCellData {
  cellType: 'head' | 'body';
  diffType: 'target_append' | 'origin_delete' | 'unchanged' | 'diff';
  value: CellValue;
}

export interface SheetContent {
  head: CellValue[];
  body: CellValue[][];
}
