let _lastUniqueNowMs = 0;

export const getUniqueNowMs = () => {
  const now = Date.now();
  if (now <= _lastUniqueNowMs) _lastUniqueNowMs += 1;
  else _lastUniqueNowMs = now;
  return _lastUniqueNowMs;
};

const pad2 = (n) => String(n).padStart(2, "0");
const pad3 = (n) => String(n).padStart(3, "0");

// ISO LOCAL (hora del celular) + milisegundos, SIN UTC/Z
export const formatLocalISO = (ms = Date.now()) => {
  const d = new Date(ms);
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const mmm = pad3(d.getMilliseconds());
  return `${y}-${mo}-${da}T${hh}:${mi}:${ss}.${mmm}`;
};

// Mantén el nombre para no romper imports existentes
export const nowPeruISO = () => formatLocalISO(getUniqueNowMs());
