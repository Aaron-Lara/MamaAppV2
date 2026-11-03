// Formulario para registrar un abono de un cliente.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { PaymentFields } from '@/components/debts/payment-fields';
import { recordPayment } from '@/db/payments';
import { payAllAmount, validatePaymentAmount } from '@/lib/ledger-rows';
import { formatCents } from '@/lib/money';
import { centsToInputText } from '@/lib/money-input';
import { MAX_PAYMENT_CENTS } from '@/lib/payment-input';

type Props = {
  customerId: number;
  balanceCents: number;
  onChanged: () => Promise<void>;
  onFieldFocus?: () => void;
};

const INSUFFICIENT = 'El abono no puede ser mayor que lo que debe';
const SAVE_ERROR = 'No se pudo registrar el abono. Inténtalo de nuevo.';

function paymentErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (text.includes('mayor que lo que debe')) return INSUFFICIENT;
  if (text.includes('mayor a cero')) return 'El abono debe ser mayor a cero.';
  if (text.includes('no puede pasar de')) {
    return `El abono no puede pasar de ${formatCents(MAX_PAYMENT_CENTS)}.`;
  }
  if (text.includes('no existe')) return 'El cliente del abono no existe.';
  return SAVE_ERROR;
}

export function PaymentForm({ customerId, balanceCents, onChanged, onFieldFocus }: Props) {
  const db = useSQLiteContext();
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const savingRef = useRef(false);
  const confirmingRef = useRef(false);
  const payAll = payAllAmount(balanceCents);

  const savePayment = useCallback(
    async (amountCents: number) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        await recordPayment(db, { customerId, amountCents, note });
        setAmountText('');
        setNote('');
        await onChanged();
      } catch (caught) {
        const message = paymentErrorMessage(caught);
        setError(message);
        if (message === INSUFFICIENT) {
          await onChanged();
        }
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [db, customerId, note, onChanged]
  );

  const handleSubmit = useCallback(() => {
    if (savingRef.current || confirmingRef.current) return;
    const result = validatePaymentAmount(amountText, balanceCents);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);

    if (result.amountCents === balanceCents) {
      const closeConfirm = () => {
        confirmingRef.current = false;
        setConfirming(false);
      };
      confirmingRef.current = true;
      setConfirming(true);
      Alert.alert(
        'Confirmar abono',
        'Este abono salda toda la deuda. ¿Confirmas?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: closeConfirm },
          {
            text: 'Confirmar',
            onPress: () => {
              closeConfirm();
              void savePayment(result.amountCents);
            },
          },
        ],
        { cancelable: true, onDismiss: closeConfirm }
      );
      return;
    }

    void savePayment(result.amountCents);
  }, [amountText, balanceCents, savePayment]);

  const handlePayAll = useCallback(() => {
    if (payAll === null) {
      setError(
        `Abona en partes: el máximo por abono es ${formatCents(MAX_PAYMENT_CENTS)}`
      );
      return;
    }
    setAmountText(centsToInputText(payAll));
    setError(null);
  }, [payAll]);

  return (
    <PaymentFields
      amountText={amountText}
      onAmountChange={(text) => {
        setAmountText(text);
        setError(null);
      }}
      onAmountFocus={onFieldFocus}
      note={note}
      onNoteChange={setNote}
      onNoteFocus={onFieldFocus}
      error={error}
      saving={saving}
      confirming={confirming}
      balanceCents={balanceCents}
      onPayAll={handlePayAll}
      onSubmit={handleSubmit}
    />
  );
}
