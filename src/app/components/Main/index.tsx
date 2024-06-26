/**
 * @file index.tsx
 * @author afcfzf(9301462@qq.com)
 */

import {useSetState} from 'ahooks';
import {FormView, FormViewProps} from '@tencent/ptp-fe-common';
import type UseForm from '@tencent/ptp-fe-common/es/components/FormView/hooks/useForm';
import '@tencent/ptp-fe-common/dist/ptp-fe-common.min.css';
import {useEffect, useRef} from 'react';
import { Button } from '@tencent/spaui';
import { hooks } from '@tencent/ptp-fe-common';

const { useDialog } = hooks;

const options: FormViewProps['options'] = ({payloads, customFunctions}) => {
  const { job, form } = payloads as any;
  const { updateState, setDialogOptions, setFormFieldValue } = customFunctions as any;

  console.log('job: ', job, updateState);

  return {
    submitConfig: {
      action: (form) => {
        console.log('form: ', form);
        return Promise.resolve({
          text: '表单结果',
          form,
        });
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
          preventDefaultChangeHandler: true,
          onChange(_: unknown, val: string) {
            setDialogOptions({
              type: 'dialog',
              body: '确认修改吗',
              config: {
                title: '确认？'
              },
              onSuccess() {
                setFormFieldValue?.({
                  'gender': val,
                });
              }
            });


            console.log(val)
          },
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
        // type: 'input',
        type: 'custom',
        content: () => <></>,
        label: '年龄',
        defaultValue: '111',
        required: true,
        config: {
          value: '111',
          placeholder: '请输入年龄',
          onChange(...args: any[]) {
            // 半受控
            console.log('=== onChange: ', args);
            updateState({job: false});
          }
        },
        extra: '请输入年龄 - extra',
        // display 通过job控制
        display: [{
          name: 'gender',
          value: 'male',
        }],
      }]
    }],
  };
};

export const Main = (): JSX.Element => {

  const [state, updateState] = useSetState({
    job: 'programmer',
  });

  const {Dialog, setDialogOptions} = useDialog();

  const formRef = useRef<{form: ReturnType<typeof UseForm>}>(null);

  console.log('formRef: ', formRef);

  useEffect(() => {
    formRef.current?.form.setFieldsValue({ });
    updateState({});
  }, []);

  const onSubmit = async () => {
    const validResult = await formRef.current?.form.validate();
    const res = await formRef.current?.form.onSubmit({});
    console.log('res: ', validResult, res);
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
        customFunctions={{updateState, setDialogOptions, setFormFieldValue: formRef.current?.form.setFieldsValue}}
        options={options}
      />
      {Dialog}
      <Button displayType="primary" onClick={onSubmit}>提交</Button>
    </>
  );
};
