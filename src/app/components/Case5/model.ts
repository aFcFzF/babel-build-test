/**
 * @file util.ts
 * @author afcfzf(9301462@qq.com)
 */

import Excel, { CellValue } from 'exceljs';
import { DiffCellData, GridDiffDict, SheetContent } from './interface';

export class Diff {
  public async diff(origin: File, target: File, rowKey: string): Promise<void> {
    const originContent = await this.readSheetContent(origin, 1, rowKey);
    const targetContent = await this.readSheetContent(target, 1, rowKey);
    console.log('=== originContent: ', originContent);
    const colDiffDict = this.getColDiffDict(originContent, targetContent);
    const rowDiffDict = this.getRowDiffDict(originContent, targetContent, rowKey);
    const gridDiffDict: GridDiffDict = {
      ...colDiffDict,
      ...rowDiffDict,
    };

    const originViewData = this.createOriginViewData(diffHeadCellInfos, diffBodyCellInfos, originContent);
    const targetViewData = this.createTargetViewData();
  }

  private getColDiffDict = (originContent: SheetContent, targetContent: SheetContent): GridDiffDict => {
    // 通过表头diff，确定列信息
    const colDiffDict: GridDiffDict = {};
    [...targetContent.head.entries()].forEach(([targetHeadColIdx, targetHeadColName]) => {
      // TODO：区分表头内容为空、表头不存在
      if (targetHeadColName === undefined) {
        return;
      }

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
    [...originContent.head.entries()].forEach(([originHeadColIdx, originHeadColName]) => {
      // TODO：区分表头内容为空、表头不存在
      if (originHeadColName === undefined) {
        return;
      }

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
    originContent.body.forEach((originRow, originBodyRowIdx) => {
      // 新文件不存在rowKey，说明原始文件行被删除
      const targetBodyRowIdx = targetIds.indexOf(originRow[originRowKeyIndex]);
      if (targetBodyRowIdx === -1) {
        rowDiffDict[`origin-row-${originBodyRowIdx}`] = 'delete';
        return;
      }
    });

    const originIds = originContent.body.map((originRow) => originRow[originRowKeyIndex]);
    targetContent.body.forEach((targetRow, targetBodyRowIdx) => {
      // 旧文件不存在rowKey，说明新文件新增一行
      const originBodyRowIdx = originIds.indexOf(targetRow[targetBodyRowIdx]);
      if (originBodyRowIdx === -1) {
        rowDiffDict[`target-row-${targetBodyRowIdx}`] = 'append';
      }
    });

    return rowDiffDict;
  };

  private createOriginViewData = (gridDiffDict: GridDiffDict, originContent: SheetContent): DiffCellData[][] => {
    const originCellData: DiffCellData[][] = [];
    const { head, body } = originContent;
    return finalData;
  };

  private createTargetViewData = () => {};

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
