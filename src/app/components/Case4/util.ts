/**
 * @file util.ts
 * @author afcfzf(9301462@qq.com)
 */

import axios from 'axios';
import {
  ChunkInfo,
  ChunksDownloadRet,
  DownLoadBlobPartsOption,
  DownloadChunksOption,
  GetChunkFailRet,
  GetChunkOption,
  GetChunkRet,
  GetChunkSuccessRet,
} from './interface';

import EventEmitter from 'event-emitter';

/**
 * 支持重试的分片下载
 * @param option
 * @returns
 */
export class ChunksDownload extends EventEmitter {
  private terminated = false;
  private chunkInfoList: ChunkInfo[] = [];
  private fileName = '';
  private fileContentType = '';
  private option: Required<Pick<DownloadChunksOption, 'chunkSize' | 'url' | 'maxParallel' | 'maxChunkAutoRetry'>> &
    Pick<DownloadChunksOption, 'data'>;

  constructor(option: DownloadChunksOption) {
    const {
      // 分片默认3M，小于则直接下载
      chunkSize = 3 * 1024,
      // 最大
      maxParallel = 10,
      maxChunkAutoRetry = 3,
      ...extra
    } = option;

    this.option = {
      chunkSize,
      maxParallel,
      maxChunkAutoRetry,
      ...extra,
    };
  }

  public async download(): Promise<ChunksDownloadRet> {
    const { data, chunkSize } = this.option;

    const chunkSizeByte = chunkSize * 1024;
    this.terminated = false;

    const firstAbortController = new AbortController();
    const firstChunk = await this.getChunk({
      abortController: firstAbortController,
      chunkIndex: 0,
      headers: {
        range: `bytes=0-${chunkSizeByte}`,
      },
      data,
    });

    if (firstChunk.status === 'rejected') {
      throw new Error(firstChunk.reason);
    }

    const { chunkData, chunkHeaders } = firstChunk;

    // chunk是否格式正确
    console.log('headers ===', chunkHeaders, chunkData);

    this.fileName = chunkHeaders['content-disposition']?.match?.(/filename=([\w%\-\\.]+)(?:; |$)/i)?.[1] || '未知名称';
    this.fileContentType = chunkHeaders['content-type'];
    const contentRange = chunkHeaders['content-range'];
    if (!contentRange) {
      throw new Error('content-range not found');
    }

    // 创建文件&获取文件大小
    const [start, end, totalBytes] = (contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/)?.slice(1) || []).map(
      (item: string) => Number(item),
    );
    if (start == null || end == null || totalBytes == null) {
      throw new Error('chunk protocol error!');
    }

    // 小文件直接下载
    if (totalBytes <= chunkSizeByte) {
      this.downloadBlobParts({
        fileContentType: this.fileContentType,
        fileName: this.fileName,
        blobParts: [chunkData],
      });

      return {
        status: 'success',
        totalChunks: 1,
        successChunks: 1,
        percent: 100,
      };
    }

    // 分片下载
    this.chunkInfoList = [
      {
        abortController: firstAbortController,
        range: `${0}-${chunkSizeByte}`,
        chunkData,
        index: 0,
        retryCount: 0,
        status: 'not_start',
      },
    ];

    const chunksLen = Math.ceil(totalBytes / chunkSizeByte) - 1;
    const chunkRangeList = Array.from({ length: chunksLen }, (_, idx) => {
      const startChunkSize = (idx + 1) * chunkSizeByte;
      const endChunkSize = (idx + 2) * chunkSizeByte >= totalBytes ? totalBytes : (idx + 2) * chunkSizeByte;
      const chunkInfo: ChunkInfo = {
        abortController: new AbortController(),
        range: `${startChunkSize}-${endChunkSize}`,
        chunkData: null,
        index: idx + 1,
        retryCount: 0,
        status: 'not_start',
      };
      return chunkInfo;
    });

    this.chunkInfoList.push(...chunkRangeList);
    return this.getChunksParallel();
  }

  public manualRetry(): Promise<ChunksDownloadRet> {
    // 手动重试后，清空最大自动重试项
    for (const item of this.chunkInfoList) {
      if (item.retryCount > this.option.maxChunkAutoRetry) {
        item.retryCount = 0;
      }
    }

    return this.getChunksParallel();
  }

  public terminate(): void {
    this.fileName = '';
    this.fileContentType = '';
    this.terminated = true;
    this.chunkInfoList.forEach((item) => {
      item.abortController.abort();
    });
  }

  private downloadBlobParts(option: DownLoadBlobPartsOption): void {
    const { blobParts, fileName, fileContentType = 'text/plain' } = option;
    const blob = new Blob(blobParts, { type: fileContentType });
    const blobUrl = URL.createObjectURL(blob);
    const el = document.createElement('a');

    el.setAttribute('href', blobUrl);
    el.setAttribute('download', decodeURI(fileName));
    el.click();
    el.remove();
  }

  private checkChunkValid(binResp: ArrayBuffer): void {
    const txtDecoder = new TextDecoder();
    const respTxt = txtDecoder.decode(binResp);

    if (respTxt.includes('{"code"')) {
      try {
        const { message: errMsg } = JSON.parse(respTxt);
        throw new Error(errMsg);
      } catch (err) {
        throw new Error('content json parse error');
      }
    }
  }

  private getChunk(option: GetChunkOption): Promise<GetChunkRet> {
    const { data, headers, chunkIndex, abortController } = option;
    return axios
      .post(this.option.url, data, {
        responseType: 'arraybuffer',
        headers,
        signal: abortController.signal,
      })
      .then((res) => {
        const { data: chunkData, headers: chunkHeaders } = res;
        // chunk是否格式正确
        this.checkChunkValid(chunkData);
        const ret: GetChunkSuccessRet = {
          status: 'fulfilled',
          chunkHeaders,
          chunkData,
          chunkIndex,
        };
        return ret;
      })
      .catch((err: Error) => {
        const ret: GetChunkFailRet = {
          status: 'rejected',
          chunkIndex,
          reason: String(err?.message || err),
        };
        return ret;
      });
  }

  private async getChunksParallel(): Promise<ChunksDownloadRet> {
    if (this.terminated) {
      const successChunks = this.chunkInfoList.filter((item) => item.chunkData).length;
      return {
        status: 'terminate',
        totalChunks: this.chunkInfoList.length,
        successChunks,
        percent: +(successChunks / this.chunkInfoList.length).toFixed(1),
      };
    }

    const { maxParallel } = this.option;
    const needReqList = this.chunkInfoList.filter((item) => !item.chunkData).slice(0, maxParallel);

    // 全部请求成功
    if (!needReqList.length) {
      const blobParts: ArrayBuffer[] = [];
      for (const item of this.chunkInfoList) {
        if (item.chunkData == null) {
          // 类型保护
          throw new Error('服务异常：not reach');
        }
        blobParts.push(item.chunkData);
      }

      this.downloadBlobParts({
        fileName: this.fileName,
        fileContentType: this.fileContentType,
        blobParts,
      });

      return {
        status: 'success',
        totalChunks: this.chunkInfoList.length,
        successChunks: this.chunkInfoList.length,
        percent: 100,
      };
    }

    // 并发请求
    return Promise.all(
      needReqList.map((item) =>
        this.getChunk({
          abortController: item.abortController,
          chunkIndex: item.index,
          headers: {
            range: `bytes=${item.range}`,
          },
        }),
      ),
    ).then((res) => {
      // 记录retry次数
      res.forEach((item) => {
        // flushed
        if (!this.chunkInfoList.length) {
        }
        const chunkInfo = this.chunkInfoList[item.chunkIndex];
        if (item.status === 'fulfilled') {
          chunkInfo.chunkData = item.chunkData;
        } else {
          chunkInfo.retryCount += 1;
        }
      });

      for (const item of this.chunkInfoList) {
        // 有未加载的chunk && 重试次数没超过最大值
        if (!item.chunkData && item.retryCount <= this.option.maxChunkAutoRetry) {
          return this.getChunksParallel();
        }
      }

      const successChunks = this.chunkInfoList.filter((item) => item.chunkData).length;
      return {
        status: 'fail',
        totalChunks: this.chunkInfoList.length,
        successChunks,
        percent: +(successChunks / this.chunkInfoList.length).toFixed(1),
      };
    });
  }
}
