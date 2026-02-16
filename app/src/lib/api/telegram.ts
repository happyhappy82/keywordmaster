// 텔레그램 봇 메시지 발송

const TELEGRAM_API = 'https://api.telegram.org/bot';
const MAX_MESSAGE_LENGTH = 4096;

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[TELEGRAM] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
    return false;
  }

  // 메시지가 길면 분할 발송
  const chunks = splitMessage(text);

  for (let i = 0; i < chunks.length; i++) {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunks[i],
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('[TELEGRAM] Send failed:', result.description);
      return false;
    }

    // 여러 메시지 발송 시 rate limit 방지
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return true;
}

function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  // 트렌드 블록 단위(\n\n)로 분할
  const sections = text.split('\n\n');
  let current = '';

  for (const section of sections) {
    if (current.length + section.length + 2 > MAX_MESSAGE_LENGTH) {
      if (current) chunks.push(current.trim());
      current = section;
    } else {
      current += (current ? '\n\n' : '') + section;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

// HTML 특수문자 이스케이프 (텔레그램 HTML parse_mode 용)
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
