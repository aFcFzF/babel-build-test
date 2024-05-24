/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import classnames from 'classnames';
import { Icon } from '@tencent/spaui';
import './style.less';

const clsPtpFeProgressPrefix = 'ptp-fe-progress';

export interface DownloadProgressProps {
  percent: string | number;
  status: 'active' | 'error' | 'success';
}

const getInfo = (option: Pick<DownloadProgressProps, 'status' | 'percent'>): JSX.Element => {
  const { status, percent } = option;

  if (status === 'active') {
    return <>{percent}%</>;
  }

  if (status === 'success') {
    return <Icon name="check-filled" size="small" />;
  }

  return <Icon name="close-filled" size="small" />;
};

export const DownloadProgress = (props: DownloadProgressProps): JSX.Element => {
  const { percent, status } = props;

  const statusCls = classnames({
    [`${clsPtpFeProgressPrefix}-info`]: true,
    [`${clsPtpFeProgressPrefix}-info-active`]: status === 'active',
  });

  return (
    <div className={classnames(clsPtpFeProgressPrefix, `${clsPtpFeProgressPrefix}-${status}`)}>
      <div className={`${clsPtpFeProgressPrefix}-content`}>
        <i className={`${clsPtpFeProgressPrefix}-content-inner`} style={{ width: `${percent}%` }} />
      </div>
      <div className={statusCls}>{getInfo({ status, percent })}</div>
    </div>
  );
};
