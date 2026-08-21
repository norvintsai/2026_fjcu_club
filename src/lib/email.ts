import nodemailer from 'nodemailer'

function getTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('Gmail 環境變數未設定')
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export async function sendOTPEmail(to: string, code: string, studentId: string) {
  await getTransporter().sendMail({
    from: `"FJU STELLAR 後台" <${process.env.GMAIL_USER}>`,
    to,
    subject: `【FJU STELLAR】登入驗證碼：${code}`,
    html: `
      <div style="background:#0a0a0f;color:#e0e0e0;font-family:'Courier New',monospace;padding:40px;max-width:480px;margin:0 auto;border:1px solid #1e1e32;">
        <div style="border-bottom:1px solid #2a2a3a;padding-bottom:16px;margin-bottom:28px;">
          <p style="color:#00ff88;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0;">
            FJU STELLAR · 輔仁大學社博 · 管理後台
          </p>
        </div>

        <p style="color:#9a9aaa;font-size:13px;line-height:1.8;margin:0 0 24px;">
          你好，你的後台驗證碼如下。請在 <strong style="color:#ffd700;">10 分鐘</strong>內輸入，此碼只能使用一次。
        </p>

        <div style="background:#0f0f1a;border:1px solid #00ff8840;padding:28px 24px;text-align:center;margin:0 0 28px;">
          <p style="color:#4a4a6a;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">驗證碼</p>
          <p style="color:#00ff88;font-size:40px;font-weight:900;letter-spacing:0.35em;margin:0;text-shadow:0 0 20px rgba(0,255,136,.4);">${code}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:0 0 28px;">
          <tr>
            <td style="color:#4a4a6a;font-size:11px;padding:6px 0;letter-spacing:0.08em;">學號</td>
            <td style="color:#9a9aaa;font-size:11px;padding:6px 0;text-align:right;">${studentId}</td>
          </tr>
          <tr>
            <td style="color:#4a4a6a;font-size:11px;padding:6px 0;letter-spacing:0.08em;">有效時間</td>
            <td style="color:#ffd700;font-size:11px;padding:6px 0;text-align:right;">10 分鐘</td>
          </tr>
        </table>

        <p style="color:#3a3a5a;font-size:10px;line-height:1.6;margin:0;border-top:1px solid #1e1e32;padding-top:16px;">
          如果你沒有嘗試登入，請忽略此郵件。此郵件由系統自動發送，請勿回覆。
        </p>
      </div>
    `,
  })
}
