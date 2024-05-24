/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { Button } from '@tencent/spaui';
import { useChunksDownloadDialog } from './components/ChunksDownloadDialog';

export const Case4 = (): JSX.Element => {
  const { dialogNode, setDownloadDialogOptions } = useChunksDownloadDialog();

  const onClick = (): void => {
    setDownloadDialogOptions({
      downloadConfig: {
        url: 'http://127.0.0.1:8181/demo/api/download/bigFile',
        // chunkSizeByte: 10,
        maxParallel: 1,
      },
    });
  };

  return (
    <div>
      {dialogNode}
      <Button displayType="primary" onClick={onClick}>
        分片下载
      </Button>
    </div>
  );
};
