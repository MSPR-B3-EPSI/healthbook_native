import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { cardShadow } from '@/lib/shadows';
import { DAY_LABELS, WEEK_ORDER, todayKey } from '../labels';
import type { ProgramDay } from '../types';

type WeekStripProps = {
  week: ProgramDay[];
};

/**
 * Bandeau L→D de la vue Semaine : pastille violette (séance) ou lune grise
 * (repos) sous chaque initiale de jour, jour courant souligné.
 */
export default function WeekStrip({ week }: WeekStripProps) {
  const byDay = new Map(week.map((d) => [d.day_of_week, d]));
  const today = todayKey();

  return (
    <View
      className="flex-row justify-between rounded-3xl bg-surface px-4 py-4"
      style={cardShadow}
    >
      {WEEK_ORDER.map((key) => {
        const day = byDay.get(key);
        const hasSession = Boolean(day && !day.is_recovery && day.sessions.length);
        const isToday = key === today;
        return (
          <View key={key} className="items-center gap-2">
            <Text
              className={`text-xs font-bold ${
                isToday ? 'text-coach' : 'text-text-muted'
              }`}
            >
              {DAY_LABELS[key].short}
            </Text>
            <View
              className={`h-9 w-9 items-center justify-center rounded-full ${
                hasSession ? 'bg-coach-light' : 'bg-background'
              }`}
            >
              <Ionicons
                name={hasSession ? 'barbell-outline' : 'moon-outline'}
                size={16}
                color={hasSession ? '#5B2EE5' : '#9AA0A6'}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
