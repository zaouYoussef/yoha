import React, { useState } from 'react';
import { Alert } from 'react-native';
import { RESTO_CANCEL_BEFORE } from '../../lib/constants';
import { YohaButton } from '../ui/YohaButton';

type Props = {
  label?: string;
  onCancel: (reason: string) => Promise<void>;
};

export function RestoCancelButton({ label = 'Annuler la commande', onCancel }: Props) {
  const [busy, setBusy] = useState(false);

  const open = () => {
    Alert.alert('Annuler la commande', 'Choisissez un motif', [
      ...RESTO_CANCEL_BEFORE.map((reason) => ({
        text: reason,
        onPress: async () => {
          setBusy(true);
          try {
            await onCancel(reason);
          } finally {
            setBusy(false);
          }
        },
      })),
      { text: 'Retour', style: 'cancel' },
    ]);
  };

  return (
    <YohaButton
      title={busy ? '…' : label}
      onPress={open}
      variant="ghost"
      size="md"
      style={{ marginTop: 8 }}
      textStyle={{ fontSize: 13, color: '#dc2626' }}
    />
  );
}
