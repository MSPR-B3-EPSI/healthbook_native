import React, { forwardRef } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type TextFieldProps = {
  label?: string;
  error?: string;
  className?: string;
} & TextInputProps;

const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, className, ...rest }, ref) => {
    const borderClassName = error ? 'border-danger' : 'border-border';

    return (
      <View className="mb-4">
        {label ? (
          <Text className="mb-1 text-sm font-medium text-text-secondary">
            {label}
          </Text>
        ) : null}

        <TextInput
          ref={ref}
          className={`rounded-lg border bg-input px-4 py-3 text-base text-text-primary ${borderClassName} ${
            className ?? ''
          }`}
          placeholderTextColor="#9AA0A6"
          {...rest}
        />

        {error ? (
          <Text className="mt-1 text-sm text-danger">{error}</Text>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
