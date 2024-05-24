/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { DialogOptions } from '@tencent/ptp-fe-common/cjs/components/Dialog/types';
import { useDialog } from '@tencent/ptp-fe-common/cjs/hooks';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { ChunksDownloadRet, DownloadChunksOption } from '../../interface';
import { ChunksDownloadContent, ChunksDownloadContentProps } from '../ChunksDownloadContent';
import { ChunksDownload } from '../../model';

export interface SetDownloadDialogOptions extends Partial<DialogOptions> {
  downloadConfig: ChunksDownloadContentProps;
}

const DialogContent = (props: { payload: DownloadChunksOption & { hideDialog: () => void } }): JSX.Element => {
  const {
    payload: { hideDialog },
  } = props;

  const ref = useRef<ChunksDownload>(null);

  useEffect(() => {
    ref?.current?.download();
  }, [ref]);

  const onDownloadChange = (data: ChunksDownloadRet): void => {
    if (data.status === 'download-success') {
      hideDialog();
    }
  };

  return (
    <ChunksDownloadContent
      ref={ref}
      {...props.payload}
      onDownloadChange={onDownloadChange}
      onDialogClose={hideDialog}
    />
  );
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
        payload: {
          ...option.downloadConfig,
          hideDialog,
        },
        ...option,
        config: {
          title: '文件下载',
          bodyStyle: {
            paddingTop: 16,
          },
          contentStyle: { width: 600 },
          cancelButton: false,
          submitButton: false,
          closeButton: false,
          hideFooter: true,
          hideHeader: true,
          ...option.config,
        },
      });
    },
    [setDialogOptions, hideDialog],
  );

  return {
    dialogNode,
    showDialog,
    hideDialog,
    setDownloadDialogOptions,
  };
};
