const BAD_WORDS = [
  '幹', '靠', '屌', '媽的', '操', '他媽', '去死', '智障', '白癡', '腦殘',
  '廢物', '賤', '婊', '妓', '幹你', '幹他', '王八', '混蛋', '狗屎', '機掰',
  '雞巴', '奸', '姦', '肏', '屁眼', 'fuck', 'shit', 'bitch', 'asshole', 'bastard',
]

export function checkProfanity(text: string): boolean {
  const lower = text.toLowerCase()
  return BAD_WORDS.some(w => lower.includes(w.toLowerCase()))
}
