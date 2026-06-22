import { useCallback, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  DiaryEntry,
  formatDate,
  generateId,
  loadEntries,
  todayString,
} from "@/lib/diary-storage";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const today = todayString();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEntries().then(setEntries);
    }, [])
  );

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const entryMap = new Map<string, DiaryEntry>();
  entries.forEach((e) => entryMap.set(e.date, e));

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handlePrevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const handleDayPress = (day: number) => {
    const dateStr = getDateStr(day);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  const handleNewDiary = (dateStr: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = generateId();
    router.push({ pathname: "/diary/edit", params: { id, date: dateStr } });
  };

  const handleOpenEntry = (entry: DiaryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/diary/view", params: { id: entry.id } });
  };

  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : undefined;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>달력</Text>
      </View>

      {/* Month navigation */}
      <View style={[styles.monthNav, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handlePrevMonth}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={12}
        >
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.foreground }]}>
          {year}년 {MONTH_NAMES[month]}
        </Text>
        <Pressable
          onPress={handleNextMonth}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={12}
        >
          <IconSymbol name="chevron.right" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.weekdayLabel,
              { color: i === 0 ? "#E74C3C" : i === 6 ? "#3498DB" : colors.muted },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.dayCell} />;
          const dateStr = getDateStr(day);
          const hasEntry = entryMap.has(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;
          const isSunday = idx % 7 === 0;
          const isSaturday = idx % 7 === 6;

          return (
            <Pressable
              key={dateStr}
              onPress={() => handleDayPress(day)}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && { backgroundColor: colors.primary + "22", borderRadius: 10 },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.dayInner,
                  isToday && { backgroundColor: colors.primary, borderRadius: 18 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isToday
                        ? "#fff"
                        : isSunday
                        ? "#E74C3C"
                        : isSaturday
                        ? "#3498DB"
                        : colors.foreground,
                      fontWeight: isToday ? "700" : "400",
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
              {hasEntry && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isToday ? "#fff" : colors.primary },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected date panel */}
      {selectedDate && (
        <View style={[styles.selectedPanel, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedDateText, { color: colors.foreground }]}>
              {formatDate(selectedDate).full} ({formatDate(selectedDate).weekday}요일)
            </Text>
            {!selectedEntry && (
              <Pressable
                onPress={() => handleNewDiary(selectedDate)}
                style={({ pressed }) => [
                  styles.newBtn,
                  { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <IconSymbol name="plus" size={14} color="#fff" />
                <Text style={styles.newBtnText}>일기 쓰기</Text>
              </Pressable>
            )}
          </View>

          {selectedEntry ? (
            <Pressable
              onPress={() => handleOpenEntry(selectedEntry)}
              style={({ pressed }) => [
                styles.entryPreview,
                { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.entryPreviewTop}>
                <View style={styles.entryMetaRow}>
                  {selectedEntry.weather && <Text style={styles.metaEmoji}>{selectedEntry.weather}</Text>}
                  {selectedEntry.mood && <Text style={styles.metaEmoji}>{selectedEntry.mood}</Text>}
                </View>
                <Text style={[styles.entryItemCount, { color: colors.muted }]}>
                  {selectedEntry.items.length}개 항목
                </Text>
              </View>
              {selectedEntry.items.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.previewItem}>
                  <Text style={styles.previewEmoji}>{item.categoryEmoji}</Text>
                  <Text style={[styles.previewText, { color: colors.foreground }]} numberOfLines={1}>
                    {item.content}
                  </Text>
                </View>
              ))}
              {selectedEntry.items.length > 2 && (
                <Text style={[styles.moreText, { color: colors.muted }]}>
                  +{selectedEntry.items.length - 2}개 더 보기
                </Text>
              )}
            </Pressable>
          ) : (
            <Text style={[styles.noEntryText, { color: colors.muted }]}>
              이 날의 일기가 없어요
            </Text>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 18, fontWeight: "700" },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  dayCell: {
    width: Math.floor((Dimensions.get("window").width - 16) / 7),
    height: Math.floor((Dimensions.get("window").width - 16) / 7),
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayInner: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14, lineHeight: 20 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 1,
  },
  selectedPanel: {
    flex: 1,
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedDateText: { fontSize: 15, fontWeight: "600" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  newBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  entryPreview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  entryPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryMetaRow: { flexDirection: "row", gap: 4 },
  metaEmoji: { fontSize: 18 },
  entryItemCount: { fontSize: 12 },
  previewItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewEmoji: { fontSize: 15 },
  previewText: { fontSize: 14, flex: 1, lineHeight: 20 },
  moreText: { fontSize: 12 },
  noEntryText: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
});
