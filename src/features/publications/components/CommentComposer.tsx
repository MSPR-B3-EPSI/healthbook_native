import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { IconButton } from '@/components';

type CommentComposerProps = {
  onSubmit: (content: string) => void;
  submitting?: boolean;
};

export default function CommentComposer({
  onSubmit,
  submitting,
}: CommentComposerProps) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !submitting;

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue('');
  };

  return (
    <View className="flex-row items-end border-t border-border bg-surface px-4 py-2">
      <TextInput
        className="max-h-28 flex-1 rounded-2xl bg-input px-4 py-2.5 text-base text-text-primary"
        placeholder="Ajouter un commentaire…"
        placeholderTextColor="#9AA0A6"
        value={value}
        onChangeText={setValue}
        multiline
      />
      <View className="ml-2 pb-1" style={canSend ? null : { opacity: 0.4 }}>
        <IconButton
          name="send"
          onPress={send}
          color="#FC5200"
          accessibilityLabel="Envoyer le commentaire"
        />
      </View>
    </View>
  );
}
