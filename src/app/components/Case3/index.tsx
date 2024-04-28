/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { useMemoizedFn } from 'ahooks';
import helMicro from '@tencent/hel-micro';

export const Case3 = (): JSX.Element => {
  const onClick = useMemoizedFn(async () => {
    // 点击
    const lib = await helMicro.preFetchLib('finance-fe-common');
    console.log('lib: ', lib);
  });

  return (
    <div onClick={onClick}>
      点击11
    </div>
  );
};
