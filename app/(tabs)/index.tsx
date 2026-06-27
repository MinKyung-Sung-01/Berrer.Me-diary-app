import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  DiaryEntry,
  deleteEntry,
  formatDate,
  generateId,
  loadEntries,
  todayString,
} from "@/lib/diary-storage";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEntries().then(setEntries);
    }, [])
  );

  // 검색 필터링
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      // 날짜 검색
      const { full } = formatDate(entry.date);
      if (full.includes(q) || entry.date.includes(q)) return true;
      // 항목 내용 및 카테고리 검색
      if (entry.items.some((item) =>
        item.content.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )) return true;
      // 메타인지 질문 답변 검색
      if (entry.metacognitiveAnswers?.some((ans) =>
        ans.toLowerCase().includes(q)
      )) return true;
      return false;
    });
  }, [entries, searchQuery]);

  const handleNewDiary = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = generateId();
    router.push({ pathname: "/diary/edit" as any, params: { id, date: todayString() } });
  };

  const handleOpenEntry = (entry: DiaryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/diary/view" as any, params: { id: entry.id } });
  };

  const handleDeleteEntry = async (id: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSearchToggle = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery("");
    } else {
      setIsSearching(true);
    }
  };

  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const { full, weekday } = formatDate(item.date);
    const isToday = item.date === todayString();

    return (
      <Pressable
        onPress={() => handleOpenEntry(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {/* Date row */}
        <View style={styles.cardHeader}>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {full}
            </Text>
            <View style={[styles.weekdayBadge, { backgroundColor: isToday ? colors.primary : colors.border }]}>
              <Text style={[styles.weekdayText, { color: isToday ? "#fff" : colors.muted }]}>
                {isToday ? "오늘" : `${weekday}요일`}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            {item.weather ? <Text style={styles.emoji}>{item.weather}</Text> : null}
            {item.mood ? <Text style={styles.emoji}>{item.mood}</Text> : null}
          </View>
        </View>

        {/* Items preview */}
        {item.items.length > 0 ? (
          <View style={styles.itemsPreview}>
            {item.items.slice(0, 3).map((di) => (
              <View key={di.id} style={styles.previewItem}>
                <Text style={styles.previewEmoji}>{di.categoryEmoji}</Text>
                <Text
                  style={[styles.previewText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {di.content}
                </Text>
              </View>
            ))}
            {item.items.length > 3 && (
              <Text style={[styles.moreText, { color: colors.muted }]}>
                +{item.items.length - 3}개 더
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.emptyItemsText, { color: colors.muted }]}>
            아직 기록된 항목이 없어요
          </Text>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.itemCount, { color: colors.muted }]}>
            {item.items.length}개 항목
          </Text>
          <Pressable
            onPress={() => handleDeleteEntry(item.id)}
            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <IconSymbol name="trash" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Berrer.Me</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {entries.length}개의 일기
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleSearchToggle}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: isSearching ? colors.primary : colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconSymbol
              name={isSearching ? "xmark" : "magnifyingglass"}
              size={20}
              color={isSearching ? "#fff" : colors.foreground}
            />
          </Pressable>
          <Pressable
            onPress={handleNewDiary}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <IconSymbol name="plus" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      {isSearching && (
        <View style={[styles.searchBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="일기 내용, 카테고리, 날짜 검색..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== "ios" && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
              hitSlop={8}
            >
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          {isSearching && searchQuery.length > 0 ? (
            <>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                검색 결과가 없어요
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                "{searchQuery}"에 해당하는 일기를 찾지 못했어요
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                아직 일기가 없어요
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                오늘 있었던 일들을 기록해 보세요
              </Text>
              <Pressable
                onPress={handleNewDiary}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={styles.emptyBtnText}>첫 일기 쓰기</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isSearching && searchQuery.length > 0 ? (
              <Text style={[styles.searchResultCount, { color: colors.muted }]}>
                {filteredEntries.length}개의 일기를 찾았어요
              </Text>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  headerSub: { fontSize: 13 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C69",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  searchResultCount: {
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dateBlock: { gap: 4 },
  dateText: { fontSize: 15, fontWeight: "600" },
  weekdayBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  weekdayText: { fontSize: 11, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 4 },
  emoji: { fontSize: 20 },
  itemsPreview: { gap: 6 },
  previewItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewEmoji: { fontSize: 16, width: 22 },
  previewText: { fontSize: 14, flex: 1, lineHeight: 20 },
  moreText: { fontSize: 12, marginTop: 2 },
  emptyItemsText: { fontSize: 13, fontStyle: "italic" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  itemCount: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
