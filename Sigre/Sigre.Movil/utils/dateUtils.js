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




// Redondeo compatible con SQL Server DATETIME (0,3,7 dentro de cada 10ms)
export const roundMsForSqlDatetime = (msEpoch) => {
  const t = Math.trunc(Number(msEpoch) || 0);
  const ms = ((t % 1000) + 1000) % 1000; // 0..999
  const r = ms % 10;

  let targetR;
  if (r <= 1) targetR = 0;        // 0,1 -> 0
  else if (r <= 4) targetR = 3;   // 2,3,4 -> 3
  else if (r <= 8) targetR = 7;   // 5,6,7,8 -> 7
  else targetR = 10;              // 9 -> 10 (carry)

  const msRounded = (ms - r) + targetR;      // puede ser 1000
  const delta = msRounded - ms;              // -..+1
  return t + delta;
};
