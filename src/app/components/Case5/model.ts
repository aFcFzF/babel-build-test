/**
 * @file util.ts
 * @author afcfzf(9301462@qq.com)
 */

import Excel, { CellValue } from 'exceljs';
import { DiffCellData, GridDiffDict, SheetContent } from './interface';

export class Diff {
  public async diff(
    origin: File,
    target: File,
    rowKey: string,
  ): Promise<Record<'originViewData' | 'targetViewData', DiffCellData[][]>> {
    let startTs = Date.now();
    const originContent = await this.readSheetContent(origin, 1, rowKey);
    const targetContent = await this.readSheetContent(target, 1, rowKey);
    console.log('解析耗时：', Date.now() - startTs);
    startTs = Date.now();
    originContent.body = originContent.body.slice(0, 100000);
    targetContent.body = targetContent.body.slice(0, 100000);
    console.log('=== originContent: ', originContent);
    const colDiffDict = this.getColDiffDict(originContent, targetContent);
    const rowDiffDict = this.getRowDiffDict(originContent, targetContent, rowKey);
    const gridDiffDict: GridDiffDict = {
      ...colDiffDict,
      ...rowDiffDict,
    };

    const originViewData = this.createViewData('origin', gridDiffDict, originContent, targetContent);
    console.log('diff单文件耗时', Date.now() - startTs);
    const targetViewData = this.createViewData('target', gridDiffDict, originContent, targetContent);

    return {
      originViewData,
      targetViewData,
    };
  }

  private getColDiffDict = (originContent: SheetContent, targetContent: SheetContent): GridDiffDict => {
    // 通过表头diff，确定列信息
    const colDiffDict: GridDiffDict = {};
    [...targetContent.head].forEach((targetHeadColName, targetHeadColIdx) => {
      const originHeadColIdx = originContent.head.indexOf(targetHeadColName);
      // 旧文件不存在，标记新文件添加
      if (originHeadColIdx === -1) {
        colDiffDict[`target-col-${targetHeadColIdx}`] = 'append';
        return;
      }

      // 已存在的表头列，相互映射
      colDiffDict[`target-col-mapping-${targetHeadColIdx}`] = originHeadColIdx;
      colDiffDict[`origin-col-mapping-${originHeadColIdx}`] = targetHeadColIdx;
    });

    // 行的列也有新增减少; 读取的时候，保留
    [...originContent.head].forEach((originHeadColName, originHeadColIdx) => {
      const targetHeadColIdx = targetContent.head.indexOf(originHeadColName);
      // 在新文件里不存在，标记删除
      if (targetHeadColIdx === -1) {
        colDiffDict[`origin-col-${originHeadColIdx}`] = 'delete';
        return;
      }
    });

    return colDiffDict;
  };

  private getRowDiffDict = (originContent: SheetContent, targetContent: SheetContent, rowKey: string): GridDiffDict => {
    // diff行，先找新增、删除行信息
    const originRowKeyIndex = originContent.head.findIndex((key) => key === rowKey);
    const targetRowKeyIndex = targetContent.head.findIndex((key) => key === rowKey);
    const rowDiffDict: GridDiffDict = {};

    const targetIds = targetContent.body.map((targetRow) => targetRow[targetRowKeyIndex]);
    [...originContent.body].forEach((originRow, originBodyRowIdx) => {
      // 新文件不存在rowKey，说明原始文件行被删除
      const targetBodyRowIdx = targetIds.indexOf(originRow[originRowKeyIndex]);
      if (targetBodyRowIdx === -1) {
        rowDiffDict[`origin-row-${originBodyRowIdx}`] = 'delete';
        return;
      }

      // 已存在的行index，相互映射
      rowDiffDict[`target-row-mapping-${targetBodyRowIdx}`] = originBodyRowIdx;
      rowDiffDict[`origin-row-mapping-${originBodyRowIdx}`] = targetBodyRowIdx;
    });

    const originIds = originContent.body.map((originRow) => originRow[originRowKeyIndex]);
    [...targetContent.body].forEach((targetRow, targetBodyRowIdx) => {
      // 旧文件不存在rowKey，说明新文件新增一行
      const originBodyRowIdx = originIds.indexOf(targetRow[targetRowKeyIndex]);
      if (originBodyRowIdx === -1) {
        rowDiffDict[`target-row-${targetBodyRowIdx}`] = 'append';
      }
    });

    return rowDiffDict;
  };

  private createViewData = (
    viewType: 'origin' | 'target',
    gridDiffDict: GridDiffDict,
    originContent: SheetContent,
    targetContent: SheetContent,
  ): DiffCellData[][] => {
    const viewData: DiffCellData[][] = [];
    const { head, body } = viewType === 'origin' ? originContent : targetContent;
    // 头部数据: 不支持表头删除，所以一定有头部数据
    const headViewData: DiffCellData[] = [];
    [...head].forEach((colName, idx) => {
      let diffType: DiffCellData['diffType'];
      if (viewType === 'origin') {
        diffType = gridDiffDict[`origin-col-${idx}`] === 'delete' ? 'origin_delete' : 'unchanged';
      } else {
        diffType = gridDiffDict[`target-col-${idx}`] === 'append' ? 'target_append' : 'unchanged';
      }

      headViewData.push({
        cellType: 'head',
        diffType,
        value: colName,
      });
      return;
    });
    viewData.push(headViewData);

    // 行数据
    [...body].forEach((row, rowIdx) => {
      // 情况1：整行变动，标价添加/删除
      let rowChanged: boolean;
      if (viewType === 'origin') {
        rowChanged = gridDiffDict[`origin-row-${rowIdx}`] === 'delete';
      } else {
        rowChanged = gridDiffDict[`target-row-${rowIdx}`] === 'append';
      }

      if (rowChanged) {
        const rowViewData: DiffCellData[] = row.map((cellValue) => ({
          cellType: 'body',
          diffType: viewType === 'origin' ? 'origin_delete' : 'target_append',
          value: cellValue,
        }));

        viewData.push(rowViewData);
        return;
      }

      const rowViewData: DiffCellData[] = [];
      [...row].forEach((cellValue, cellIdx) => {
        let colChanged: boolean;
        if (viewType === 'origin') {
          colChanged = gridDiffDict[`origin-col-${cellIdx}`] === 'delete';
        } else {
          colChanged = gridDiffDict[`target-col-${cellIdx}`] === 'append';
        }

        if (colChanged) {
          rowViewData.push({
            cellType: 'body',
            diffType: viewType === 'origin' ? 'origin_delete' : 'target_append',
            value: cellValue,
          });
          return;
        }

        const compareContentBody = viewType === 'origin' ? targetContent.body : originContent.body;
        const targetRow = this.getMappingRow(viewType, gridDiffDict, compareContentBody, rowIdx);
        const targetCellValue = this.getMappingCell(viewType, gridDiffDict, targetRow, cellIdx);
        rowViewData.push({
          cellType: 'body',
          diffType: cellValue === targetCellValue ? 'unchanged' : 'diff',
          value: cellValue,
        });
      });

      viewData.push(rowViewData);
    });

    return viewData;
  };

  private getMappingRow = (
    mappingSourceType: 'origin' | 'target',
    gridDiffDict: GridDiffDict,
    compareContentBody: Excel.CellValue[][],
    rowIdx: number,
  ): Excel.CellValue[] => {
    // 情况2: 原始列没删除，对应的新文件也有数据
    const targetRowIdx = gridDiffDict[`${mappingSourceType}-row-mapping-${rowIdx}`];
    // 取不到新文件对应行，一定有问题
    if (targetRowIdx == null) {
      throw new Error(`新文件对应行映射：${`${mappingSourceType}-row-mapping-${rowIdx}`} 没找到!!`);
    }

    const targetRow = compareContentBody[targetRowIdx];
    if (targetRow == null) {
      throw new Error(`新文件对应行数据：${targetRowIdx} 没找到!!`);
    }

    return targetRow;
  };

  private getMappingCell = (
    mappingSourceType: 'origin' | 'target',
    gridDiffDict: GridDiffDict,
    rowData: Excel.CellValue[],
    cellColIdx: number,
  ): Excel.CellValue => {
    const targetCellIdx = gridDiffDict[`${mappingSourceType}-col-mapping-${cellColIdx}`];
    if (targetCellIdx == null) {
      throw new Error(`新文件对应列映射：${`${mappingSourceType}-col-mapping-${cellColIdx}`} 没找到!!`);
    }

    const targetCellValue = rowData[targetCellIdx];
    if (targetCellValue == null) {
      throw new Error(`新文件对应cell数据：${targetCellIdx} 没找到!!`);
    }

    return targetCellValue;
  };

  private async readSheetContent(file: File, sheetIdx: number, rowKey: string): Promise<SheetContent> {
    const workbook = new Excel.Workbook();
    const buffer = await file.arrayBuffer();
    const res = await workbook.xlsx.load(buffer);
    const sheet = res.getWorksheet();

    if (!sheet) {
      throw new Error(`${file.name}内容为空`);
    }

    const sheetValues = sheet.getSheetValues();
    const head = sheetValues[sheetIdx];
    if (!rowKey || !Array.isArray(head) || !head.includes(rowKey)) {
      throw new Error(`rowKey: ${rowKey} 不存在`);
    }

    // 正常是[][]格式的
    const body = sheetValues.slice(2) as CellValue[][];

    return {
      head,
      body,
    };
  }
}
