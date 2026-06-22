import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  CATEGORIES,
  DiaryEntry,
  deleteEntry,
  formatDate,
  getEntry,
} from "@/lib/diary-storage";

export default function ViewDiaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        getEntry(id).then(setEntry);
      }
    }, [id])
  );

  if (!entry) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>불러오는 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const { full, weekday } = formatDate(entry.date);

  const handleEdit = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/diary/edit", params: { id: entry.id, date: entry.date } });
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Alert.alert("일기 삭제", "이 일기를 삭제하시겠어요?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await deleteEntry(entry.id);
            router.back();
          },
        },
      ]);
    } else {
      deleteEntry(entry.id).then(() => router.back());
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={8}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDate, { color: colors.foreground }]}>{full}</Text>
          <Text style={[styles.headerWeekday, { color: colors.muted }]}>{weekday}요일</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <IconSymbol name="pencil" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <IconSymbol name="trash" size={22} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={entry.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Weather & Mood */}
            {(entry.weather || entry.mood) && (
              <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {entry.weather && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaEmoji}>{entry.weather}</Text>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>날씨</Text>
                  </View>
                )}
                {entry.mood && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaEmoji}>{entry.mood}</Text>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>기분</Text>
                  </View>
                )}
              </View>
            )}

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>오늘의 기록</Text>
              <Text style={[styles.sectionCount, { color: colors.muted }]}>{entry.items.length}개</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              기록된 항목이 없어요{"\n"}편집 버튼을 눌러 항목을 추가해 보세요
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const catColor = CATEGORIES.find((c) => c.name === item.category)?.color ?? colors.primary;
          return (
            <View
              style={[
                styles.itemCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.itemAccent, { backgroundColor: catColor }]} />
              <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemEmoji}>{item.categoryEmoji}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: catColor + "22" }]}>
                    <Text style={[styles.categoryText, { color: catColor }]}>{item.category}</Text>
                  </View>
                  {item.time && (
                    <Text style={[styles.timeText, { color: colors.muted }]}>{item.time}</Text>
                  )}
                </View>
                <Text style={[styles.itemContent, { color: colors.foreground }]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />

      {/* Edit FAB */}
      <Pressable
        onPress={handleEdit}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
      >
        <IconSymbol name="pencil" size={22} color="#fff" />
        <Text style={styles.fabText}>편집</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  iconBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerDate: { fontSize: 16, fontWeight: "700" },
  headerWeekday: { fontSize: 12 },
  headerActions: { flexDirection: "row", gap: 8 },
  listContent: { padding: 16, gap: 10 },
  metaCard: {
    flexDirection: "row",
    gap: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  metaItem: { alignItems: "center", gap: 4 },
  metaEmoji: { fontSize: 28 },
  metaLabel: { fontSize: 11, fontWeight: "500" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionCount: { fontSize: 12 },
  emptyContainer: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  itemCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemAccent: { width: 4, alignSelf: "stretch" },
  itemBody: { flex: 1, padding: 14, gap: 8 },
  itemTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemEmoji: { fontSize: 18 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: { fontSize: 11, fontWeight: "600" },
  timeText: { fontSize: 12, marginLeft: "auto" },
  itemContent: { fontSize: 15, lineHeight: 22 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#FF8C69",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
