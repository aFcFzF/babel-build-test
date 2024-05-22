/**
 * @file interface.ts
 * @author afcfzf(9301462@qq.com)
 */

import type { AxiosRequestHeaders } from 'axios';

export interface DownLoadBlobPartsOption {
  blobParts: BlobPart[];
  fileContentType?: string;
  fileName: string;
}

export interface DownloadChunksOption {
  /**
   * 下载地址
   */
  url: string;

  /**
   * 接口数据
   */
  data?: Record<string, any>;

  /**
   * 分片大小(kb) 默认3MB: 3 * 1024
   */
  chunkSize?: number;

  /**
   * 最大并发请求数
   */
  maxParallel?: number;

  /**
   * 单个分片最大自动重试次数
   */
  maxChunkAutoRetry?: number;
}

export interface GetChunkOption extends Pick<DownloadChunksOption, 'data'> {
  abortController: AbortController;
  chunkIndex: number;
  headers?: AxiosRequestHeaders;
}

export interface GetChunkSuccessRet {
  status: 'fulfilled';
  chunkData: ArrayBuffer;
  chunkHeaders: AxiosRequestHeaders;
  chunkIndex: number;
}

export interface GetChunkFailRet {
  status: 'rejected';
  chunkIndex: number;
  reason: string;
}

export type GetChunkRet = GetChunkSuccessRet | GetChunkFailRet;

export type ChunkInfo = {
  range: `${number}-${number}`;
  chunkData: ArrayBuffer | null;
  index: number;
  retryCount: number;
  abortController: AbortController;
  status: 'not_start' | 'success' | 'fail';
};

export interface GetChunksRecursiveOption extends Pick<DownloadChunksOption, 'data'> {
  headers?: AxiosRequestHeaders;
}

export interface ChunksDownloadRet {
  status: 'success' | 'fail' | 'terminate';
  totalChunks: number;
  successChunks: number;
  percent: number;
}
