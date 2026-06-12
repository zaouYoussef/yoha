import React from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  OPENING_DAY_KEYS,
  OPENING_DAY_LABELS,
  type DayHours,
  type OpeningHoursMap,
} from '../../lib/openingHours';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  value: OpeningHoursMap;
  onChange: (next: OpeningHoursMap) => void;
  disabled?: boolean;
};

export function RestoOpeningHoursEditor({ value, onChange, disabled = false }: Props) {
  const setDay = (day: string, patch: Partial<DayHours>) => {
    onChange({
      ...value,
      [day]: { ...value[day], ...patch },
    });
  };

  return (
    <View style={styles.wrap}>
      {OPENING_DAY_KEYS.map((day) => {
        const slot = value[day];
        const is24h = slot.is_24h || (!slot.is_closed && slot.open === slot.close);
        return (
          <View key={day} style={styles.row}>
            <Text style={styles.day}>{OPENING_DAY_LABELS[day]}</Text>
            <View style={styles.controls}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Fermé</Text>
                <Switch
                  value={slot.is_closed}
                  onValueChange={(is_closed) => setDay(day, {
                    is_closed,
                    is_24h: is_closed ? false : slot.is_24h,
                  })}
                  disabled={disabled}
                  trackColor={{ false: ink[200], true: brand[300] }}
                  thumbColor={slot.is_closed ? brand[600] : '#fff'}
                />
              </View>
              {!slot.is_closed ? (
                <>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>24h/24</Text>
                    <Switch
                      value={is24h}
                      onValueChange={(checked) => setDay(day, checked
                        ? { is_24h: true, open: '00:00', close: '00:00', is_closed: false }
                        : { is_24h: false, open: '10:00', close: '23:00' })}
                      disabled={disabled}
                      trackColor={{ false: ink[200], true: '#86efac' }}
                      thumbColor={is24h ? '#059669' : '#fff'}
                    />
                  </View>
                  {!is24h ? (
                    <View style={styles.times}>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Ouverture</Text>
                        <TextInput
                          value={slot.open}
                          onChangeText={(open) => setDay(day, { open, is_24h: false })}
                          editable={!disabled}
                          placeholder="10:00"
                          maxLength={5}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Fermeture</Text>
                        <TextInput
                          value={slot.close}
                          onChangeText={(close) => setDay(day, { close, is_24h: false })}
                          editable={!disabled}
                          placeholder="23:00"
                          maxLength={5}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={styles.input}
                        />
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.allDay}>Ouvert toute la journée</Text>
                  )}
                </>
              ) : (
                <Text style={styles.restDay}>Journée de repos</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ink[100],
  },
  day: { fontFamily: fonts.bold, fontSize: 15, color: ink[800], marginBottom: 8 },
  controls: { gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontFamily: fonts.medium, fontSize: 14, color: ink[600] },
  times: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 11, fontFamily: fonts.semibold, color: ink[400], marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: ink[200],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: ink[900],
    backgroundColor: '#fff',
  },
  allDay: { fontFamily: fonts.semibold, fontSize: 13, color: '#059669' },
  restDay: { fontFamily: fonts.medium, fontSize: 13, color: ink[400], fontStyle: 'italic' },
});
