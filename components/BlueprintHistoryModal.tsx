import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlueprintHistoryItem, SavedBlueprint, blueprintHistoryRequest } from '../lib/blueprintHistory';

type Props = { visible: boolean; token: string | null; onClose: () => void; onSelect: (plan: SavedBlueprint) => void };

export default function BlueprintHistoryModal({ visible, token, onClose, onSelect }: Props) {
  const { theme, isDark } = useTheme();
  const { height, width } = useWindowDimensions();
  const [plans, setPlans] = useState<BlueprintHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    if (!visible) return;
    setPlans([]);
    setOpeningId(null);
    setError(null);
    if (!token) { setError('Sign in to save and view your plan history.'); setLoading(false); return; }
    setLoading(true);
    blueprintHistoryRequest(token).then(data => {
      if (version === requestVersion.current) setPlans(Array.isArray(data.plans) ? data.plans : []);
    }).catch(err => {
      if (version === requestVersion.current) setError(err.message || 'History could not be loaded.');
    }).finally(() => {
      if (version === requestVersion.current) setLoading(false);
    });
    return () => { requestVersion.current++; };
  }, [visible, token, reload]);

  const openPlan = async (id: string) => {
    if (!token || openingId) return;
    const version = requestVersion.current;
    setOpeningId(id);
    setError(null);
    try {
      const { plan } = await blueprintHistoryRequest(token, `/${encodeURIComponent(id)}`);
      if (version !== requestVersion.current) return;
      if (!plan?.form || !plan?.mode || !(plan.plan2dUrl || plan.plan3dUrl || plan.plan2dSvg || plan.plan3dSvg)) {
        throw new Error('This saved plan is incomplete and could not be opened.');
      }
      onSelect(plan);
      onClose();
    } catch (err: any) {
      if (version === requestVersion.current) setError(err.message || 'This plan could not be opened.');
    } finally {
      if (version === requestVersion.current) setOpeningId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: isDark ? '#101B2C' : '#FFFFFF', maxHeight: height * 0.85, padding: width < 380 ? 16 : 24 }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.onSurface }]}>Your saved plans</Text>
              <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>Your 20 most recent designs</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close plan history" onPress={onClose} style={styles.iconButton}>
              <MaterialIcons name="close" size={22} color={theme.onSurfaceVariant} />
            </Pressable>
          </View>
          {error && <View style={[styles.error, { borderColor: theme.outlineVariant }]}>
            <Text accessibilityRole="alert" style={{ color: theme.onSurface, lineHeight: 21 }}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => setReload(n => n + 1)} style={styles.retry}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>}
          {loading ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 36 }} /> : (
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {plans.map(plan => (
                <Pressable key={plan._id} accessibilityRole="button" accessibilityLabel={`Open ${plan.form?.plotWidth} by ${plan.form?.plotDepth} plan`}
                  disabled={!!openingId} onPress={() => openPlan(plan._id)}
                  style={[styles.plan, { borderColor: theme.outlineVariant, backgroundColor: theme.surfaceContainerLowest, opacity: openingId && openingId !== plan._id ? 0.5 : 1 }]}>
                  <View style={styles.planTop}>
                    <MaterialIcons name="architecture" size={25} color={theme.primary} />
                    <Text style={[styles.planTitle, { color: theme.onSurface }]}>{plan.form?.plotWidth} × {plan.form?.plotDepth} {plan.form?.plotUnit === 'meters' ? 'm' : 'ft'}</Text>
                    {openingId === plan._id ? <ActivityIndicator color={theme.primary} /> : <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />}
                  </View>
                  <Text style={[styles.details, { color: theme.onSurfaceVariant }]}>{plan.form?.bedrooms} bedrooms · {plan.form?.stories} {plan.form?.stories === 1 ? 'floor' : 'floors'} · {plan.mode === 'both' ? '2D + 3D' : plan.mode.toUpperCase()}</Text>
                  <Text style={[styles.date, { color: theme.onSurfaceVariant }]}>{new Date(plan.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </Pressable>
              ))}
              {!error && !plans.length && <View style={styles.empty}>
                <MaterialIcons name="history" size={40} color={theme.primary} />
                <Text style={[styles.planTitle, { color: theme.onSurface }]}>Your ideas, saved here</Text>
                <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>Generate your first plan to start your history. Open a saved design here whenever you need it.</Text>
              </View>}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,12,24,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 560, borderRadius: 24, flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 6 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  plan: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planTitle: { fontSize: 16, fontWeight: '600', flexShrink: 1, flexGrow: 1 },
  details: { fontSize: 12, lineHeight: 20, marginTop: 10 },
  date: { fontSize: 11, lineHeight: 18, marginTop: 6 },
  empty: { alignItems: 'center', gap: 14, paddingVertical: 32 },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
  error: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  retry: { minHeight: 44, justifyContent: 'center' },
});
