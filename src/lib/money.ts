export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatHours(hours: number) {
  if (hours === 1) return "1 hora";
  if (hours === 24) return "24 horas";
  return `${hours} horas`;
}

export function formatRemaining(endsAt: Date, now = new Date()) {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return "encerrado";
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
