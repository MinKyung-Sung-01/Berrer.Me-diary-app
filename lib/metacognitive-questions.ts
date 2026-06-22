/**
 * 메타인지적 질문 시스템
 * 매일 하나의 질문을 제공하며, 사용자가 터치하면 다른 질문으로 변경됩니다.
 */

// 메타인지적 질문 풀 (총 40개 - 다양한 질문 제공)
const QUESTION_POOL = [
  "오늘 하루 중에 가장 기억에 남는 순간은 뭐였어?",
  "오늘 기분이 어떻게 변했는지 생각해볼 수 있어?",
  "오늘 뭔가를 선택했을 때, 왜 그렇게 선택했는지 알 수 있어?",
  "만약 오늘을 다시 산다면, 뭘 다르게 하고 싶어?",
  "오늘 배운 가장 중요한 게 뭐라고 생각해?",
  "오늘 스스로가 잘했다고 느낀 순간이 있어?",
  "오늘 어려운 상황이 있었다면, 어떻게 대처했어?",
  "오늘 느낀 감정의 이유가 뭐라고 생각해?",
  "오늘 누군가를 도와주거나 도움을 받았어? 그게 어땠어?",
  "오늘 스스로의 가치관에 맞는 행동을 했어?",
  "오늘 가장 자랑스러웠던 순간은 언제야?",
  "오늘 미루거나 피한 일이 있어? 왜 그랬을까?",
  "오늘 누군가와의 대화에서 배운 게 있어?",
  "오늘 기분의 변화 패턴을 보면 뭐가 보여?",
  "오늘 내린 선택 중에 가장 잘한 게 뭐야?",
  "오늘 스트레스나 불안을 느꼈다면, 그 이유가 뭐야?",
  "오늘 스스로가 조금 성장했다고 느낀 부분이 있어?",
  "오늘 뭐가 제일 중요했고, 그게 행동에 반영됐어?",
  "오늘 예상한 것과 실제로 일어난 게 달랐어? 왜 그랬을까?",
  "오늘 여러 선택지 중에 뭘 선택했고, 왜 그랬어?",
  "오늘 느낀 좋은 감정의 이유가 뭐야?",
  "만약 다른 사람 입장에서 오늘을 본다면 어떻게 보일까?",
  "오늘 배운 게 앞으로 어떻게 도움이 될 것 같아?",
  "오늘 스스로의 진짜 모습이 드러났다고 생각해?",
  "오늘 느낀 감정 뒤에 숨은 진짜 이유가 뭐라고 생각해?",
  "오늘 말한 것과 한 행동이 일치했어?",
  "오늘 도움을 청했거나 청하지 않은 이유가 뭐야?",
  "오늘 스스로에게 가장 고마운 순간이 있어?",
  "오늘 하루를 한 문장으로 표현한다면?",
  "오늘 스스로를 더 잘 이해하게 된 부분이 있어?",
  "오늘 가장 행복했던 순간과 그 이유는?",
  "오늘 실수했다면, 그걸 통해 뭘 배웠어?",
  "오늘 누군가에게 고마움을 느꼈어? 왜?",
  "오늘 스스로의 강점이 가장 잘 드러난 때는?",
  "오늘 도전했던 일이 있어? 어땠어?",
  "오늘 휴식이 필요했던 이유가 뭐야?",
  "오늘 스스로가 자랑스러워할 만한 선택을 했어?",
  "오늘 가장 집중했던 순간은 언제야?",
  "오늘 스스로의 감정을 잘 이해했다고 생각해?",
  "오늘 내일을 위해 준비할 수 있는 게 뭐야?",
];

/**
 * 날짜를 기반으로 오늘의 메타인지적 질문을 가져옵니다.
 * 같은 날짜에는 항상 같은 질문을 반환합니다.
 */
export function getTodaysQuestion(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dayOfYear = getDayOfYear(year, month, day);
  const index = dayOfYear % QUESTION_POOL.length;
  return QUESTION_POOL[index];
}

/**
 * 주어진 질문 인덱스를 기반으로 다음 질문을 가져옵니다.
 * 사용자가 질문을 터치했을 때 새로운 질문을 제공합니다.
 */
export function getNextQuestion(currentQuestion: string): string {
  const currentIndex = QUESTION_POOL.indexOf(currentQuestion);
  if (currentIndex === -1) return QUESTION_POOL[0];
  
  // 다음 질문으로 이동 (순환)
  const nextIndex = (currentIndex + 1) % QUESTION_POOL.length;
  return QUESTION_POOL[nextIndex];
}

/**
 * 연중 일자 계산 (1월 1일 = 1)
 */
function getDayOfYear(year: number, month: number, day: number): number {
  const daysInMonths = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let dayOfYear = daysInMonths[month - 1] + day;

  // 윤년 처리
  if (month > 2 && isLeapYear(year)) {
    dayOfYear++;
  }

  return dayOfYear;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
