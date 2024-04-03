/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import {useSetState} from 'ahooks';
import {FormView, FormViewProps} from '@tencent/ptp-fe-common';
import type UseForm from '@tencent/ptp-fe-common/es/components/FormView/hooks/useForm';
import '@tencent/ptp-fe-common/dist/ptp-fe-common.min.css';
import {useRef} from 'react';
import { Button } from '@tencent/spaui';

const options: FormViewProps['options'] = ({payloads, customFunctions}) => {
  const { job } = payloads as any;
  const { updateState } = customFunctions as any;

  console.log('job: ', job, updateState);

  return {
    submitConfig: {
      action: (...args) => {
        console.log('args: ', args);
        return Promise.resolve({name: '1111'});
      }
    },
    groups: [{
      controls: [{
        name: 'gender',
        type: 'button-group',
        label: '性别',
        defaultValue: 'male',
        required: true,
        config: {
          theme: 'light',
          data: [
            {label: '男', value: 'male'},
            {label: '女', value: 'female'},
          ]
        },
        extra: '表单type: button-group',
      },
      {
        name: 'age',
        type: 'input',
        label: '年龄',
        defaultValue: '',
        required: true,
        config: {
          placeholder: '请输入年龄',
        },
        extra: '请输入年龄 - extra',
        display: [{
          name: 'gender',
          value: 'male',
        }]
      }]
    }],
  };
};

export const Main = (): JSX.Element => {

  const [state, updateState] = useSetState({
    job: 'programmer',
  });

  const formRef = useRef<{form: ReturnType<typeof UseForm>}>(null);

  console.log('formRef: ', formRef);

  const onSubmit = async () => {
    const res = await formRef.current?.form.onSubmit({});
    console.log('res: ', res);
  };

  return (
    <>
      <FormView
        ref={formRef}
        formData={{
          gender: 'male',
          age: ''
        }}
        payloads={state}
        customFunctions={{updateState}}
        options={options}
      />
      <Button displayType="primary" onClick={onSubmit}>提交</Button>
    </>
  );
};
