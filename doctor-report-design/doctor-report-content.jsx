// Sample data + computed summary for the Doctor Report design exploration.
// Mirrors the schema used by Hare Health App.html (readings stored as
// { ts, sys, dia, hr, wt, posture, tod }).

// ── Sample readings: ~6 weeks, 3-4 per week, realistic distribution ──
function generateSampleReadings() {
  const now = new Date('2026-05-17T08:00:00');
  const readings = [];
  // 42 days of data, log roughly every other day with some gaps
  const pattern = [
    // [daysAgo, time-of-day, posture, sys, dia, hr, wt]
    [42, 'morning',   'sitting',  126, 81, 74, 219.4],
    [41, 'evening',   'sitting',  124, 80, 72, null ],
    [39, 'morning',   'sitting',  128, 82, 75, 219.1],
    [37, 'morning',   'sitting',  125, 79, 73, 219.0],
    [36, 'afternoon', 'standing', 130, 84, 78, null ],
    [34, 'morning',   'sitting',  123, 78, 71, 218.6],
    [32, 'morning',   'sitting',  122, 77, 70, 218.4],
    [31, 'evening',   'sitting',  120, 76, 68, null ],
    [29, 'morning',   'sitting',  124, 79, 72, 218.1],
    [28, 'morning',   'sitting',  121, 77, 69, null ],
    [26, 'morning',   'sitting',  119, 76, 67, 217.8],
    [24, 'morning',   'sitting',  122, 78, 70, 217.6],
    [23, 'afternoon', 'sitting',  125, 80, 73, null ],
    [21, 'morning',   'sitting',  120, 77, 68, 217.4],
    [19, 'morning',   'sitting',  118, 75, 66, 217.1],
    [17, 'morning',   'sitting',  121, 77, 70, 217.0],
    [16, 'evening',   'sitting',  119, 76, 65, null ],
    [14, 'morning',   'sitting',  117, 74, 64, 216.8],
    [12, 'morning',   'sitting',  118, 76, 66, 216.5],
    [10, 'morning',   'sitting',  120, 77, 68, null ],
    [9,  'morning',   'sitting',  116, 73, 62, 216.4],
    [7,  'morning',   'sitting',  119, 75, 65, 216.2],
    [5,  'morning',   'sitting',  118, 74, 63, 216.1],
    [3,  'morning',   'sitting',  115, 73, 60, 216.0],
    [2,  'evening',   'sitting',  117, 74, 64, null ],
    [0,  'morning',   'sitting',  119, 73, 52, 216.0],
  ];
  pattern.forEach(([d, tod, pos, sys, dia, hr, wt]) => {
    const ts = new Date(now);
    ts.setDate(ts.getDate() - d);
    readings.push({
      ts: ts.getTime(),
      sys, dia, hr, wt,
      posture: pos, tod,
    });
  });
  return readings;
}

const SAMPLE_READINGS = generateSampleReadings();

// ── Summary computation ──
function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
function pickField(rs, k) { return rs.map(r => r[k]).filter(v => v != null); }

function computeSummary(readings, prefs) {
  if (!readings.length) return null;
  const sys = pickField(readings, 'sys');
  const dia = pickField(readings, 'dia');
  const hr  = pickField(readings, 'hr');
  const wt  = pickField(readings, 'wt');

  // Sort by ts ascending
  const sorted = [...readings].sort((a, b) => a.ts - b.ts);
  const firstTs = sorted[0].ts;
  const lastTs  = sorted[sorted.length - 1].ts;
  const periodDays = Math.max(1, Math.round((lastTs - firstTs) / 86400000) + 1);

  // First half vs second half — trend signal
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);
  const trendSys = avg(pickField(secondHalf, 'sys')) - avg(pickField(firstHalf, 'sys'));
  const trendHr  = avg(pickField(secondHalf, 'hr'))  - avg(pickField(firstHalf, 'hr'));
  const wtFirst  = pickField(firstHalf, 'wt');
  const wtLast   = pickField(secondHalf, 'wt');
  const trendWt  = (wtLast.length && wtFirst.length) ? avg(wtLast) - avg(wtFirst) : 0;

  // Compliance — days logged vs days in period
  const uniqueDays = new Set(sorted.map(r => new Date(r.ts).toDateString())).size;
  const compliancePct = Math.round((uniqueDays / periodDays) * 100);

  // Longest streak
  const daysSet = new Set(sorted.map(r => {
    const d = new Date(r.ts); d.setHours(0,0,0,0); return d.getTime();
  }));
  const dayMs = 86400000;
  let longestStreak = 0, currentStreak = 0;
  const sortedDays = [...daysSet].sort((a,b) => a-b);
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0 || sortedDays[i] - sortedDays[i-1] === dayMs) currentStreak++;
    else currentStreak = 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return {
    readings: sorted,
    count: sorted.length,
    firstTs, lastTs, periodDays,
    sys:  { avg: avg(sys),  median: median(sys),  min: Math.min(...sys),  max: Math.max(...sys), trend: trendSys },
    dia:  { avg: avg(dia),  median: median(dia),  min: Math.min(...dia),  max: Math.max(...dia) },
    hr:   { avg: avg(hr),   median: median(hr),   min: Math.min(...hr),   max: Math.max(...hr),  trend: trendHr },
    wt:   wt.length ? {
            avg: avg(wt), min: Math.min(...wt), max: Math.max(...wt),
            first: wt[0], last: wt[wt.length - 1],
            change: wt[wt.length - 1] - wt[0], trend: trendWt
          } : null,
    compliance: {
      pct: compliancePct,
      daysLogged: uniqueDays,
      periodDays,
      longestStreak,
      totalReadings: sorted.length,
    },
  };
}

// ── Sample prefs (mirrors hh2_prefs) ──
const SAMPLE_PREFS = {
  name: 'Shane Hare',
  age: 42,
  height: 71,           // inches → 5'11"
  goal_sys: 118,
  goal_dia: 76,
  goal_hr: 65,
  goal_wt: 210,
  dob: 'Mar 8, 1984',
};

// ── Formatting helpers ──
function fmtDate(ts, opts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtNum(n, decimals) {
  if (n == null || isNaN(n)) return '—';
  const factor = Math.pow(10, decimals || 0);
  return (Math.round(n * factor) / factor).toFixed(decimals || 0);
}
function fmtSigned(n, decimals) {
  if (n == null || isNaN(n)) return '—';
  const v = fmtNum(n, decimals);
  return n >= 0 ? '+' + v : v;
}
function trendArrow(n) {
  if (n == null || Math.abs(n) < 0.5) return '→';
  return n > 0 ? '↑' : '↓';
}

Object.assign(window, {
  SAMPLE_READINGS, SAMPLE_PREFS,
  computeSummary,
  fmtDate, fmtTime, fmtNum, fmtSigned, trendArrow,
});
