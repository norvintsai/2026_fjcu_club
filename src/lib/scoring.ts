import { Question, QuestionOption } from './database.types'

// 計算每個社團類別的得分，回傳最高分的類別作為結果
export function computeResult(
  questions: Question[],
  answers: Record<string, string>
): { scores: Record<string, number>; result: string } {
  const scores: Record<string, number> = {}

  for (const question of questions) {
    const selectedLabel = answers[String(question.id)]
    if (!selectedLabel) continue

    const option = question.options.find((o: QuestionOption) => o.label === selectedLabel)
    if (!option?.category) continue

    scores[option.category] = (scores[option.category] ?? 0) + 1
  }

  const result =
    Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '未能判定'

  return { scores, result }
}
