import React from 'react';
import { View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
};

export default function Card({ children, className, ...rest }: CardProps) {
  const finalClassName = [
    'rounded-xl bg-surface border border-border p-4',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={finalClassName} {...rest}>
      {children}
    </View>
  );
}
