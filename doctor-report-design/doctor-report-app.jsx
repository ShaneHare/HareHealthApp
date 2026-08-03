// Doctor Report — Design exploration
// Mounts a DesignCanvas with:
//   Section 1: Mobile flow (history+FAB → confirm sheet → success)
//   Section 2: Two PDF variations of the report itself
//   Section 3: Design rationale

const { useMemo } = React;

// ═════════════════════════════════════════════════════════════
// Shared icons (small inline SVGs)
// ═════════════════════════════════════════════════════════════
function Icon({ name, size = 14, stroke = 'currentColor', strokeWidth = 1.8 }) {
  const paths = {
    download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
    fileText: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></g>,
    check: <polyline points="20 6 9 17 4 12"/>,
    chevron: <polyline points="9 18 15 12 9 6"/>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    sparkle: <g><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></g>,
    share: <g><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></g>,
    plus: <g><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></g>,
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    history: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    trends: <g><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></g>,
    user: <g><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// MOBILE: HISTORY SCREEN WITH FAB
// ═════════════════════════════════════════════════════════════
function HistoryScreenWithFab({ summary }) {
  const recent = summary.readings.slice(-6).reverse();
  return (
    <div className="phone">
      <div className="phone-status">
        <span className="time">9:41</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <svg width="16" height="11" viewBox="0 0 17 11" fill="#fff"><rect x="0" y="6" width="3" height="5" rx="0.5"/><rect x="4.5" y="3.5" width="3" height="7.5" rx="0.5"/><rect x="9" y="1" width="3" height="10" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
          <svg width="14" height="11" viewBox="0 0 16 11" fill="#fff"><path d="M8 2.5c2 0 3.8.8 5 2.1l-1 1c-1-1-2.4-1.6-4-1.6s-3 .6-4 1.6l-1-1C4.2 3.3 6 2.5 8 2.5z"/><path d="M8 6c1 0 2 .4 2.6 1l-1 1A2 2 0 0 0 8 7.5c-.6 0-1.2.2-1.6.5l-1-1A4 4 0 0 1 8 6z"/><circle cx="8" cy="9.5" r="1"/></svg>
          <svg width="22" height="11" viewBox="0 0 25 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="#fff" strokeOpacity="0.4"/><rect x="2" y="2" width="16" height="7" rx="1" fill="#fff"/><rect x="21" y="3.5" width="1.5" height="4" rx="0.5" fill="#fff" fillOpacity="0.6"/></svg>
        </span>
      </div>
      <div className="phone-body">
        <div className="screen-hdr">
          <div className="back-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B919C" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </div>
          <span className="screen-title">Reading History</span>
          <button className="hist-export-btn">
            <Icon name="download" size={10} />
            Export
          </button>
        </div>

        <div className="history-list">
          {recent.map((r, i) => {
            const high = r.sys >= 130;
            const watch = r.sys >= 125;
            const color = high ? '#FF9800' : (watch ? '#FFB74D' : '#2ECC71');
            return (
              <div key={r.ts} className="hist-item" style={{ borderLeftColor: color }}>
                <div className="hist-row1">
                  <span className="hist-date">{fmtDate(r.ts, { month: 'short', day: 'numeric' })} · {fmtTime(r.ts)}</span>
                  <span className="hist-ctx">
                    <span className="hist-ctx-tag">{r.posture}</span>
                    <span className="hist-ctx-tag">{r.tod}</span>
                  </span>
                </div>
                <div className="hist-vals">
                  <span>{r.sys}<span className="sep">/</span>{r.dia}<span className="unit">mmHg</span></span>
                  <span>{r.hr}<span className="unit">bpm</span></span>
                  {r.wt && <span>{r.wt}<span className="unit">lbs</span></span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <div className="fab-pulse" />
        <button className="fab-report">
          <span className="fab-report-icon">
            <Icon name="fileText" size={12} stroke="#fff" />
          </span>
          Doctor Report
        </button>

        {/* Bottom nav */}
        <div className="bnav">
          <div className="bnav-item"><Icon name="home" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Home</span></div>
          <div className="bnav-item active"><Icon name="history" size={17} stroke="#F0F2F5" strokeWidth={1.5} /><span>History</span></div>
          <div className="bnav-item"><Icon name="trends" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Trends</span></div>
          <div className="bnav-item"><Icon name="user" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Profile</span></div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MOBILE: GENERATE REPORT SHEET
// ═════════════════════════════════════════════════════════════
function GenerateReportSheet({ summary, prefs }) {
  return (
    <div className="phone">
      <div className="phone-status">
        <span className="time">9:41</span>
        <span style={{ fontSize: 9 }}>●●●</span>
      </div>
      <div className="phone-body" style={{ position: 'relative' }}>
        {/* Dimmed history behind */}
        <div className="screen-hdr" style={{ opacity: 0.3 }}>
          <div className="back-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B919C" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </div>
          <span className="screen-title">Reading History</span>
          <span style={{ width: 60 }} />
        </div>
        <div className="history-list" style={{ opacity: 0.18, padding: '14px 16px' }}>
          {summary.readings.slice(-3).reverse().map(r => (
            <div key={r.ts} className="hist-item">
              <div className="hist-row1">
                <span className="hist-date">{fmtDate(r.ts, { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="hist-vals"><span>{r.sys}<span className="sep">/</span>{r.dia}<span className="unit">mmHg</span></span></div>
            </div>
          ))}
        </div>

        <div className="sheet-overlay">
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-kicker">Doctor Report</div>
            <div className="sheet-title">Generate a clinical summary</div>
            <div className="sheet-sub">A clean PDF designed for your provider — vitals at a glance, plain-language summary, and your logging consistency. Takes about 5 seconds.</div>

            <div className="sheet-row">
              <span className="sheet-row-lbl">Range</span>
              <span className="sheet-row-val">
                Since last report · {summary.periodDays} days
                <span className="sheet-row-edit">CHANGE</span>
              </span>
            </div>
            <div className="sheet-row">
              <span className="sheet-row-lbl">Format</span>
              <span className="sheet-row-val">
                Clinical Chart
                <span className="sheet-row-edit">CHANGE</span>
              </span>
            </div>

            <div className="sheet-included">
              <div className="sheet-included-hdr">Includes</div>
              <div className="sheet-incl-item"><Icon name="check" size={12} stroke="#2ECC71" />AI clinical impression <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: '#FF9800', textTransform: 'uppercase' }}>AI · labeled</span></div>
              <div className="sheet-incl-item"><Icon name="check" size={12} stroke="#2ECC71" />BP · HR · Weight — avg, range, trend</div>
              <div className="sheet-incl-item"><Icon name="check" size={12} stroke="#2ECC71" />Logging consistency · {summary.compliance.pct}%</div>
            </div>

            <button className="sheet-cta">
              <Icon name="download" size={15} stroke="#fff" strokeWidth={2.2} />
              Generate PDF
            </button>
            <button className="sheet-cancel">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MOBILE: SUCCESS STATE
// ═════════════════════════════════════════════════════════════
function ReportGeneratedScreen({ summary }) {
  return (
    <div className="phone">
      <div className="phone-status">
        <span className="time">9:42</span>
        <span style={{ fontSize: 9 }}>●●●</span>
      </div>
      <div className="phone-body">
        <div className="screen-hdr">
          <div className="back-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B919C" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </div>
          <span className="screen-title">Report Ready</span>
          <span style={{ width: 60 }} />
        </div>

        <div className="success">
          <div className="success-icon">
            <Icon name="check" size={30} stroke="#2ECC71" strokeWidth={2.5} />
          </div>
          <div className="success-kicker">Generated</div>
          <div className="success-title">Your report is ready</div>
          <div className="success-sub">{summary.periodDays} days · {summary.count} readings · saved to your downloads</div>

          <div className="success-card">
            <div className="success-card-thumb">PDF</div>
            <div className="success-card-info">
              <div className="success-card-name">Hare-Health-Report-May-17.pdf</div>
              <div className="success-card-meta">2 pages · 184 KB</div>
            </div>
          </div>

          <div className="success-actions">
            <button className="success-action primary">
              <Icon name="share" size={13} stroke="#fff" />
              Share
            </button>
            <button className="success-action">
              <Icon name="fileText" size={13} />
              Open
            </button>
          </div>
        </div>

        <div className="bnav">
          <div className="bnav-item"><Icon name="home" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Home</span></div>
          <div className="bnav-item active"><Icon name="history" size={17} stroke="#F0F2F5" strokeWidth={1.5} /><span>History</span></div>
          <div className="bnav-item"><Icon name="trends" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Trends</span></div>
          <div className="bnav-item"><Icon name="user" size={17} stroke="#8B919C" strokeWidth={1.5} /><span>Profile</span></div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PDF VARIATION A — Clinical Chart (traditional EMR-style)
// ═════════════════════════════════════════════════════════════
function ReportVariationA({ summary, prefs }) {
  const s = summary;
  const heightFt = Math.floor(prefs.height / 12);
  const heightIn = prefs.height % 12;
  const bmiCalc = s.wt ? ((s.wt.last / Math.pow(prefs.height, 2)) * 703).toFixed(1) : '—';

  const periodLabel = `${fmtDate(s.firstTs)} – ${fmtDate(s.lastTs)}`;

  return (
    <div className="report">
      <div className="repA">
        {/* Letterhead */}
        <div className="repA-letterhead">
          <div className="repA-brand">
            <div className="repA-brand-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            </div>
            <div>
              <div className="repA-brand-name">Hare Health</div>
              <div className="repA-brand-sub">Patient-reported vitals · self-tracked</div>
            </div>
          </div>
          <div className="repA-meta">
            <div>Report ID · <strong>HH-2026-0517-SHA</strong></div>
            <div>Generated · <strong>May 17, 2026 · 7:58 AM</strong></div>
            <div>Period · <strong>{periodLabel}</strong></div>
          </div>
        </div>

        <div className="repA-doc-title">Patient Vitals Summary</div>
        <div className="repA-doc-sub">Self-tracked readings over {s.periodDays} days · {s.count} entries · for clinical review</div>

        {/* Patient strip */}
        <div className="repA-patient-strip">
          <div className="repA-pat-cell">
            <div className="repA-pat-lbl">Patient</div>
            <div className="repA-pat-val">{prefs.name}</div>
          </div>
          <div className="repA-pat-cell">
            <div className="repA-pat-lbl">DOB · Age</div>
            <div className="repA-pat-val">{prefs.dob} · {prefs.age}</div>
          </div>
          <div className="repA-pat-cell">
            <div className="repA-pat-lbl">Height</div>
            <div className="repA-pat-val">{heightFt}′ {heightIn}″ · {prefs.height}in</div>
          </div>
          <div className="repA-pat-cell">
            <div className="repA-pat-lbl">Current BMI</div>
            <div className="repA-pat-val">{bmiCalc} · overweight</div>
          </div>
        </div>

        {/* Section 1 — AI Impression */}
        <div className="repA-section">
          <div className="repA-section-hdr">
            <span className="repA-section-num">01</span>
            <span className="repA-section-title">Plain-language summary</span>
          </div>
          <div className="repA-ai">
            <p>Over the past <strong>{s.periodDays} days</strong>, the patient's home-measured systolic pressure averaged <strong>{fmtNum(s.sys.avg)}/{fmtNum(s.dia.avg)} mmHg</strong>, trending downward by <strong>{fmtSigned(s.sys.trend, 1)} mmHg</strong>. Resting heart rate averaged <strong>{fmtNum(s.hr.avg)} bpm</strong> (athletic range), and weight decreased by <strong>{fmtSigned(s.wt.change, 1)} lbs</strong> from {fmtNum(s.wt.first, 1)} to {fmtNum(s.wt.last, 1)} lbs.</p>
            <p>Most readings were taken in the <strong>morning while seated</strong> — context that supports comparability across the window. {s.compliance.pct}% logging consistency over the period; one outlier (May 17, HR 52 bpm) flagged but not excluded.</p>
            <div className="repA-ai-stamp">
              <span className="repA-ai-dot" />
              <span>Generated by AI · Reviewed by patient · Not a clinical interpretation</span>
            </div>
          </div>
        </div>

        {/* Section 2 — Vitals table */}
        <div className="repA-section">
          <div className="repA-section-hdr">
            <span className="repA-section-num">02</span>
            <span className="repA-section-title">Vitals summary</span>
          </div>
          <table className="repA-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Average</th>
                <th className="num">Median</th>
                <th className="num">Range</th>
                <th className="num">Trend</th>
                <th className="num">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="met-name">Systolic BP<span className="met-sub">{s.count} readings</span></td>
                <td className="num big">{fmtNum(s.sys.avg)}</td>
                <td className="num">{fmtNum(s.sys.median)}</td>
                <td className="num muted">{s.sys.min} – {s.sys.max} mmHg</td>
                <td className="num">{trendArrow(s.sys.trend)} {fmtSigned(s.sys.trend, 1)}</td>
                <td className="num"><span className="repA-flag normal">Optimal</span></td>
              </tr>
              <tr>
                <td className="met-name">Diastolic BP</td>
                <td className="num big">{fmtNum(s.dia.avg)}</td>
                <td className="num">{fmtNum(s.dia.median)}</td>
                <td className="num muted">{s.dia.min} – {s.dia.max} mmHg</td>
                <td className="num">—</td>
                <td className="num"><span className="repA-flag normal">Optimal</span></td>
              </tr>
              <tr>
                <td className="met-name">Heart rate<span className="met-sub">Resting · {s.count} readings</span></td>
                <td className="num big">{fmtNum(s.hr.avg)}</td>
                <td className="num">{fmtNum(s.hr.median)}</td>
                <td className="num muted">{s.hr.min} – {s.hr.max} bpm</td>
                <td className="num">{trendArrow(s.hr.trend)} {fmtSigned(s.hr.trend, 1)}</td>
                <td className="num"><span className="repA-flag athletic">Athletic</span></td>
              </tr>
              <tr>
                <td className="met-name">Body weight<span className="met-sub">{pickField(s.readings,'wt').length} entries</span></td>
                <td className="num big">{fmtNum(s.wt.avg, 1)}</td>
                <td className="num">—</td>
                <td className="num muted">{fmtNum(s.wt.min, 1)} – {fmtNum(s.wt.max, 1)} lbs</td>
                <td className="num">{trendArrow(s.wt.change)} {fmtSigned(s.wt.change, 1)} lbs</td>
                <td className="num"><span className="repA-flag normal">Trending↓</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 — Compliance */}
        <div className="repA-section">
          <div className="repA-section-hdr">
            <span className="repA-section-num">03</span>
            <span className="repA-section-title">Logging consistency</span>
          </div>
          <div className="repA-comp">
            <div className="repA-comp-bar-wrap">
              <div className="repA-comp-meta">
                <span>Adherence</span>
                <span><strong>{s.compliance.pct}%</strong></span>
              </div>
              <div className="repA-comp-track">
                <div className="repA-comp-fill" style={{ width: `${s.compliance.pct}%` }} />
              </div>
              <div className="repA-comp-ticks">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>
            <div className="repA-comp-stats">
              <div>
                <div className="repA-comp-stat-num">{s.compliance.daysLogged}/{s.compliance.periodDays}</div>
                <div className="repA-comp-stat-lbl">Days logged</div>
              </div>
              <div>
                <div className="repA-comp-stat-num">{s.compliance.longestStreak}</div>
                <div className="repA-comp-stat-lbl">Longest streak</div>
              </div>
              <div>
                <div className="repA-comp-stat-num">{s.compliance.totalReadings}</div>
                <div className="repA-comp-stat-lbl">Total readings</div>
              </div>
              <div>
                <div className="repA-comp-stat-num">94%</div>
                <div className="repA-comp-stat-lbl">Morning · sitting</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="repA-footer">
          <div className="repA-foot-disc">
            <strong>Important — for screening discussion only</strong>
            All values are <em>patient-reported</em> from home equipment. Hare Health is a self-tracking tool and not a substitute for clinical measurement, diagnosis, or treatment. Verify any concerning value with calibrated office equipment before acting.
          </div>
          <div className="repA-foot-sig">
            <div>Clinician signature</div>
            <span className="sig-line" />
            <div>Date · ___ / ___ / ______</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PDF VARIATION B — Card Brief (modern hybrid)
// ═════════════════════════════════════════════════════════════
function ReportVariationB({ summary, prefs }) {
  const s = summary;
  const heightFt = Math.floor(prefs.height / 12);
  const heightIn = prefs.height % 12;
  const periodLabel = `${fmtDate(s.firstTs)} – ${fmtDate(s.lastTs)}`;

  // Range bar helper: returns {bandLeft, bandWidth, avgLeft, targetLeft} as %
  const bpScale = { min: 90, max: 160, target: prefs.goal_sys };
  const hrScale = { min: 40, max: 110, target: prefs.goal_hr };
  const wtScale = { min: 200, max: 230, target: prefs.goal_wt };

  function rangeBar(min, max, avg, scale) {
    const range = scale.max - scale.min;
    const left = ((min - scale.min) / range) * 100;
    const width = ((max - min) / range) * 100;
    const avgPos = ((avg - scale.min) / range) * 100;
    const targetPos = ((scale.target - scale.min) / range) * 100;
    return { left, width, avgPos, targetPos };
  }

  const bpR = rangeBar(s.sys.min, s.sys.max, s.sys.avg, bpScale);
  const hrR = rangeBar(s.hr.min, s.hr.max, s.hr.avg, hrScale);
  const wtR = rangeBar(s.wt.min, s.wt.max, s.wt.avg, wtScale);

  return (
    <div className="report repB">
      <div className="repB-accent" />

      {/* Header */}
      <div className="repB-hdr">
        <div>
          <div className="repB-brand-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2.4" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            <span>Hare Health · Doctor Report</span>
          </div>
          <div className="repB-name">{prefs.name}</div>
          <div className="repB-period">
            <strong>{prefs.age} y · {heightFt}′{heightIn}″</strong> &nbsp;·&nbsp; {periodLabel} &nbsp;·&nbsp; {s.count} readings
          </div>
        </div>
        <div className="repB-meta">
          <div className="repB-meta-big">May 17, 2026</div>
          <div>Report ID · HH-0517-SHA</div>
          <div>Page 1 / 1</div>
        </div>
      </div>

      <div className="repB-body">
        {/* AI summary as hero card */}
        <div className="repB-ai">
          <div className="repB-ai-stamp">
            <span className="repB-ai-dot" />
            <span>AI Clinical Impression · labeled, reviewed by patient</span>
          </div>
          <div className="repB-ai-text">
            <p>Over the past <strong>{s.periodDays} days</strong>, your home BP averaged <strong>{fmtNum(s.sys.avg)}/{fmtNum(s.dia.avg)} mmHg</strong> — within optimal range and trending down <strong>{fmtSigned(s.sys.trend, 1)} mmHg</strong>. Resting HR averaged <strong>{fmtNum(s.hr.avg)} bpm</strong> (athletic range). Weight is down <strong>{fmtSigned(s.wt.change, 1)} lbs</strong>.</p>
            <p>Readings were almost entirely <strong>morning · sitting</strong> — good comparability. {s.compliance.pct}% logging consistency. One outlier flagged (HR 52, May 17) for context.</p>
          </div>
        </div>

        {/* Three vital cards */}
        <div className="repB-vitals">
          <div className="repB-vcard">
            <div className="repB-vcard-name">Blood Pressure</div>
            <div className="repB-vcard-big">
              {fmtNum(s.sys.avg)}<span style={{ color: '#94A3B8', fontWeight: 600, margin: '0 2px' }}>/</span>{fmtNum(s.dia.avg)}
              <span className="repB-vcard-unit">mmHg avg</span>
            </div>
            <div className="repB-vcard-sub">Range {s.sys.min}–{s.sys.max} / {s.dia.min}–{s.dia.max} · target {prefs.goal_sys}/{prefs.goal_dia}</div>

            <div className="repB-range">
              <div className="repB-range-track">
                <div className="repB-range-band" style={{ left: `${bpR.left}%`, width: `${bpR.width}%` }} />
                <div className="repB-range-avg" style={{ left: `${bpR.avgPos}%` }} />
                <div className="repB-range-target" style={{ left: `${bpR.targetPos}%` }} title="target" />
              </div>
              <div className="repB-range-labels">
                <span>90</span><span>120</span><span>140</span><span>160</span>
              </div>
            </div>

            <div className="repB-trend good">{trendArrow(s.sys.trend)} {fmtSigned(s.sys.trend, 1)} mmHg vs first half</div>
          </div>

          <div className="repB-vcard">
            <div className="repB-vcard-name">Heart Rate</div>
            <div className="repB-vcard-big">
              {fmtNum(s.hr.avg)}
              <span className="repB-vcard-unit">bpm avg</span>
            </div>
            <div className="repB-vcard-sub">Range {s.hr.min}–{s.hr.max} · target {prefs.goal_hr}</div>

            <div className="repB-range">
              <div className="repB-range-track">
                <div className="repB-range-band" style={{ left: `${hrR.left}%`, width: `${hrR.width}%` }} />
                <div className="repB-range-avg" style={{ left: `${hrR.avgPos}%` }} />
                <div className="repB-range-target" style={{ left: `${hrR.targetPos}%` }} />
              </div>
              <div className="repB-range-labels">
                <span>40</span><span>65</span><span>85</span><span>110</span>
              </div>
            </div>

            <div className="repB-trend good">{trendArrow(s.hr.trend)} {fmtSigned(s.hr.trend, 1)} bpm</div>
          </div>

          <div className="repB-vcard">
            <div className="repB-vcard-name">Weight</div>
            <div className="repB-vcard-big">
              {fmtNum(s.wt.last, 0)}
              <span className="repB-vcard-unit">lbs · last</span>
            </div>
            <div className="repB-vcard-sub">Range {fmtNum(s.wt.min, 1)}–{fmtNum(s.wt.max, 1)} · target {prefs.goal_wt}</div>

            <div className="repB-range">
              <div className="repB-range-track">
                <div className="repB-range-band" style={{ left: `${wtR.left}%`, width: `${wtR.width}%` }} />
                <div className="repB-range-avg" style={{ left: `${wtR.avgPos}%` }} />
                <div className="repB-range-target" style={{ left: `${wtR.targetPos}%` }} />
              </div>
              <div className="repB-range-labels">
                <span>200</span><span>210</span><span>220</span><span>230</span>
              </div>
            </div>

            <div className="repB-trend good">{trendArrow(s.wt.change)} {fmtSigned(s.wt.change, 1)} lbs total</div>
          </div>
        </div>

        {/* Compliance card */}
        <div className="repB-comp">
          <div className="repB-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1E88E5" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - s.compliance.pct / 100)}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
            </svg>
            <div className="repB-ring-num">
              <div className="repB-ring-pct">{s.compliance.pct}%</div>
              <div className="repB-ring-lbl">Adherence</div>
            </div>
          </div>
          <div className="repB-comp-right">
            <div className="repB-comp-hdr">Logging consistency · {s.periodDays}-day window</div>
            <div className="repB-comp-stats">
              <div>
                <div className="repB-comp-stat-num">{s.compliance.daysLogged}</div>
                <div className="repB-comp-stat-lbl">Days logged<br/>of {s.compliance.periodDays}</div>
              </div>
              <div>
                <div className="repB-comp-stat-num">{s.compliance.longestStreak}</div>
                <div className="repB-comp-stat-lbl">Longest streak<br/>(days)</div>
              </div>
              <div>
                <div className="repB-comp-stat-num">{s.compliance.totalReadings}</div>
                <div className="repB-comp-stat-lbl">Total readings<br/>recorded</div>
              </div>
            </div>
          </div>
          <div className="repB-context-col">
            <div className="repB-context-hdr">Measurement context</div>
            <div className="repB-context-row"><span>Morning</span><div className="repB-context-bar"><div className="repB-context-bar-fill" style={{width:'85%'}}/></div><strong>85%</strong></div>
            <div className="repB-context-row"><span>Sitting</span><div className="repB-context-bar"><div className="repB-context-bar-fill" style={{width:'96%'}}/></div><strong>96%</strong></div>
            <div className="repB-context-row"><span>Standing</span><div className="repB-context-bar"><div className="repB-context-bar-fill" style={{width:'4%'}}/></div><strong>4%</strong></div>
            <div className="repB-context-row"><span>Evening</span><div className="repB-context-bar"><div className="repB-context-bar-fill" style={{width:'15%'}}/></div><strong>15%</strong></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="repB-footer">
        <div className="repB-foot-disc">
          <strong>For screening discussion only</strong>
          All values are patient-reported from home equipment. Hare Health is a self-tracking tool, not a substitute for clinical measurement, diagnosis, or treatment.
        </div>
        <div className="repB-foot-meta">
          <div>harehealth.app</div>
          <div>Generated May 17, 2026</div>
          <div>HH-0517-SHA</div>
        </div>
      </div>
    </div>
  );
}

// Need pickField for variation A
function pickField(rs, k) { return rs.map(r => r[k]).filter(v => v != null); }

// ═════════════════════════════════════════════════════════════
// SPEC CARD
// ═════════════════════════════════════════════════════════════
function SpecCard() {
  return (
    <div className="spec">
      <div className="kicker">Doctor Report · Horizon 2</div>
      <h2>Design rationale</h2>
      <p>The Doctor Report is the artifact the user prints and brings to a 15-minute appointment. The doctor will read it in ~90 seconds. Every element earns its place on the page.</p>

      <h3>What's in scope</h3>
      <ul>
        <li><strong>Vitals summary</strong> — BP, HR, Weight as averages + ranges + trend</li>
        <li><strong>Compliance stats</strong> — adherence %, days logged, longest streak</li>
        <li><strong>AI clinical impression</strong> — plain-language paragraph, clearly labeled as AI-generated</li>
        <li><strong>Patient identity</strong> — name, age, height, BMI (minimum so the doctor knows whose chart it is)</li>
      </ul>

      <h3>What's out of scope</h3>
      <ul>
        <li>Trend charts — kept off this v1 to stay one-page</li>
        <li>Per-reading outlier table — flagged in summary, full list in History export</li>
        <li>Medications list — would need Profile fields we don't have yet</li>
        <li>Notes-before-sharing — can be added in v2 if doctors ask</li>
      </ul>

      <h3>Entry point</h3>
      <p>A persistent FAB on the History screen labeled "Doctor Report". Pulsing accent ring on first visit, settles to static after first generation. Tapping the FAB opens a confirm sheet → user confirms range/format → PDF generates → success screen with share/open.</p>

      <h3>Time range default</h3>
      <p>"Since last report" — we store <code>hh2_last_report_ts</code> after each generation. First-time users default to last 90 days. The user can change the range in the confirm sheet.</p>

      <h3>The two variations</h3>
      <ul>
        <li><strong>A · Clinical Chart</strong> — traditional EMR look. Letterhead, patient strip, dense table, clinician signature line. Doctors will recognize the format instantly.</li>
        <li><strong>B · Card Brief</strong> — modern hybrid. Hero AI summary on a dark card, three big vital cards with range bars showing min–max distribution + a target marker. The novel touch is the <strong>range bar</strong>: it shows where the patient's readings fell vs. their target, at a glance.</li>
      </ul>

      <h3>Hand-off</h3>
      <p>Once the user picks a variation, the chosen layout lives in a dedicated print container in <code>Hare Health App.html</code>. <code>generateDoctorReport()</code> assembles the print container from real readings + prefs, calls <code>window.print()</code>, and records <code>hh2_last_report_ts</code>. Existing <code>exportPDF()</code> (raw History export) stays for power users.</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MOUNT
// ═════════════════════════════════════════════════════════════
function App() {
  const summary = useMemo(() => computeSummary(SAMPLE_READINGS, SAMPLE_PREFS), []);
  return (
    <DesignCanvas>
      <DCSection
        id="mobile-flow"
        title="01 · Mobile flow"
        subtitle="Entry point on History → confirm sheet → PDF generated"
      >
        <DCArtboard id="history-fab" label="History screen · with Doctor Report FAB" width={390} height={844}>
          <HistoryScreenWithFab summary={summary} />
        </DCArtboard>
        <DCArtboard id="confirm-sheet" label="Generate sheet · range + format + includes" width={390} height={844}>
          <GenerateReportSheet summary={summary} prefs={SAMPLE_PREFS} />
        </DCArtboard>
        <DCArtboard id="success" label="Success state · share / open" width={390} height={844}>
          <ReportGeneratedScreen summary={summary} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="pdf-variations"
        title="02 · The PDF · two variations"
        subtitle="US Letter · 8.5″×11″ · designed for print"
      >
        <DCArtboard id="variant-a" label="A · Clinical Chart — traditional EMR" width={816} height={1056}>
          <ReportVariationA summary={summary} prefs={SAMPLE_PREFS} />
        </DCArtboard>
        <DCArtboard id="variant-b" label="B · Card Brief — original" width={816} height={1056}>
          <ReportVariationB summary={summary} prefs={SAMPLE_PREFS} />
        </DCArtboard>
        <DCArtboard id="variant-b-v2" label="B v2 · Branded · Trend-forward · Warm paper" width={816} height={1056}>
          <ReportVariationB2 summary={summary} prefs={SAMPLE_PREFS} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="rationale"
        title="03 · Rationale"
        subtitle="What's in, what's out, how it ships"
      >
        <DCArtboard id="spec" label="Design notes" width={560} height={840}>
          <SpecCard />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root').parentNode);
document.getElementById('root').remove();
root.render(<App />);
