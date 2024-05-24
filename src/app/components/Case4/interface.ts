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
   * 请求头
   */
  headers?: Record<string, any>;

  /**
   * 分片大小byte
   */
  chunkSizeByte?: number;

  /**
   * 最大并发请求数
   */
  maxParallel?: number;

  /**
   * 单个分片最大自动重试次数
   */
  maxChunkAutoRetry?: number;

  /**
   * 自定义首帧请求进度
   */
  firstChunkProgress?: number;
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

export type ChunkInfoStatus = 'not-start' | 'fetching' | 'success' | 'fail';

export interface ChunkInfo {
  range: `${number}-${number}`;
  chunkData: ArrayBuffer | null;
  index: number;
  fetchCount: number;
  abortController: AbortController;
  status: ChunkInfoStatus;
}

export interface ChunksDownloadRet {
  status: 'download-success' | 'download-fail' | 'terminate' | 'chunk-progress';
  totalChunks: number;
  successChunks: number;
  percent: string;
  percentNum: number;
  fileName: string;
  fileTotalBytes: number;
}

export interface EventValue {
  'download-success': [ChunksDownloadRet];
  'download-fail': [ChunksDownloadRet];
  terminate: [ChunksDownloadRet];
  'chunk-progress': [ChunksDownloadRet];
}
