export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * 判断两条消息是否属于同一组（同发送者且间隔 <60s）
 */
export function isSameGroup(a: ChatMessage, b: ChatMessage): boolean {
  return a.role === b.role && Math.abs(b.timestamp - a.timestamp) < 60_000;
}

/**
 * 判断两条消息间是否需要显示时间分隔符（间隔 >15min 或跨天）
 */
export function shouldShowTimeSeparator(prev: number, curr: number): boolean {
  if (curr - prev > 15 * 60_000) return true;
  const d1 = new Date(prev);
  const d2 = new Date(curr);
  return d1.getDate() !== d2.getDate() || d1.getMonth() !== d2.getMonth();
}

/**
 * 格式化时间分隔符文本
 */
export function formatTimeSeparator(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - target.getTime();
  const days = diff / 86_400_000;

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return weekdays[date.getDay()]!;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 格式化消息时间（HH:MM）
 */
export function formatMessageTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export type BubblePosition = "first" | "middle" | "last" | "single";

export interface MessageGroup {
  role: "user" | "assistant";
  messages: ChatMessage[];
}

/**
 * 将扁平消息数组分组
 */
export function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && isSameGroup(last.messages[last.messages.length - 1]!, msg)) {
      last.messages.push(msg);
    } else {
      groups.push({ role: msg.role, messages: [msg] });
    }
  }
  return groups;
}
