/**
 * @file ChunksDownload.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { Ref, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { DownloadChunksOption } from '../../interface';
import { ChunksDownload } from '../../model';
import { Icon, message } from '@tencent/spaui';
import { DownloadProgress, DownloadProgressProps } from '../DownloadProgress';
import './style.less';

const ptpFeChunksDownloadContentPrefix = 'ptp-fe-chunks-download-content';

interface ProgressState extends DownloadProgressProps {
  fileName: string;
}

export interface ChunksDownloadContentProps extends DownloadChunksOption {
  showSuccessTip?: boolean;
  showErrorTip?: boolean;
}

export const ChunksDownloadContent = forwardRef(
  (props: ChunksDownloadContentProps, ref: Ref<ChunksDownload>): JSX.Element => {
    const { url, chunkSizeByte, showErrorTip = true, showSuccessTip = true } = props;

    const [progressState, setProgressState] = useState<ProgressState>({
      percent: 0,
      status: 'active',
      fileName: '准备下载...',
    });

    const updateState = useCallback((next: Partial<ProgressState>) => {
      setProgressState((prev) => ({ ...prev, ...next }));
    }, []);

    const chunksDownloadSingleton = useMemo(
      () =>
        new ChunksDownload({
          url,
          chunkSizeByte,
        }),
      [url, chunkSizeByte],
    );

    useImperativeHandle(ref, () => chunksDownloadSingleton, [chunksDownloadSingleton]);

    useEffect(() => {
      chunksDownloadSingleton.addListener('download-success', (data) => {
        if (showSuccessTip) {
          message.success('下载成功');
        }

        updateState({ percent: 100, status: 'success', fileName: data.fileName });
      });

      chunksDownloadSingleton.addListener('download-fail', (data) => {
        if (showSuccessTip) {
          message.error('下载失败，请稍后重试');
        }
        updateState({ percent: 100, status: 'error' });
        console.error('data', data);
      });

      chunksDownloadSingleton.addListener('chunk-progress', (data) => {
        updateState({ percent: data.percent, status: 'active', fileName: data.fileName || '准备下载...' });
      });
    }, [chunksDownloadSingleton, updateState, showErrorTip, showSuccessTip]);

    return (
      <div className={ptpFeChunksDownloadContentPrefix}>
        <div className={`${ptpFeChunksDownloadContentPrefix}-info`}>
          <Icon name="file-outlined" className={`${ptpFeChunksDownloadContentPrefix}-info-icon`} />
          <span className={`${ptpFeChunksDownloadContentPrefix}-info-text`}>
            <span>{progressState.fileName}</span>
          </span>
        </div>
        <DownloadProgress percent={progressState.percent} status={progressState.status} />
      </div>
    );
  },
);
