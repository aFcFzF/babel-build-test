/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import {memo, useCallback, useEffect, useMemo, useState} from 'react';

interface ChildFcProps {
  uid_list: string[];
}

const ChildFc = (props: ChildFcProps): JSX.Element => {
  const { uid_list } = props;
  console.log('执行了', uid_list);

  const fn = useCallback(() => {
    console.log('请求', uid_list);
  }, [uid_list]);

  useEffect(() => {
    fn();
  }, [fn]);

  return (
    <>uid_list: {uid_list}</>
  );
};

interface Case1Props {
  uid: string;
}

export const Case1 = (props: Case1Props): JSX.Element => {
  const { uid } = props;

  const [input, setInput] = useState('');

  const uidList = useMemo(() => [uid], [uid]);

  return (
    <>
      <input style={{border: 'solid 1px'}} type="text" value={input} onInput={(e) => setInput(e.currentTarget.value)} />
      <ChildFc uid_list={uidList} />
    </>
  );
};
