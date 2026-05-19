// Doctor Report — Variation B v2
// Refinement focus: branding, sparkline trends, warm paper, restraint.

// ── Helpers ─────────────────────────────────────────────────────
function pickFieldB2(rs, k) { return rs.map(r => r[k]).filter(v => v != null); }

// Build sparkline path data
function buildSpark(readings, field, width, height, scale) {
  const pts = readings
    .filter(r => r[field] != null)
    .map(r => ({ ts: r.ts, v: r[field] }));
  if (pts.length < 2) return null;

  const minTs = pts[0].ts;
  const maxTs = pts[pts.length - 1].ts;
  const tsRange = maxTs - minTs || 1;
  const valRange = scale.max - scale.min;

  const coords = pts.map(p => {
    const x = ((p.ts - minTs) / tsRange) * width;
    const y = height - ((p.v - scale.min) / valRange) * height;
    return { x, y, ts: p.ts, v: p.v };
  });

  // Smooth cardinal spline through points (tension 0.5)
  const tension = 0.5;
  let pathD = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] || coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] || p2;
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    pathD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  // Area fill path (close to bottom)
  const areaD = pathD + ` L ${coords[coords.length - 1].x.toFixed(2)} ${height} L ${coords[0].x.toFixed(2)} ${height} Z`;

  return {
    pathD,
    areaD,
    coords,
    targetY: scale.target != null ? height - ((scale.target - scale.min) / valRange) * height : null,
    bandTop: scale.bandTop != null ? height - ((scale.bandTop - scale.min) / valRange) * height : null,
    bandBottom: scale.bandBottom != null ? height - ((scale.bandBottom - scale.min) / valRange) * height : null,
  };
}

// One vital row with sparkline
function VitalRow({ name, unit, summary, field, scale, statusLabel, statusTone, currentLabel, currentValue, trendValue, trendUnit, prefs, dualField }) {
  const SP_W = 480;
  const SP_H = 64;

  const spark = buildSpark(summary.readings, field, SP_W, SP_H, scale);
  // For BP — also draw diastolic as a second softer line
  const spark2 = dualField ? buildSpark(summary.readings, dualField, SP_W, SP_H, scale) : null;

  // Week marker positions
  const minTs = summary.firstTs;
  const maxTs = summary.lastTs;
  const tsRange = maxTs - minTs || 1;
  const weeksOut = [];
  const firstDate = new Date(minTs);
  firstDate.setHours(0, 0, 0, 0);
  // Find first Monday
  const dayOfWeek = firstDate.getDay();
  const daysUntilMon = (8 - dayOfWeek) % 7 || 7;
  let cursor = new Date(firstDate.getTime() + daysUntilMon * 86400000);
  while (cursor.getTime() <= maxTs) {
    const x = ((cursor.getTime() - minTs) / tsRange) * SP_W;
    weeksOut.push({ x, label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    cursor = new Date(cursor.getTime() + 7 * 86400000);
  }

  const tones = {
    optimal: { c: '#15803D', bg: 'rgba(22,128,61,0.08)', dot: '#22C55E' },
    athletic: { c: '#1565C0', bg: 'rgba(21,101,192,0.08)', dot: '#1E88E5' },
    watch:   { c: '#C2410C', bg: 'rgba(194,65,12,0.08)', dot: '#EA580C' },
    flat:    { c: '#475569', bg: 'rgba(71,85,105,0.08)', dot: '#94A3B8' },
  };
  const tone = tones[statusTone] || tones.optimal;

  const lastCoord = spark ? spark.coords[spark.coords.length - 1] : null;
  const lastCoord2 = spark2 ? spark2.coords[spark2.coords.length - 1] : null;

  return (
    <div className="b2-vrow">
      {/* Left: name + value */}
      <div className="b2-vrow-left">
        <div className="b2-vrow-name">{name}</div>
        <div className="b2-vrow-bignum">
          {currentValue}
          <span className="b2-vrow-unit">{unit}</span>
        </div>
        <div className="b2-vrow-currentlbl">{currentLabel}</div>
        <div className="b2-vrow-status" style={{ color: tone.c, background: tone.bg }}>
          {statusLabel}
        </div>
      </div>

      {/* Right: sparkline */}
      <div className="b2-vrow-spark">
        <div className="b2-vrow-spark-hdr">
          <span className="b2-vrow-spark-lbl">Last {summary.periodDays} days</span>
          <span className="b2-vrow-trend" style={{ color: tone.c }}>
            {trendArrow(trendValue)} {fmtSigned(trendValue, 1)} {trendUnit}
          </span>
        </div>
        <svg width={SP_W} height={SP_H + 14} viewBox={`0 0 ${SP_W} ${SP_H + 14}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Target line (dashed) */}
          {spark && spark.targetY != null && (
            <g>
              <line x1="0" y1={spark.targetY} x2={SP_W} y2={spark.targetY}
                stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
              <text x={SP_W - 2} y={spark.targetY - 3} textAnchor="end"
                fontFamily="DM Mono, monospace" fontSize="8.5" fill="#94A3B8" letterSpacing="0.06em">
                TARGET {prefs && field === 'sys' ? `${prefs.goal_sys}/${prefs.goal_dia}` :
                  field === 'hr' ? prefs?.goal_hr :
                  field === 'wt' ? prefs?.goal_wt : ''}
              </text>
            </g>
          )}
          {/* Diastolic (background) */}
          {spark2 && (
            <g>
              <path d={spark2.areaD} fill="#1E88E5" opacity="0.05" />
              <path d={spark2.pathD} fill="none" stroke="#94A3B8" strokeWidth="1.4" opacity="0.7"
                strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={lastCoord2.x} cy={lastCoord2.y} r="3" fill="#fff" stroke="#94A3B8" strokeWidth="1.4" />
            </g>
          )}
          {/* Main sparkline */}
          {spark && (
            <g>
              <path d={spark.areaD} fill="#1E88E5" opacity="0.08" />
              <path d={spark.pathD} fill="none" stroke="#1E88E5" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={lastCoord.x} cy={lastCoord.y} r="4" fill="#1E88E5" />
              <circle cx={lastCoord.x} cy={lastCoord.y} r="6.5" fill="none" stroke="#1E88E5" strokeWidth="1" opacity="0.35" />
            </g>
          )}
          {/* Week tick labels */}
          {weeksOut.map((w, i) => (
            <g key={i}>
              <line x1={w.x} y1={SP_H} x2={w.x} y2={SP_H + 3} stroke="#CBD5E0" strokeWidth="0.8" />
              <text x={w.x} y={SP_H + 12} textAnchor="middle"
                fontFamily="DM Mono, monospace" fontSize="8" fill="#94A3B8" letterSpacing="0.06em">
                {w.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="b2-vrow-range">
          <span><strong>Min</strong> {field === 'wt' ? fmtNum(summary[field].min, 1) : summary[field].min}</span>
          <span><strong>Avg</strong> {fmtNum(summary[field].avg, field === 'wt' ? 1 : 0)}</span>
          <span><strong>Max</strong> {field === 'wt' ? fmtNum(summary[field].max, 1) : summary[field].max}</span>
        </div>
      </div>
    </div>
  );
}

// Calendar logging strip — one cell per day of the period
function LoggingStrip({ summary }) {
  const dayMs = 86400000;
  const start = new Date(summary.firstTs);
  start.setHours(0, 0, 0, 0);
  const periodDays = summary.periodDays;

  // Build set of logged days
  const loggedDays = new Set();
  summary.readings.forEach(r => {
    const d = new Date(r.ts); d.setHours(0,0,0,0);
    loggedDays.add(d.getTime());
  });

  // Build cells
  const cells = [];
  for (let i = 0; i < periodDays; i++) {
    const t = start.getTime() + i * dayMs;
    const logged = loggedDays.has(t);
    const d = new Date(t);
    const isMonday = d.getDay() === 1;
    cells.push({ logged, isMonday, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
  }

  return (
    <div className="b2-strip">
      <div className="b2-strip-row">
        {cells.map((c, i) => (
          <div key={i}
            className={`b2-strip-cell ${c.logged ? 'logged' : ''}`}
            title={c.label}
          />
        ))}
      </div>
      <div className="b2-strip-ticks">
        <span>{fmtDate(summary.firstTs, { month: 'short', day: 'numeric' })}</span>
        <span>{fmtDate(summary.lastTs, { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

// Hare logo lockup — original two-bar + ECG mark
function HareLogo({ size = 28, color = '#1E88E5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect x="0" y="2" width="7" height="40" rx="3.5" fill={color}/>
      <rect x="37" y="2" width="7" height="40" rx="3.5" fill={color}/>
      <polyline points="7,22 11,22 15,6 20,38 25,10 29,22 37,22"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── The variation ─────────────────────────────────────────────
function ReportVariationB2({ summary, prefs }) {
  const s = summary;
  const heightFt = Math.floor(prefs.height / 12);
  const heightIn = prefs.height % 12;
  const periodLabel = `${fmtDate(s.firstTs)} – ${fmtDate(s.lastTs)}`;

  return (
    <div className="report b2-report">
      {/* Subtle paper texture */}
      <div className="b2-paper-grain" />

      {/* ───── LETTERHEAD ───── */}
      <header className="b2-letterhead">
        <div className="b2-letterhead-row">
          <div className="b2-brand">
            <HareLogo size={36} />
            <div className="b2-brand-text">
              <div className="b2-wordmark">HARE HEALTH</div>
              <div className="b2-tagline">Measure. Monitor. Improve.</div>
            </div>
          </div>
          <div className="b2-meta">
            <div className="b2-meta-row"><span>Issued</span><strong>May 17, 2026</strong></div>
            <div className="b2-meta-row"><span>Report</span><strong>HH-0517-SHA</strong></div>
            <div className="b2-meta-row"><span>Patient ID</span><strong>shane@hare.app</strong></div>
          </div>
        </div>

        {/* ECG divider — referencing the logo waveform */}
        <svg className="b2-ecg" viewBox="0 0 696 16" preserveAspectRatio="none">
          <polyline
            points="0,8 100,8 130,8 145,8 155,2 165,14 175,8 250,8 280,8 295,8 305,3 315,13 325,8 400,8 430,8 445,8 455,2 465,14 475,8 550,8 580,8 595,8 605,3 615,13 625,8 696,8"
            fill="none" stroke="#1E88E5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
          />
        </svg>

        {/* Patient name in display type */}
        <div className="b2-doctitle-row">
          <div className="b2-doctitle-left">
            <div className="b2-doctitle-kicker">Self-tracked vitals · for primary care review</div>
            <h1 className="b2-patient-name">{prefs.name}</h1>
            <div className="b2-patient-meta">
              <span>{prefs.age} years</span>
              <span className="dot">·</span>
              <span>{heightFt}′ {heightIn}″</span>
              <span className="dot">·</span>
              <span>DOB {prefs.dob}</span>
            </div>
          </div>
          <div className="b2-doctitle-right">
            <div className="b2-doctitle-window">
              <div className="b2-window-lbl">Period</div>
              <div className="b2-window-val">{s.periodDays} days</div>
              <div className="b2-window-dates">{periodLabel}</div>
              <div className="b2-window-count">{s.count} readings · {s.compliance.daysLogged} of {s.periodDays} days logged</div>
            </div>
          </div>
        </div>
      </header>

      {/* ───── AI BRIEF (warm, plain-language) ───── */}
      <section className="b2-brief">
        <div className="b2-brief-stamp">
          <span className="b2-brief-dot" />
          <span>AI BRIEF · Plain language · reviewed by patient</span>
        </div>
        <p className="b2-brief-text">
          <strong>{prefs.name.split(' ')[0]} has been tracking carefully.</strong> Over the past <strong>{s.periodDays} days</strong>, home BP averaged <strong>{fmtNum(s.sys.avg)}/{fmtNum(s.dia.avg)} mmHg</strong> — within optimal range, and drifting downward by <strong>{fmtSigned(s.sys.trend, 1)} mmHg</strong> from the first half to the second. Resting heart rate sits around <strong>{fmtNum(s.hr.avg)} bpm</strong> (athletic). Weight is down <strong>{fmtSigned(s.wt.change, 1)} lbs</strong> from baseline.
        </p>
        <p className="b2-brief-text">
          Almost all readings were taken <strong>morning, seated</strong> — good for comparability. One outlier worth context: <strong>HR 52 bpm on May 17</strong>, recorded shortly after a morning run.
        </p>
      </section>

      {/* ───── VITAL ROWS WITH SPARKLINES ───── */}
      <section className="b2-vitals">
        <VitalRow
          name="Blood Pressure"
          unit="mmHg avg"
          summary={s}
          field="sys"
          dualField="dia"
          scale={{ min: 90, max: 145, target: prefs.goal_sys, bandTop: 130, bandBottom: 90 }}
          statusLabel="OPTIMAL · NORMAL RANGE"
          statusTone="optimal"
          currentLabel={`Last reading ${fmtDate(s.readings[s.readings.length-1].ts, { month: 'short', day: 'numeric' })}: ${s.readings[s.readings.length-1].sys}/${s.readings[s.readings.length-1].dia}`}
          currentValue={`${fmtNum(s.sys.avg)}/${fmtNum(s.dia.avg)}`}
          trendValue={s.sys.trend}
          trendUnit="mmHg"
          prefs={prefs}
        />
        <VitalRow
          name="Heart Rate"
          unit="bpm avg · resting"
          summary={s}
          field="hr"
          scale={{ min: 50, max: 85, target: prefs.goal_hr, bandTop: 80, bandBottom: 50 }}
          statusLabel="ATHLETIC RANGE"
          statusTone="athletic"
          currentLabel={`Last reading: ${s.readings[s.readings.length-1].hr} bpm`}
          currentValue={fmtNum(s.hr.avg)}
          trendValue={s.hr.trend}
          trendUnit="bpm"
          prefs={prefs}
        />
        <VitalRow
          name="Body Weight"
          unit="lbs · most recent"
          summary={s}
          field="wt"
          scale={{ min: 215, max: 220, target: prefs.goal_wt, bandTop: 220, bandBottom: 210 }}
          statusLabel="TRENDING TOWARD GOAL"
          statusTone="optimal"
          currentLabel={`Goal: ${prefs.goal_wt} lbs · ${fmtNum(s.wt.last - prefs.goal_wt, 1)} to go`}
          currentValue={fmtNum(s.wt.last, 1)}
          trendValue={s.wt.change}
          trendUnit="lbs"
          prefs={prefs}
        />
      </section>

      {/* ───── LOGGING STRIP ───── */}
      <section className="b2-logging">
        <div className="b2-logging-hdr">
          <span className="b2-logging-lbl">Logging consistency</span>
          <div className="b2-logging-stats">
            <span><strong>{s.compliance.pct}%</strong>adherence</span>
            <span className="sep">/</span>
            <span><strong>{s.compliance.longestStreak}d</strong>longest streak</span>
            <span className="sep">/</span>
            <span><strong>85%</strong>morning · seated</span>
          </div>
        </div>
        <LoggingStrip summary={s} />
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="b2-footer">
        <div className="b2-disc">
          <strong>For screening discussion only</strong>
          Patient-reported values from home equipment. Hare Health is a tracking tool, not a substitute for clinical measurement.
        </div>
        <div className="b2-foot-end">
          <div className="b2-foot-url">harehealth.app</div>
          <div className="b2-foot-id">HH-0517-SHA · pg 1 of 1</div>
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, { ReportVariationB2 });
