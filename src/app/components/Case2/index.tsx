/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import {useCallback, useEffect, useState} from 'react';

interface Case2State {
  loading: boolean;
  count: number;
}

const getCase2State = (): Promise<Case2State> => new Promise(r => {
  r({
    loading: true,
    count: 2,
  });
});

export const Case2 = (): JSX.Element => {
  const [val, setVal] = useState<Case2State>({
    loading: true,
    count: 0,
  });

  const updateVal = useCallback((part: Partial<Case2State>) => setVal(prev => ({ ...prev, ...part })), []);

  useEffect(() => {
    updateVal({
      loading: false,
    });
    getCase2State().then(res => {
      updateVal({
        count: res.count,
      });
    }).finally(() => {
      updateVal({
        count: 3,
        loading: true,
      });
    });
  }, []);

  return <div>{String(val.loading)}  {val.count}</div>;
};
