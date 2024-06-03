/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import { Button, message, Input } from '@tencent/spaui';
import { useSetState } from 'ahooks';
import { ChangeEvent, memo, useMemo } from 'react';
import { Diff } from './model';
import { DiffCellData } from './interface';
import './style.less';
import classnames from 'classnames';
import { Table, TableColumnsType, Spin } from 'antd';

const Cell = (props: { cellData: DiffCellData }): JSX.Element => {
  const { cellData } = props;
  const cls = classnames({
    cell: true,
    'cell-diff': cellData?.diffType === 'diff',
    'cell-append': cellData?.diffType === 'target_append',
    'cell-delete': cellData?.diffType === 'origin_delete',
  });

  return <div className={cls}>{cellData?.value?.toString()}</div>;
};

const ViewDataRender = memo((props: { viewData: DiffCellData[][]; rowKey: string }): JSX.Element => {
  const { viewData, rowKey } = props;
  const { columns, dts } = useMemo(() => {
    const head = viewData[0] || [];
    const columns: TableColumnsType = head.map((item) => ({
      dataIndex: item.value?.toString(),
      title: item.value?.toString(),
      render(cellData) {
        return <Cell cellData={cellData} />;
      },
    }));

    const dts = viewData.slice(1).map((row) =>
      row.reduce(
        (all, item, idx) => ({
          ...all,
          [head[idx]?.value?.toString() || 'unknown']: item,
        }),
        {},
      ),
    );

    return {
      columns,
      dts,
    };
  }, [viewData]);

  if (!viewData.length) {
    return <div>内容为空</div>;
  }

  return (
    <Table
      pagination={false}
      className="table"
      key={rowKey}
      columns={columns}
      scroll={{ x: 300, y: 500 }}
      virtual
      dataSource={dts}
    />
  );

  // return <>太慢</>;

  return (
    <table className="table">
      <thead>
        <tr>
          {viewData[0].map((cellData) => (
            <Cell key={cellData.value?.toString()} cellData={cellData} />
          ))}
        </tr>
      </thead>
      <tbody>
        {viewData.slice(1).map((row) => (
          <tr>
            {row.map((cellData) => (
              <Cell key={cellData.value?.toString()} cellData={cellData} />
            ))}
          </tr>
        ))}
        <tr></tr>
      </tbody>
    </table>
  );
});

interface State {
  originFile: File | null;
  targetFile: File | null;
  rowKey: string;
  originViewData: DiffCellData[][];
  targetViewData: DiffCellData[][];
  loading: boolean;
}

export const Case5 = (): JSX.Element => {
  const [state, updateState] = useSetState<State>({
    originFile: null,
    targetFile: null,
    rowKey: 'csAdvertiserId',
    originViewData: [],
    targetViewData: [],
    loading: false,
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

  const onDiff = (state: State): void => {
    const { originFile, targetFile, rowKey } = state;
    if (!originFile || !targetFile) {
      message.error('请先选择源文件和目标文件');
      return;
    }

    const ins = new Diff();
    const start = Date.now();
    updateState({ loading: true });
    ins
      .diff(originFile, targetFile, rowKey)
      .then((res) => {
        updateState({
          originViewData: res.originViewData,
          targetViewData: res.targetViewData,
        });
        console.log((Date.now() - start) / 1000);
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        updateState({ loading: false });
      });
  };

  console.log('=== state: ', state);

  const diffView = state.originFile && state.targetFile && (
    <Spin spinning={state.loading}>
      <ViewDataRender viewData={state.originViewData} rowKey={state.rowKey} />
      <ViewDataRender viewData={state.targetViewData} rowKey={state.rowKey} />
    </Spin>
  );

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
      <li>{diffView}</li>
    </ul>
  );
};
