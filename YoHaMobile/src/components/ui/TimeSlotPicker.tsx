import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { brand, gradients, ink, radius, shadows } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  selected: string;
  onSelect: (iso: string) => void;
};

function generateSlots() {
  const cutoff = new Date(Date.now() + 45 * 60 * 1000);
  const roundM = cutoff.getMinutes() <= 30 ? 30 : 0;
  const roundH = cutoff.getMinutes() <= 30 ? cutoff.getHours() : cutoff.getHours() + 1;
  const ref = new Date(cutoff);
  ref.setHours(roundH, roundM, 0, 0);

  const slots: { range: string; iso: string }[] = [];
  for (let i = 0; i < 48; i++) {
    const start = new Date(ref.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const sh = String(start.getHours()).padStart(2, '0');
    const sm = String(start.getMinutes()).padStart(2, '0');
    const eh = String(end.getHours()).padStart(2, '0');
    const em = String(end.getMinutes()).padStart(2, '0');
    slots.push({ range: `${sh}:${sm} → ${eh}:${em}`, iso: start.toISOString() });
  }
  return slots;
}

export function TimeSlotPicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const allSlots = useMemo(() => generateSlots(), []);
  const isScheduled = !!selected;

  const selectedRange = useMemo(() => {
    if (!isScheduled) return '';
    const s = allSlots.find((s) => s.iso === selected);
    return s ? s.range : '';
  }, [selected, isScheduled, allSlots]);

  return (
    <>
      <View style={styles.row}>
        <Pressable
          onPress={() => onSelect('')}
          style={[styles.pill, !isScheduled && styles.pillActive]}
        >
          <Text style={styles.emoji}>⚡</Text>
          <Text style={[styles.pillLabel, !isScheduled && styles.pillLabelActive]}>
            ASAP
          </Text>
          {!isScheduled && <View style={styles.check} />}
        </Pressable>

        <Pressable
          onPress={() => setOpen(true)}
          style={[styles.pill, isScheduled && styles.pillActive]}
        >
          <Text style={styles.emoji}>🕐</Text>
          <Text style={[styles.pillLabel, isScheduled && styles.pillLabelActive]}>
            {isScheduled ? selectedRange : 'Planifier'}
          </Text>
          {isScheduled ? <View style={styles.check} /> : null}
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Choisissez votre plage</Text>
          <Text style={styles.sub}>Tranches de 30 min disponibles</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {allSlots.map((s) => {
              const active = selected === s.iso;
              return (
                <Pressable
                  key={s.iso}
                  onPress={() => { onSelect(s.iso); setOpen(false); }}
                  style={[styles.item, active && styles.itemActive]}
                >
                  <View style={[styles.dot, active && styles.dotActive]}>
                    {active && <View style={styles.dotInner} />}
                  </View>
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                    {s.range}
                  </Text>
                  <Text style={styles.itemSub}>30 min</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: ink[200],
    ...shadows.soft,
  },
  pillActive: { borderColor: brand[400], backgroundColor: brand[50] },
  emoji: { fontSize: 16 },
  pillLabel: { fontFamily: fonts.semibold, fontSize: 13, color: ink[600] },
  pillLabelActive: { fontFamily: fonts.bold, color: brand[700] },
  check: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand[500] },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '65%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: ink[200],
    alignSelf: 'center', marginVertical: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], textAlign: 'center', marginTop: 4, marginBottom: 16 },
  list: { maxHeight: 380 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: ink[100],
  },
  itemActive: { borderColor: brand[400], backgroundColor: brand[50] },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: ink[300],
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  dotActive: { borderColor: brand[500] },
  dotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand[500] },
  itemLabel: { fontFamily: fonts.bold, fontSize: 16, color: ink[800], flex: 1 },
  itemLabelActive: { color: brand[700] },
  itemSub: { fontFamily: fonts.medium, fontSize: 12, color: ink[400] },
});
