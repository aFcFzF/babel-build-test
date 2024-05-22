/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { useEffect } from 'react';
import axios from 'axios';
import { Button } from '@tencent/spaui';
import { useMemoizedFn } from 'ahooks';
import {downloadChunks} from './util';

export const Case4 = (): JSX.Element => {
  const downloadHandler = useMemoizedFn(async () => {
    downloadChunks({
      url: 'http://127.0.0.1:8181/demo/api/download/bigFile',
    });
  });

  return (
    <div>
      <Button displayType="primary" onClick={downloadHandler}>
        分片下载
      </Button>
    </div>
  );
};
