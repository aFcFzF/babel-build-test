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
  EventValue,
  GetChunkFailRet,
  GetChunkOption,
  GetChunkRet,
  GetChunkSuccessRet,
} from './interface';

import Emitter from 'eventemitter3';

/**
 * 支持重试的分片下载
 * @param option
 * @returns
 */
export class ChunksDownload extends Emitter<EventValue> {
  private terminated = true;
  private chunkInfoList: ChunkInfo[] = [];
  private fileName = '';
  private fileContentType = '';
  private fileHash = '';
  private fileTotalBytes = 0;
  private option!: Required<
    Pick<DownloadChunksOption, 'chunkSizeByte' | 'url' | 'maxParallel' | 'maxChunkAutoRetry' | 'firstChunkProgress'>
  > &
    Pick<DownloadChunksOption, 'data'>;

  public updateOption = (option: DownloadChunksOption): void => {
    const {
      // 分片默认3M，小于则直接下载
      chunkSizeByte = 3 * 1024 * 1024,
      // 最大
      maxParallel = 10,
      maxChunkAutoRetry = 3,
      firstChunkProgress = 10,
      ...extra
    } = option;

    this.option = {
      chunkSizeByte,
      maxParallel,
      maxChunkAutoRetry,
      firstChunkProgress,
      ...extra,
    };
  };

  public download = async (): Promise<void> => {
    if (!this.option) {
      throw new Error('先调用updateOption初始化!');
    }

    // 禁止重复下载
    if (!this.terminated) {
      return;
    }

    const { data, chunkSizeByte } = this.option;
    this.terminated = false;

    const firstAbortController = new AbortController();
    this.emitDownloadRet('chunk-progress');

    // 分片下载
    this.chunkInfoList = [
      {
        abortController: firstAbortController,
        range: `${0}-${chunkSizeByte}`,
        chunkData: null,
        index: 0,
        fetchCount: 0,
        status: 'fetching',
      },
    ];

    const firstChunk = await this.getChunk({
      abortController: firstAbortController,
      chunkIndex: 0,
      headers: {
        range: `bytes=0-${chunkSizeByte}`,
      },
      data,
    });

    if (firstChunk.status === 'rejected') {
      this.emitDownloadRet('download-fail');
      return;
    }

    const { chunkData, chunkHeaders } = firstChunk;

    this.chunkInfoList[0].chunkData = chunkData;
    this.chunkInfoList[0].status = 'success';

    // chunk是否格式正确
    console.log('headers ===', chunkHeaders);

    this.fileName = chunkHeaders['content-disposition']?.match?.(/filename=([\w%\-\\.]+)(?:; |$)/i)?.[1] || '未知名称';
    this.fileName = decodeURI(this.fileName);
    this.fileContentType = chunkHeaders['content-type'];
    this.fileHash = chunkHeaders['x-file-hash'];
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

    this.fileTotalBytes = totalBytes;

    // 小文件直接下载
    if (totalBytes <= chunkSizeByte) {
      this.downloadBlobParts({
        fileContentType: this.fileContentType,
        fileName: this.fileName,
        blobParts: [chunkData],
      });

      this.emitDownloadRet('download-success');
    }

    const chunksLen = Math.ceil(totalBytes / chunkSizeByte) - 1;
    const chunkRangeList = Array.from({ length: chunksLen }, (_, idx) => {
      // range是闭区间，从第二片开始，左开右闭
      const startChunkSize = (idx + 1) * chunkSizeByte + 1;
      const endChunkSize = (idx + 2) * chunkSizeByte >= totalBytes ? totalBytes : (idx + 2) * chunkSizeByte;
      const chunkInfo: ChunkInfo = {
        abortController: new AbortController(),
        range: `${startChunkSize}-${endChunkSize}`,
        chunkData: null,
        index: idx + 1,
        fetchCount: 0,
        status: 'not-start',
      };
      return chunkInfo;
    });

    this.chunkInfoList.push(...chunkRangeList);
    this.getChunksParallel();
  };

  /**
   * 手动重试
   * @returns
   */
  public retry(): void {
    // 禁止重复下载
    if (!this.terminated) {
      return;
    }

    // 手动重试后，清空最大自动重试项
    for (const item of this.chunkInfoList) {
      if (item.fetchCount > this.option.maxChunkAutoRetry) {
        item.fetchCount = 0;
      }
    }

    this.getChunksParallel();
  }

  /**
   * 停止下载
   */
  public terminate = (): void => {
    this.fileName = '';
    this.fileContentType = '';
    this.chunkInfoList.forEach((item) => {
      item.status === 'fetching' && item.abortController.abort();
    });

    this.emitDownloadRet('terminate');
  };

  private emitDownloadRet = (status: ChunksDownloadRet['status']): void => {
    const successChunks = this.chunkInfoList.filter((item) => item.status === 'success').length;
    let percent = +((successChunks / this.chunkInfoList.length) * 100).toFixed(2);
    // 自定义首帧进度
    percent = percent > this.option.firstChunkProgress ? percent : this.option.firstChunkProgress;
    this.emit(status, {
      status,
      totalChunks: this.chunkInfoList.length,
      successChunks,
      // 避免数字没有小数点部分闪动
      percent: percent === 100 ? '100' : percent.toFixed(2),
      percentNum: percent,
      fileName: this.fileName,
      fileTotalBytes: this.fileTotalBytes,
    });
    if (status !== 'chunk-progress') {
      this.terminated = true;
    }
  };

  private downloadBlobParts = (option: DownLoadBlobPartsOption): void => {
    const { blobParts, fileName, fileContentType = 'text/plain' } = option;
    const blob = new Blob(blobParts, { type: fileContentType, endings: 'native' });
    const blobUrl = URL.createObjectURL(blob);
    const el = document.createElement('a');

    el.setAttribute('href', blobUrl);
    el.setAttribute('download', fileName);
    el.click();
    el.remove();
  };

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

  private getChunk = (option: GetChunkOption): Promise<GetChunkRet> => {
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
  };

  private getNeedChunkInfoList = (): ChunkInfo[] =>
    this.chunkInfoList.filter((item) => item.status === 'not-start' || item.status === 'fail');

  private chunkParallel = (chunkRet: GetChunkRet): void => {
    if (this.terminated) {
      return;
    }

    const { chunkIndex } = chunkRet;
    const chunkInfo = this.chunkInfoList[chunkIndex];
    if (chunkRet.status === 'fulfilled') {
      chunkInfo.chunkData = chunkRet.chunkData;
      chunkInfo.status = 'success';
    } else {
      chunkInfo.status = 'fail';
    }

    this.emitDownloadRet('chunk-progress');

    // 存在超过最大自动重试分片时，状态失败
    for (const item of this.chunkInfoList) {
      // 有未加载的chunk && 重试次数没超过最大值
      if (item.fetchCount > this.option.maxChunkAutoRetry) {
        // 取消所有分片
        this.chunkInfoList.forEach((item) => {
          item.status === 'fetching' && item.abortController.abort();
        });
        this.emitDownloadRet('download-fail');
        return;
      }

      if (item.status === 'not-start' || item.status === 'fail') {
        item.fetchCount += 1;
        const { status } = item;
        item.status = 'fetching';

        this.getChunk({
          chunkIndex: item.index,
          data: {
            fetchCount: item.fetchCount,
            chunkIndex: item.index,
            chunkRange: item.range,
          },
          headers: {
            range: `bytes=${item.range}`,
            'x-file-hash': this.fileHash,
          },
          // 重试时，更新abortController
          abortController: status === 'not-start' ? item.abortController : new AbortController(),
        }).then(this.chunkParallel);
        return;
      }
    }

    const allChunksFulfilled = this.chunkInfoList.every((item) => item.status === 'success' || item.status === 'fail');

    if (allChunksFulfilled) {
      // 全部成功
      const allChunksSuccess = this.chunkInfoList.every((item) => item.status === 'success');
      if (allChunksSuccess) {
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

        this.emitDownloadRet('download-success');
        return;
      }

      this.emitDownloadRet('download-fail');
    }
  };

  /**
   * 初始 & 重试批量拉取
   * @returns
   */
  private getChunksParallel = (): void => {
    if (this.terminated) {
      return;
    }

    // 开始并发请求或重试列表
    const needReqList = this.getNeedChunkInfoList().slice(0, this.option.maxParallel);

    needReqList.forEach((item) => {
      item.fetchCount += 1;
      item.status = 'fetching';

      this.getChunk({
        chunkIndex: item.index,
        data: {
          fetchCount: item.fetchCount,
          chunkIndex: item.index,
          chunkRange: item.range,
        },
        headers: {
          range: `bytes=${item.range}`,
          'x-file-hash': this.fileHash,
        },
        abortController: item.abortController,
      }).then(this.chunkParallel);
    });
  };
}
