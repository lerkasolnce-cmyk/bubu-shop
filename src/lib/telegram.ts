import "server-only";

type OrderNotificationItem = { name: string; price: number; qty: number };

export type OrderNotification = {
  id: number | string;
  name: string;
  phone: string;
  city: string;
  npOffice: string;
  comment: string;
  items: OrderNotificationItem[];
  total: number;
  paymentMethod: "mono" | "cod";
};

const PAYMENT_LABEL: Record<OrderNotification["paymentMethod"], string> = {
  mono: "Оплата карткою (Monobank)",
  cod: "Оплата при отриманні",
};

function formatMessage(order: OrderNotification): string {
  const lines = [
    `🛒 Нове замовлення №${order.id}`,
    "",
    `Ім'я: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Місто: ${order.city}`,
    `Відділення НП: ${order.npOffice || "—"}`,
  ];

  if (order.comment) lines.push(`Коментар: ${order.comment}`);

  lines.push("", "Товари:");
  for (const item of order.items) {
    lines.push(`— ${item.name} × ${item.qty} = ₴${(item.price * item.qty).toLocaleString("uk-UA")}`);
  }

  lines.push("", `Разом: ₴${order.total.toLocaleString("uk-UA")}`, `Оплата: ${PAYMENT_LABEL[order.paymentMethod]}`);

  return lines.join("\n");
}

/**
 * Notifies the shop's Telegram chat about a new order.
 * Never throws: a missing/misconfigured Telegram integration or a flaky
 * network call must not block order creation — the order matters more than
 * the notification. Failures are logged via console.warn and swallowed.
 */
export async function sendOrderNotification(order: OrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("sendOrderNotification: telegram skipped (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set)");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: formatMessage(order) }),
    });
    if (!res.ok) {
      console.warn("sendOrderNotification: Telegram API responded with", res.status, await res.text());
    }
  } catch (e) {
    console.warn("sendOrderNotification: request failed", e);
  }
}
