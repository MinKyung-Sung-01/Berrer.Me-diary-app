import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DiaryItem {
  id: string;
  category: string;
  categoryEmoji: string;
  content: string;
  time?: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weather?: string;
  mood?: string;
  items: DiaryItem[];
  metacognitiveAnswers?: string[]; // 메타인지적 질문에 대한 답변 (최대 2개)
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "diary_entries";

export async function loadEntries(): Promise<DiaryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DiaryEntry[];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: DiaryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getEntry(id: string): Promise<DiaryEntry | null> {
  const entries = await loadEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export async function upsertEntry(entry: DiaryEntry): Promise<void> {
  const entries = await loadEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = { ...entry, updatedAt: Date.now() };
  } else {
    entries.unshift(entry);
  }
  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));
  await saveEntries(entries);
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await loadEntries();
  await saveEntries(entries.filter((e) => e.id !== id));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(dateStr: string): { full: string; weekday: string; short: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  return {
    full: `${y}년 ${months[m - 1]} ${d}일`,
    weekday: weekdays[date.getDay()],
    short: `${months[m - 1]} ${d}일`,
  };
}

export const CATEGORIES = [
  { name: "식사", emoji: "🍽️", color: "#FF8C69" },
  { name: "운동", emoji: "🏃", color: "#5CB85C" },
  { name: "업무", emoji: "💼", color: "#5B9BD5" },
  { name: "공부", emoji: "📚", color: "#9B59B6" },
  { name: "만남", emoji: "👥", color: "#E67E22" },
  { name: "여가", emoji: "🎮", color: "#1ABC9C" },
  { name: "집안일", emoji: "🏠", color: "#95A5A6" },
  { name: "기타", emoji: "✨", color: "#F39C12" },
];

export const WEATHER_OPTIONS = [
  { label: "맑음", emoji: "☀️" },
  { label: "흐림", emoji: "⛅" },
  { label: "비", emoji: "🌧️" },
  { label: "눈", emoji: "❄️" },
  { label: "더움", emoji: "🌡️" },
];

export const MOOD_OPTIONS = [
  { label: "행복", emoji: "😊" },
  { label: "보통", emoji: "😐" },
  { label: "슬픔", emoji: "😢" },
  { label: "화남", emoji: "😠" },
  { label: "설렘", emoji: "🥰" },
  { label: "피곤", emoji: "😴" },
];
