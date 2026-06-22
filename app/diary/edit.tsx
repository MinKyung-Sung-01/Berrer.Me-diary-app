import { useState, useCallback } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  CATEGORIES,
  DiaryEntry,
  DiaryItem,
  MOOD_OPTIONS,
  WEATHER_OPTIONS,
  formatDate,
  generateId,
  getEntry,
  todayString,
  upsertEntry,
} from "@/lib/diary-storage";
import { getTodaysQuestion, getNextQuestion } from "@/lib/metacognitive-questions";

export default function EditDiaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; date: string }>();

  const [date, setDate] = useState(params.date ?? todayString());
  const [weather, setWeather] = useState<string | undefined>();
  const [mood, setMood] = useState<string | undefined>();
  const [items, setItems] = useState<DiaryItem[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DiaryItem | null>(null);
  const [modalCategory, setModalCategory] = useState(CATEGORIES[0]);
  const [modalContent, setModalContent] = useState("");
  const [modalTime, setModalTime] = useState("");

  // 메타인지 질문 state
  const [todaysQuestion, setTodaysQuestion] = useState<string>("");
  const [questionAnswer, setQuestionAnswer] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      // 메타인지 질문 로드
      const question = getTodaysQuestion(date);
      setTodaysQuestion(question);

      if (params.id) {
        getEntry(params.id).then((entry) => {
          if (entry) {
            setDate(entry.date);
            setWeather(entry.weather);
            setMood(entry.mood);
            setItems(entry.items);
            setQuestionAnswer(entry.metacognitiveAnswers?.[0] ?? "");
          }
        });
      } else {
        setQuestionAnswer("");
      }
    }, [date, params.id])
  );

  const { full, weekday } = formatDate(date);
  const isToday = date === todayString();
  const weekdayLabel = isToday ? "오늘" : `${weekday}요일`;

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry: DiaryEntry = {
      id: params.id ?? generateId(),
      date,
      weather,
      mood,
      items,
      metacognitiveAnswers: questionAnswer.trim() ? [questionAnswer] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await upsertEntry(entry);
    router.back();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setModalCategory(CATEGORIES[0]);
    setModalContent("");
    setModalTime("");
    setModalVisible(true);
  };

  const openEditModal = (item: DiaryItem) => {
    setEditingItem(item);
    const cat = CATEGORIES.find((c) => c.name === item.category) ?? CATEGORIES[0];
    setModalCategory(cat);
    setModalContent(item.content);
    setModalTime(item.time ?? "");
    setModalVisible(true);
  };

  const handleModalConfirm = () => {
    if (!modalContent.trim()) return;
    if (editingItem) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                category: modalCategory.name,
                categoryEmoji: modalCategory.emoji,
                content: modalContent.trim(),
                time: modalTime.trim() || undefined,
              }
            : it
        )
      );
    } else {
      const newItem: DiaryItem = {
        id: generateId(),
        category: modalCategory.name,
        categoryEmoji: modalCategory.emoji,
        content: modalContent.trim(),
        time: modalTime.trim() || undefined,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setModalVisible(false);
  };

  const handleDeleteItem = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const renderItem = ({ item, index }: { item: DiaryItem; index: number }) => (
    <View
      style={[
        styles.itemRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.itemAccent, { backgroundColor: CATEGORIES.find((c) => c.name === item.category)?.color ?? colors.primary }]} />
      <Pressable
        style={styles.itemContent}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.itemTop}>
          <Text style={styles.itemEmoji}>{item.categoryEmoji}</Text>
          <Text style={[styles.itemCategory, { color: colors.muted }]}>{item.category}</Text>
          {item.time ? (
            <Text style={[styles.itemTime, { color: colors.muted }]}>{item.time}</Text>
          ) : null}
        </View>
        <Text style={[styles.itemText, { color: colors.foreground }]}>{item.content}</Text>
      </Pressable>
      <Pressable
        onPress={() => handleDeleteItem(item.id)}
        style={({ pressed }) => [styles.itemDeleteBtn, { opacity: pressed ? 0.5 : 1 }]}
        hitSlop={8}
      >
        <IconSymbol name="xmark" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={8}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDate, { color: colors.foreground }]}>{full}</Text>
          <Text style={[styles.headerWeekday, { color: colors.muted }]}>{weekdayLabel}</Text>
        </View>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.saveBtnText}>저장</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weather */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>날씨</Text>
          <View style={styles.emojiRow}>
            {WEATHER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.emoji}
                onPress={() => setWeather(weather === opt.emoji ? undefined : opt.emoji)}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  {
                    backgroundColor: weather === opt.emoji ? colors.primary + "22" : colors.surface,
                    borderColor: weather === opt.emoji ? colors.primary : colors.border,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  },
                ]}
              >
                <Text style={styles.emojiBtnText}>{opt.emoji}</Text>
                <Text style={[styles.emojiBtnLabel, { color: weather === opt.emoji ? colors.primary : colors.muted }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>기분</Text>
          <View style={styles.emojiRow}>
            {MOOD_OPTIONS.map((opt) => (
              <Pressable
                key={opt.emoji}
                onPress={() => setMood(mood === opt.emoji ? undefined : opt.emoji)}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  {
                    backgroundColor: mood === opt.emoji ? colors.primary + "22" : colors.surface,
                    borderColor: mood === opt.emoji ? colors.primary : colors.border,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  },
                ]}
              >
                <Text style={styles.emojiBtnText}>{opt.emoji}</Text>
                <Text style={[styles.emojiBtnLabel, { color: mood === opt.emoji ? colors.primary : colors.muted }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Metacognitive Questions */}
        {todaysQuestion && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>오늘의 성찰</Text>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>
              질문을 터치하면 다른 질문을 받을 수 있어요
            </Text>
            <Pressable
              onPress={() => setTodaysQuestion(getNextQuestion(todaysQuestion))}
              style={({ pressed }) => [
                styles.questionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.questionContent}>
                <Text style={[styles.questionText, { color: colors.foreground }]}>{todaysQuestion}</Text>
              </View>
            </Pressable>
            <TextInput
              value={questionAnswer}
              onChangeText={setQuestionAnswer}
              placeholder="스스로의 생각을 적어보세요..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[
                styles.answerInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  marginTop: 12,
                },
              ]}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>오늘의 항목</Text>
            <Text style={[styles.itemCountText, { color: colors.muted }]}>{items.length}개</Text>
          </View>

          {items.length === 0 ? (
            <View style={[styles.emptyItems, { borderColor: colors.border }]}>
              <Text style={[styles.emptyItemsText, { color: colors.muted }]}>
                아직 항목이 없어요{"\n"}아래 버튼을 눌러 추가해 보세요
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item, index) => renderItem({ item, index }))}
            </View>
          )}

          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [
              styles.addItemBtn,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? colors.primary + "11" : "transparent",
              },
            ]}
          >
            <IconSymbol name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addItemBtnText, { color: colors.primary }]}>항목 추가</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.background }]} onPress={() => {}}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingItem ? "항목 수정" : "항목 추가"}
            </Text>

            {/* Category */}
            <Text style={[styles.modalLabel, { color: colors.muted }]}>카테고리</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.name}
                  onPress={() => setModalCategory(cat)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor:
                        modalCategory.name === cat.name ? cat.color + "22" : colors.surface,
                      borderColor:
                        modalCategory.name === cat.name ? cat.color : colors.border,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: modalCategory.name === cat.name ? cat.color : colors.foreground },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Time (optional) */}
            <Text style={[styles.modalLabel, { color: colors.muted }]}>시간 (선택)</Text>
            <TextInput
              value={modalTime}
              onChangeText={setModalTime}
              placeholder="예: 12:30"
              placeholderTextColor={colors.muted}
              style={[
                styles.timeInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              returnKeyType="next"
            />

            {/* Content */}
            <Text style={[styles.modalLabel, { color: colors.muted }]}>내용</Text>
            <TextInput
              value={modalContent}
              onChangeText={setModalContent}
              placeholder="오늘 있었던 일을 적어보세요..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[
                styles.contentInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              textAlignVertical="top"
              returnKeyType="done"
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: colors.muted }]}>취소</Text>
              </Pressable>
              <Pressable
                onPress={handleModalConfirm}
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: modalContent.trim() ? colors.primary : colors.border,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.modalConfirmText}>
                  {editingItem ? "수정" : "추가"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerDate: { fontSize: 16, fontWeight: "700" },
  headerWeekday: { fontSize: 12 },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  scrollContent: { padding: 16, gap: 8, paddingBottom: 40 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  itemCountText: { fontSize: 12 },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiBtn: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 2,
    minWidth: 56,
  },
  emojiBtnText: { fontSize: 22 },
  emojiBtnLabel: { fontSize: 10, fontWeight: "500" },
  emptyItems: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyItemsText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  itemsList: { gap: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemAccent: { width: 4, alignSelf: "stretch" },
  itemContent: { flex: 1, padding: 12, gap: 4 },
  itemTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemEmoji: { fontSize: 16 },
  itemCategory: { fontSize: 12, fontWeight: "500" },
  itemTime: { fontSize: 12, marginLeft: "auto" },
  itemText: { fontSize: 14, lineHeight: 20 },
  itemDeleteBtn: { padding: 12 },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  addItemBtnText: { fontSize: 15, fontWeight: "600" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  categoryScroll: { gap: 8, paddingVertical: 4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryEmoji: { fontSize: 16 },
  categoryName: { fontSize: 13, fontWeight: "500" },
  timeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    lineHeight: 22,
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600" },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionDesc: { fontSize: 12, marginTop: -4 },
  questionsContainer: { gap: 12 },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF8C6922",
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumberText: { fontSize: 12, fontWeight: "700" },
  questionContent: { gap: 8 },
  questionText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  answerInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
  },
});
