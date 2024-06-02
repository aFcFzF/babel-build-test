import { CellValue } from 'exceljs';

// | Record<`origin-col-${number}`, 'delete'>
// | Record<`origin-row-${number}`, 'delete'>
// | Record<`target-col-${number}`, 'append'>
// | Record<`target-row-${number}`, 'append'>;
// export type GridDiffDict =
//   | Record<`origin-col-${number}` | `origin-row-${number}`, 'delete'>
//   | Record<`target-col-${number}` | `target-row-${number}`, 'append'>;

export interface GridDiffDict {
  [prop: `origin-col-${number}` | `origin-row-${number}`]: 'delete';
  [prop: `target-col-${number}` | `target-row-${number}`]: 'append';
  [prop: `origin-col-mapping-${number}` | `target-col-mapping-${number}`]: number;
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
