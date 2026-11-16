import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';
import { notifySafetyChanged } from '../lib/safetyEvents';

const reasons = [
  ['spam', 'Spam or unwanted advertising'], ['scam', 'Scam or misleading listing'],
  ['harassment', 'Harassment or bullying'], ['hate', 'Hate or discrimination'],
  ['sexual', 'Sexual content'], ['violence', 'Violence or threats'],
  ['child_safety', 'Child safety concern'], ['privacy', 'Privacy violation'], ['other', 'Something else'],
] as const;

type Props = {
  targetType?: 'post' | 'reel' | 'user';
  targetId?: string;
  authorId?: string;
  authorName?: string;
  color?: string;
  onBlocked?: () => void;
};

export default function SafetyActions({ targetType = 'user', targetId, authorId, authorName = 'this user', color, onBlocked }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState<'menu' | 'report' | 'block' | 'done' | null>(null);
  const [reportType, setReportType] = useState(targetType);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const ownerId = authorId || (targetType === 'user' ? targetId : undefined);
  if (!user || !ownerId || !/^[a-f\d]{24}$/i.test(ownerId) || ownerId === (user.id || user._id)) return null;

  const close = () => { if (!pending.current) { setStep(null); setError(''); } };
  const report = (type: typeof targetType) => {
    setReportType(type); setReason(''); setDetails(''); setError(''); setStep('report');
  };
  const submit = async () => {
    if (pending.current || (step === 'report' && !reason)) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (step === 'block') {
        await apiFetch(`/api/safety/blocks/${ownerId}`, { method: 'POST' });
        setStep(null);
        notifySafetyChanged();
        onBlocked?.();
      } else {
        await apiFetch('/api/safety/reports', { method: 'POST', body: JSON.stringify({
          targetType: reportType, targetId: reportType === 'user' ? ownerId : targetId, reason, details,
        }) });
        setStep('done');
      }
    } catch (failure: any) { setError(failure.message || 'Unable to complete this action. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  };
  const button = (label: string, onPress: () => void, danger = false, disabled = false) => (
    <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress}
      style={{ padding: 14, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: theme.outlineVariant, opacity: disabled ? 0.45 : 1 }}>
      <Text style={{ color: danger ? '#dc2626' : theme.onSurface, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Report or block ${authorName}`}
      hitSlop={8} onPress={() => { setError(''); setStep('menu'); }} style={{ padding: 8 }}>
      <MaterialIcons name="more-vert" size={24} color={color || theme.onSurface} />
    </Pressable>
    <Modal visible={step !== null} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 480, maxHeight: '85%', alignSelf: 'center', backgroundColor: theme.surfaceContainer, borderRadius: 18, padding: 20 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text accessibilityRole="header" style={{ color: theme.onSurface, fontSize: 20, fontWeight: '700', flex: 1 }}>
                {step === 'report' ? 'Report a concern' : step === 'block' ? `Block ${authorName}?` : step === 'done' ? 'Report received' : 'Community safety'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close safety menu" disabled={busy} onPress={close} style={{ padding: 8 }}>
                <MaterialIcons name="close" size={24} color={theme.onSurface} />
              </Pressable>
            </View>
            {step === 'menu' && <>
              {targetType !== 'user' && targetId && button(`Report this ${targetType}`, () => report(targetType))}
              {button('Report user', () => report('user'))}
              {button('Block user', () => setStep('block'), true)}
            </>}
            {step === 'report' && <>
              <Text style={{ color: theme.onSurfaceVariant, marginVertical: 10 }}>Choose the reason that best describes your concern. Your report is private to our moderation team.</Text>
              {reasons.map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: reason === value }}
                disabled={busy} onPress={() => setReason(value)} style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name={reason === value ? 'radio-button-checked' : 'radio-button-unchecked'} size={21} color={theme.primary} />
                <Text style={{ color: theme.onSurface, flex: 1 }}>{label}</Text>
              </Pressable>)}
              <TextInput accessibilityLabel="Additional report details (optional)" placeholder="Additional details (optional)" placeholderTextColor={theme.onSurfaceVariant}
                value={details} onChangeText={setDetails} editable={!busy} multiline maxLength={2000}
                style={{ minHeight: 85, color: theme.onSurface, borderColor: theme.outlineVariant, borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top' }} />
              {button('Submit report', submit, false, !reason)}
            </>}
            {step === 'block' && <>
              <Text style={{ color: theme.onSurfaceVariant, marginVertical: 16 }}>You will no longer see each other's profiles, posts, reels, or conversations while signed in. Neither of you can send the other new messages. Existing follows will be removed. You can unblock this user in Settings.</Text>
              {button('Block user', submit, true)}
              {button('Cancel', close)}
            </>}
            {step === 'done' && <>
              <Text style={{ color: theme.onSurfaceVariant, marginVertical: 16 }}>Thank you. Your report has been saved for review. You can also block this user to stop seeing their content and messages.</Text>
              {button('Block user', () => setStep('block'), true)}
              {button('Done', close)}
            </>}
            {busy && <ActivityIndicator style={{ marginTop: 14 }} color={theme.primary} />}
            {!!error && <Text accessibilityRole="alert" style={{ color: '#dc2626', marginTop: 14 }}>{error}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
