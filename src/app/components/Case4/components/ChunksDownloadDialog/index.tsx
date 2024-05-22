/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { DialogOptions } from '@tencent/ptp-fe-common/cjs/components/Dialog/types';
import { useDialog } from '@tencent/ptp-fe-common/cjs/hooks';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { DownloadChunksOption } from '../../interface';
import { ChunksDownloadContent, ChunksDownloadContentProps } from '../ChunksDownloadContent';
import { ChunksDownload } from '../../model';

export interface SetDownloadDialogOptions extends Partial<DialogOptions> {
  downloadConfig: ChunksDownloadContentProps;
}

const DialogContent = (props: { payload: DownloadChunksOption }): JSX.Element => {
  const ref = useRef<ChunksDownload>(null);

  useEffect(() => {
    ref.current?.download();
  }, []);

  return <ChunksDownloadContent ref={ref} {...props.payload} />;
};

export interface UseChunksDownloadDialogRet {
  showDialog: () => void;
  hideDialog: () => void;
  dialogNode: ReactNode;
  setDownloadDialogOptions: (option: SetDownloadDialogOptions) => void;
}

export const useChunksDownloadDialog = (): UseChunksDownloadDialogRet => {
  const { Dialog: dialogNode, showDialog, hideDialog, setDialogOptions } = useDialog();

  const setDownloadDialogOptions = useCallback(
    (option: SetDownloadDialogOptions) => {
      setDialogOptions({
        body: DialogContent,
        payload: option.downloadConfig,
        ...option,
        config: {
          title: '文件下载',
          contentStyle: { width: 600, height: 220 },
          cancelButton: false,
          ...option.config,
        },
      });
    },
    [setDialogOptions],
  );

  return {
    dialogNode,
    showDialog,
    hideDialog,
    setDownloadDialogOptions,
  };
};
