/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { Button, message, Input } from '@tencent/spaui';
import { useSetState } from 'ahooks';
import { ChangeEvent } from 'react';
import { Diff } from './model';

interface State {
  originFile: File | null;
  targetFile: File | null;
  rowKey: string;
}

const onDiff = (state: State): void => {
  const { originFile, targetFile, rowKey } = state;
  if (!originFile || !targetFile) {
    message.error('请先选择源文件和目标文件');
    return;
  }

  const ins = new Diff();
  ins.diff(originFile, targetFile, rowKey);
};

export const Case5 = (): JSX.Element => {
  const [state, updateState] = useSetState<State>({
    originFile: null,
    targetFile: null,
    rowKey: '',
  });

  const onFileChange = (fileType: 'origin' | 'target', file?: File): void => {
    if (fileType === 'origin' && file) {
      updateState({
        originFile: file,
      });
    }

    if (fileType === 'target' && file) {
      updateState({
        targetFile: file,
      });
    }
  };

  console.log('=== state: ', state);

  return (
    <ul style={{ padding: 12 }}>
      <li>
        源文件:
        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFileChange('origin', e.target.files?.[0])}
        />
      </li>
      <li>
        对比文件:
        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFileChange('target', e.target.files?.[0])}
        />
      </li>
      <li>
        行主键:
        <Input type="text" value={state.rowKey} onChange={(_, text) => updateState({ rowKey: text })} />
      </li>
      <li style={{ marginTop: 24 }}>
        <Button disabled={!state.originFile || !state.targetFile} displayType="primary" onClick={() => onDiff(state)}>
          对比
        </Button>
      </li>
    </ul>
  );
};
