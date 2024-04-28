/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { useEffect } from 'react';

export const Case4 = (): JSX.Element => {

  useEffect(() => {
    setTimeout(() => {
      console.log('======timeout执行了');
    }, 1000);
  }, []);

  return (
    <div>
      123
    </div>
  );
};
