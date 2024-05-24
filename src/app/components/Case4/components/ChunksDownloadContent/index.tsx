/**
 * @file ChunksDownload.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { Ref, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { ChunksDownloadRet, DownloadChunksOption } from '../../interface';
import { ChunksDownload } from '../../model';
import { Icon, message } from '@tencent/spaui';
import { DownloadProgress, DownloadProgressProps } from '../DownloadProgress';
import { useMemoizedFn } from 'ahooks';
import './style.less';

const ptpFeChunksDownloadContentPrefix = 'ptp-fe-chunks-download-content';

interface ProgressState extends DownloadProgressProps {
  fileName: string;
}

export interface ChunksDownloadContentProps extends DownloadChunksOption {
  showSuccessTip?: boolean;
  showErrorTip?: boolean;
  onDownloadChange?: (ret: ChunksDownloadRet) => void;
  onDialogClose?: () => void;
}

export const ChunksDownloadContent = forwardRef(
  (props: ChunksDownloadContentProps, ref: Ref<ChunksDownload>): JSX.Element => {
    const { showErrorTip = false, showSuccessTip = false, onDownloadChange, onDialogClose, ...extra } = props;

    const onDownloadChangeHandler = useMemoizedFn((data) => onDownloadChange?.(data));

    const [progressState, setProgressState] = useState<ProgressState>({
      percent: 0,
      status: 'active',
      fileName: '准备下载...',
    });

    const updateState = useCallback((next: Partial<ProgressState>) => {
      setProgressState((prev) => ({ ...prev, ...next }));
    }, []);

    const chunksDownloadSingleton = useMemo(() => new ChunksDownload(), []);

    useEffect(() => {
      chunksDownloadSingleton.updateOption(extra);
    }, [chunksDownloadSingleton, extra]);

    useImperativeHandle(ref, () => chunksDownloadSingleton, [chunksDownloadSingleton]);

    useEffect(() => {
      const success = (data: ChunksDownloadRet): void => {
        onDownloadChangeHandler?.(data);
        if (showSuccessTip) {
          message.success('下载成功');
        }

        updateState({ percent: 100, status: 'success', fileName: data.fileName });
      };

      const fail = (data: ChunksDownloadRet): void => {
        onDownloadChangeHandler?.(data);
        if (showSuccessTip) {
          message.error('下载失败，请稍后重试');
        }
        updateState({ status: 'error', fileName: '下载失败，请稍后重试' });
        console.error('data', data);
      };

      const progress = (data: ChunksDownloadRet): void => {
        onDownloadChangeHandler?.(data);
        updateState({ percent: data.percent, status: 'active', fileName: data.fileName || '准备下载...' });
      };

      chunksDownloadSingleton.addListener('download-success', success);
      chunksDownloadSingleton.addListener('download-fail', fail);
      chunksDownloadSingleton.addListener('chunk-progress', progress);
      console.log('绑定了');

      return () => {
        chunksDownloadSingleton.removeListener('download-success', success);
        chunksDownloadSingleton.removeListener('download-fail', fail);
        chunksDownloadSingleton.removeListener('chunk-progress', progress);
      };
    }, [chunksDownloadSingleton, updateState, showErrorTip, showSuccessTip, onDownloadChangeHandler]);

    return (
      <div className={ptpFeChunksDownloadContentPrefix}>
        <header className={`${ptpFeChunksDownloadContentPrefix}-header`}>
          <Icon
            name="close-medium-outlined"
            size="small"
            className={`${ptpFeChunksDownloadContentPrefix}-header-close`}
            onClick={() => {
              chunksDownloadSingleton.terminate();
              onDialogClose?.();
            }}
          />
        </header>
        <div className={`${ptpFeChunksDownloadContentPrefix}-info`}>
          <Icon
            name="file-outlined"
            size="large"
            style={{ width: 14, height: 14 }}
            className={`${ptpFeChunksDownloadContentPrefix}-info-icon`}
          />
          <span className={`${ptpFeChunksDownloadContentPrefix}-info-text`}>
            <span>{progressState.fileName}</span>
            {/* {progressState.status === 'error' && (
              <Button displayType="link" size="small" className={`${ptpFeChunksDownloadContentPrefix}-info-text-retry`}>
                重试
              </Button>
            )} */}
          </span>
        </div>
        <DownloadProgress percent={progressState.percent} status={progressState.status} />
        {/* {progressState.status === 'active' && <span>220Mb of 460Mb - 剩余时间 00:00:03</span>} */}
      </div>
    );
  },
);
