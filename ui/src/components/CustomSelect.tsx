import Select, { components } from 'react-select';
import type { Props as SelectProps } from 'react-select';

interface CustomSelectProps<T> extends SelectProps<T, true> {
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

const CustomInput = (props: any) => {
  return (
    <components.Input
      {...props}
      onPaste={(e) => {
        if (props.selectProps?.onPaste) {
          props.selectProps.onPaste(e);
        }
      }}
    />
  );
};

export const CustomSelect = <T,>(props: CustomSelectProps<T>) => {
  return (
    <Select
      {...props}
      components={{
        Input: CustomInput,
        ...props.components,
      }}
    />
  );
};
