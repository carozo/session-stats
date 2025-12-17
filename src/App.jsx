import { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

import icon222 from './assets/222.svg';
import icon333 from './assets/333.svg';
import icon333bf from './assets/333bf.svg';
import icon333fm from './assets/333fm.svg';
import icon333ft from './assets/333ft.svg';
import icon333mbf from './assets/333mbf.svg';
import icon333mbo from './assets/333mbo.svg';
import icon333oh from './assets/333oh.svg';
import icon444 from './assets/444.svg';
import icon444bf from './assets/444bf.svg';
import icon555 from './assets/555.svg';
import icon555bf from './assets/555bf.svg';
import icon666 from './assets/666.svg';
import icon777 from './assets/777.svg';
import iconClock from './assets/clock.svg';
import iconMagic from './assets/magic.svg';
import iconMinx from './assets/minx.svg';
import iconMmagic from './assets/mmagic.svg';
import iconPyram from './assets/pyram.svg';
import iconSkewb from './assets/skewb.svg';
import iconSq1 from './assets/sq1.svg';

const getScrTypeIcon = (scrType) => {
  if (!scrType) return null;
  const s = scrType.toLowerCase();

  if (s.startsWith('222') || s === '2x2x2') return icon222;

  if (s.includes('333bf') || s.includes('3bf') || s === 'bld') return icon333bf;
  if (s.includes('333fm') || s === 'fmc') return icon333fm;
  if (s.includes('333ft') || s === 'feet') return icon333ft;
  if (s.includes('333mbf') || s === 'mbld') return icon333mbf;
  if (s.includes('333mbo')) return icon333mbo;
  if (s.includes('333oh') || s === 'oh') return icon333oh;
  if (s.startsWith('333') || s === '3x3x3') return icon333;

  if (s.includes('444bf') || s === '4bld') return icon444bf;
  if (s.startsWith('444') || s === '4x4x4') return icon444;

  if (s.includes('555bf') || s === '5bld') return icon555bf;
  if (s.startsWith('555') || s === '5x5x5') return icon555;

  if (s.startsWith('666') || s === '6x6x6') return icon666;
  if (s.startsWith('777') || s === '7x7x7') return icon777;

  if (s.includes('clk') || s === 'clock') return iconClock;

  if (
    s.includes('mgm') ||
    s.includes('minx') ||
    s === 'megaminx' ||
    s.startsWith('mls')
  )
    return iconMinx;

  if (s.includes('pyram') || s.includes('pyr')) return iconPyram;

  if (s.includes('skewb') || s.includes('skb')) return iconSkewb;

  if (s.includes('sq1') || s.includes('sq-1') || s === 'square-1')
    return iconSq1;

  if (s === 'magic') return iconMagic;
  if (s === 'mmagic' || s.includes('master')) return iconMmagic;

  if (
    s.includes('corners') ||
    s.includes('edges') ||
    s.includes('ll') ||
    s.includes('oll') ||
    s.includes('pll') ||
    s.includes('lse') ||
    s.includes('cmll') ||
    s.includes('zbll') ||
    s.includes('coll')
  ) {
    return icon333;
  }

  return null;
};

const getEventIcon = (session) => {
  console.log(session);
  const scrType = session.scrType || '';
  const iconFromScrType = getScrTypeIcon(scrType);
  if (iconFromScrType) return iconFromScrType;

  const nameLower = session.name.toLowerCase().trim();
  const iconFromName = getScrTypeIcon(nameLower);
  if (iconFromName) return iconFromName;

  for (const keyword of [
    '222',
    '333',
    '444',
    '555',
    '666',
    '777',
    'clock',
    'minx',
    'pyram',
    'skewb',
    'sq1',
  ]) {
    if (nameLower.includes(keyword)) {
      return getScrTypeIcon(keyword);
    }
  }

  return icon333;
};

const formatTime = (ms) => {
  if (ms === null || ms === undefined || ms === -1) return 'DNF';
  if (ms === -2) return 'DNS';

  const totalSeconds = ms / 1000;

  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }

  return totalSeconds.toFixed(2);
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return num.toFixed(2);
};

const parseCsTimerData = (data) => {
  const sessions = [];

  let sessionMetadata = {};
  if (data.properties?.sessionData) {
    try {
      const parsed = JSON.parse(data.properties.sessionData);
      sessionMetadata = parsed;
    } catch (e) {
      console.warn('Could not parse sessionData:', e);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('session') && Array.isArray(value) && value.length > 0) {
      const sessionNumber = parseInt(key.replace('session', ''));
      const solves = value.map((solve, index) => {
        const [timeData, scramble, comment, timestamp] = solve;
        const [penalty, time] = timeData;

        return {
          id: `${sessionNumber}-${index}`,
          time: penalty === -1 ? -1 : time, // DNF
          penalty,
          scramble,
          comment,
          timestamp,
          date: new Date(timestamp * 1000),
        };
      });

      // Get session name from metadata, fallback to "Session X"
      const meta = sessionMetadata[sessionNumber];
      const sessionName =
        meta?.name !== undefined && meta?.name !== sessionNumber
          ? String(meta.name)
          : `Session ${sessionNumber}`;

      const scrType = meta?.opt?.scrType || '';

      sessions.push({
        id: sessionNumber,
        name: sessionName,
        scrType,
        solves,
      });
    }
  }

  return sessions.filter((s) => s.solves.length > 0);
};

const calculateLinearRegression = (data) => {
  if (data.length < 2) return null;

  const n = data.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  data.forEach((point, i) => {
    sumX += i;
    sumY += point.time;
    sumXY += i * point.time;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const calculateStdDev = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
};

const prepareChartData = (solves) => {
  const validSolves = solves.filter((s) => s.time > 0);
  const sortedByDate = [...validSolves].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const times = sortedByDate.map((s) => s.time / 1000);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = calculateStdDev(times);

  const chartData = sortedByDate.map((solve, index) => ({
    index: index + 1,
    time: solve.time / 1000, // Convert to seconds
    date: solve.date.toLocaleDateString(),
    scramble: solve.scramble,
  }));

  const regression = calculateLinearRegression(chartData);

  if (regression) {
    chartData.forEach((point, i) => {
      point.trend = regression.intercept + regression.slope * i;
    });
  }

  chartData.forEach((point, i) => {
    if (i >= 4) {
      const last5 = chartData.slice(i - 4, i + 1).map((p) => p.time);
      const sorted = [...last5].sort((a, b) => a - b);
      const trimmed = sorted.slice(1, -1);
      point.ao5 = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    if (i >= 11) {
      const last12 = chartData.slice(i - 11, i + 1).map((p) => p.time);
      const sorted = [...last12].sort((a, b) => a - b);
      const trimmed = sorted.slice(1, -1);
      point.ao12 = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    if (i >= 99) {
      const last100 = chartData.slice(i - 99, i + 1).map((p) => p.time);
      const sorted = [...last100].sort((a, b) => a - b);
      const trimCount = Math.floor(last100.length * 0.05);
      const trimmed = sorted.slice(trimCount, -trimCount);
      point.ao100 = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    point.mean = mean;
    point.stdUpper = mean + stdDev;
    point.stdLower = mean - stdDev;
  });

  return { chartData, regression, mean, stdDev };
};

const calculateStats = (sessions) => {
  const allSolves = sessions.flatMap((s) => s.solves);
  const validSolves = allSolves.filter((s) => s.time > 0);

  if (validSolves.length === 0) {
    return {
      totalSolves: 0,
      bestSingle: null,
      worstSingle: null,
      average: null,
      median: null,
      ao5: null,
      ao12: null,
      recentSolves: [],
      improvementRate: null,
      timeToSubX: null,
      solvesByDay: {},
      solvesByWeek: {},
      timeSinceLastPB: null,
      solvesSinceLastPB: null,
    };
  }

  const sortedByTime = [...validSolves].sort((a, b) => a.time - b.time);
  const bestSingle = sortedByTime[0];
  const worstSingle = sortedByTime[sortedByTime.length - 1];

  const sum = validSolves.reduce((acc, s) => acc + s.time, 0);
  const average = sum / validSolves.length;

  // Calculate median
  const mid = Math.floor(sortedByTime.length / 2);
  const median =
    sortedByTime.length % 2 === 0
      ? (sortedByTime[mid - 1].time + sortedByTime[mid].time) / 2
      : sortedByTime[mid].time;

  const calculateBestAoN = (solves, n) => {
    const validSolves = solves.filter((s) => s.time > 0);
    if (validSolves.length < n) return null;

    // Sort by timestamp to get chronological order
    const sortedByDate = [...validSolves].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    let bestAvg = Infinity;

    for (let i = n - 1; i < sortedByDate.length; i++) {
      const window = sortedByDate.slice(i - n + 1, i + 1);
      const sorted = [...window].sort((a, b) => a.time - b.time);
      const trimmed = sorted.slice(1, -1);
      const avg = trimmed.reduce((acc, s) => acc + s.time, 0) / trimmed.length;
      if (avg < bestAvg) {
        bestAvg = avg;
      }
    }

    return bestAvg === Infinity ? null : bestAvg;
  };

  const sortedByDate = [...allSolves].sort((a, b) => b.timestamp - a.timestamp);
  const sortedByDateAsc = [...validSolves].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Calculate improvement rate (ms per solve, using linear regression)
  let improvementRate = null;
  if (sortedByDateAsc.length >= 10) {
    const n = sortedByDateAsc.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    sortedByDateAsc.forEach((solve, i) => {
      sumX += i;
      sumY += solve.time;
      sumXY += i * solve.time;
      sumX2 += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    // Convert to seconds per 100 solves (negative means improving)
    improvementRate = (slope * 100) / 1000;
  }

  // Calculate time to sub-X (estimate based on current average and improvement rate)
  // Target is the next "round" time below current average (e.g., sub-20, sub-15, sub-10)
  let timeToSubX = null;
  if (improvementRate !== null && improvementRate < 0) {
    const currentAvgSeconds = average / 1000;
    // Find the next target below current average
    const targets = [
      60, 55, 50, 45, 40, 35, 30, 25, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8,
      7, 6, 5,
    ];
    const targetTime = targets.find((t) => t < currentAvgSeconds);
    if (targetTime) {
      const secondsToImprove = currentAvgSeconds - targetTime;
      // improvementRate is seconds per 100 solves (negative)
      const solvesNeeded = Math.ceil(
        (secondsToImprove / Math.abs(improvementRate)) * 100
      );
      timeToSubX = { target: targetTime, solves: solvesNeeded };
    }
  }

  // Calculate solve count by day and week
  const solvesByDay = {};
  const solvesByWeek = {};
  validSolves.forEach((solve) => {
    const date = solve.date;
    const dayKey = date.toISOString().split('T')[0];
    solvesByDay[dayKey] = (solvesByDay[dayKey] || 0) + 1;

    // Get week key (ISO week)
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const weekKey = `${date.getFullYear()}-W${weekNumber
      .toString()
      .padStart(2, '0')}`;
    solvesByWeek[weekKey] = (solvesByWeek[weekKey] || 0) + 1;
  });

  // Calculate time since last PB
  let timeSinceLastPB = null;
  let solvesSinceLastPB = null;
  if (bestSingle) {
    const pbDate = bestSingle.date;
    const now = new Date();
    const diffTime = Math.abs(now - pbDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    timeSinceLastPB = diffDays;

    // Count solves after PB
    const pbTimestamp = bestSingle.timestamp;
    solvesSinceLastPB = sortedByDateAsc.filter(
      (s) => s.timestamp > pbTimestamp
    ).length;
  }

  return {
    totalSolves: allSolves.length,
    bestSingle,
    worstSingle,
    average,
    median,
    ao5: calculateBestAoN(allSolves, 5),
    ao12: calculateBestAoN(allSolves, 12),
    recentSolves: sortedByDate.slice(0, 10),
    improvementRate,
    timeToSubX,
    solvesByDay,
    solvesByWeek,
    timeSinceLastPB,
    solvesSinceLastPB,
  };
};

const STORAGE_KEY = 'cstimer-data';

const GRAPH_OPTIONS = {
  solves: { key: 'time', label: 'Solve Times', color: '#00d4ff', dot: true },
  trend: {
    key: 'trend',
    label: 'Linear Trend',
    color: '#ff6b35',
    dashed: true,
  },
  ao5: { key: 'ao5', label: 'Ao5', color: '#22c55e' },
  ao12: { key: 'ao12', label: 'Ao12', color: '#f59e0b' },
  ao100: { key: 'ao100', label: 'Ao100', color: '#ec4899' },
  mean: { key: 'mean', label: 'Mean', color: '#a855f7', dashed: true },
  stdUpper: {
    key: 'stdUpper',
    label: '+1 Std Dev',
    color: '#6366f1',
    dashed: true,
  },
  stdLower: {
    key: 'stdLower',
    label: '-1 Std Dev',
    color: '#6366f1',
    dashed: true,
  },
};

const getInitialData = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      return parseCsTimerData(data);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }
  return [];
};

const App = () => {
  const [sessions, setSessions] = useState(getInitialData);
  const [selectedSession, setSelectedSession] = useState(() => {
    const initial = getInitialData();
    return initial.length > 0 ? initial[0].id : null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeGraphs, setActiveGraphs] = useState(['trend', 'ao5']);
  const fileInputRef = useRef(null);

  const toggleGraph = (graphKey) => {
    setActiveGraphs((prev) =>
      prev.includes(graphKey)
        ? prev.filter((k) => k !== graphKey)
        : [...prev, graphKey]
    );
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        localStorage.setItem(STORAGE_KEY, e.target.result);
        const parsedSessions = parseCsTimerData(data);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          setSelectedSession(parsedSessions[0].id);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert(
          "Error parsing file. Please make sure it's a valid csTimer JSON export."
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessions([]);
    setSelectedSession(null);
  };

  const currentSession = selectedSession
    ? sessions.find((s) => s.id === selectedSession)
    : null;

  const stats = calculateStats(currentSession ? [currentSession] : sessions);
  const allStats = calculateStats(sessions);

  const chartInfo = currentSession
    ? prepareChartData(currentSession.solves)
    : null;

  if (sessions.length === 0) {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-text">
              <span>WCA</span> Stats
            </div>
          </div>
        </header>

        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📁</div>
          <h2 className="upload-title">Upload your csTimer data</h2>
          <p className="upload-subtitle">
            Drag & drop your JSON file here, or click to browse
          </p>
          <div className="upload-hint">
            Export from csTimer: Export → Export to file
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-text">
            <span>WCA</span> Stats
          </div>
        </div>
        <div className="header-actions">
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span>📤</span> Upload New
          </button>
          <button className="clear-btn" onClick={handleClearAll}>
            <span>🗑️</span> Clear All
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <div className="header-stat-value">{allStats.totalSolves}</div>
            <div className="header-stat-label">Total Solves</div>
          </div>
          <div className="header-stat">
            <div className="header-stat-value">{sessions.length}</div>
            <div className="header-stat-label">Sessions</div>
          </div>
        </div>
      </header>

      <section className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">
            {stats.bestSingle ? formatTime(stats.bestSingle.time) : '—'}
          </div>
          <div className="stat-label">Best Single</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">
            {stats.average ? formatTime(stats.average) : '—'}
          </div>
          <div className="stat-label">Mean</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📐</div>
          <div className="stat-value">
            {stats.median ? formatTime(stats.median) : '—'}
          </div>
          <div className="stat-label">Median</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">
            {stats.ao5 ? formatTime(stats.ao5) : '—'}
          </div>
          <div className="stat-label">Best Ao5</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            {stats.ao12 ? formatTime(stats.ao12) : '—'}
          </div>
          <div className="stat-label">Best Ao12</div>
        </div>
      </section>

      <section className="advanced-stats">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">◆</span>
            Progress & Analytics
          </h2>
        </div>
        <div className="advanced-stats-grid">
          <div className="advanced-stat-card">
            <div className="advanced-stat-header">
              <span className="advanced-stat-icon">📉</span>
              <span className="advanced-stat-title">Improvement Rate</span>
            </div>
            <div className="advanced-stat-content">
              {stats.improvementRate !== null ? (
                <>
                  <div
                    className={`advanced-stat-value ${
                      stats.improvementRate < 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {stats.improvementRate < 0 ? '↓' : '↑'}{' '}
                    {formatNumber(Math.abs(stats.improvementRate))}s
                  </div>
                  <div className="advanced-stat-subtitle">per 100 solves</div>
                </>
              ) : (
                <div className="advanced-stat-value muted">Need 10+ solves</div>
              )}
            </div>
          </div>

          <div className="advanced-stat-card">
            <div className="advanced-stat-header">
              <span className="advanced-stat-icon">🎯</span>
              <span className="advanced-stat-title">Time to Sub-X</span>
            </div>
            <div className="advanced-stat-content">
              {stats.timeToSubX ? (
                <>
                  <div className="advanced-stat-value">
                    ~{stats.timeToSubX.solves.toLocaleString()} solves
                  </div>
                  <div className="advanced-stat-subtitle">
                    to reach sub-{stats.timeToSubX.target}
                  </div>
                </>
              ) : (
                <div className="advanced-stat-value muted">
                  {stats.improvementRate >= 0 ? 'Not improving' : 'Keep going!'}
                </div>
              )}
            </div>
          </div>

          <div className="advanced-stat-card">
            <div className="advanced-stat-header">
              <span className="advanced-stat-icon">🏆</span>
              <span className="advanced-stat-title">Time Since PB</span>
            </div>
            <div className="advanced-stat-content">
              {stats.timeSinceLastPB !== null ? (
                <>
                  <div className="advanced-stat-value">
                    {stats.timeSinceLastPB === 0
                      ? 'Today!'
                      : `${stats.timeSinceLastPB} day${
                          stats.timeSinceLastPB !== 1 ? 's' : ''
                        }`}
                  </div>
                  <div className="advanced-stat-subtitle">
                    {stats.solvesSinceLastPB} solve
                    {stats.solvesSinceLastPB !== 1 ? 's' : ''} ago
                  </div>
                </>
              ) : (
                <div className="advanced-stat-value muted">No PB yet</div>
              )}
            </div>
          </div>

          <div className="advanced-stat-card">
            <div className="advanced-stat-header">
              <span className="advanced-stat-icon">📅</span>
              <span className="advanced-stat-title">Solve Frequency</span>
            </div>
            <div className="advanced-stat-content">
              {Object.keys(stats.solvesByDay).length > 0 ? (
                <>
                  <div className="advanced-stat-value">
                    {Math.round(
                      stats.totalSolves / Object.keys(stats.solvesByDay).length
                    )}{' '}
                    avg/day
                  </div>
                  <div className="advanced-stat-subtitle">
                    {Object.keys(stats.solvesByDay).length} active day
                    {Object.keys(stats.solvesByDay).length !== 1
                      ? 's'
                      : ''} • {Object.keys(stats.solvesByWeek).length} week
                    {Object.keys(stats.solvesByWeek).length !== 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div className="advanced-stat-value muted">No data</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {currentSession && chartInfo && chartInfo.chartData.length > 1 && (
        <section className="graph-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">◆</span>
              Performance Graphs
            </h2>
            <div className="graph-header-right">
              <div className="graph-stats">
                <div className="graph-stat">
                  <span className="graph-stat-label">σ</span>
                  <span className="graph-stat-value">
                    {formatNumber(chartInfo.stdDev)}s
                  </span>
                </div>
                <div className="graph-stat">
                  <span className="graph-stat-label">μ</span>
                  <span className="graph-stat-value">
                    {formatNumber(chartInfo.mean)}s
                  </span>
                </div>
              </div>
              <div className="graph-session-label">{currentSession.name}</div>
            </div>
          </div>

          <div className="graph-options">
            {Object.entries(GRAPH_OPTIONS).map(([key, option]) => (
              <button
                key={key}
                className={`graph-option ${
                  activeGraphs.includes(key) ? 'active' : ''
                }`}
                onClick={() => toggleGraph(key)}
                style={{ '--option-color': option.color }}
              >
                <span
                  className="graph-option-dot"
                  style={{ background: option.color }}
                ></span>
                {option.label}
              </button>
            ))}
          </div>

          <div className="graphs-grid">
            <div className="graph-card">
              <div className="graph-header">
                <h3 className="graph-title">📈 Performance Over Time</h3>
                {activeGraphs.includes('trend') && chartInfo.regression && (
                  <div
                    className={`trend-indicator ${
                      chartInfo.regression.slope < 0 ? 'improving' : 'declining'
                    }`}
                  >
                    {chartInfo.regression.slope < 0
                      ? '↓ Improving'
                      : '↑ Slowing'}
                    <span className="trend-value">
                      {formatNumber(
                        Math.abs(chartInfo.regression.slope * 1000)
                      )}
                      ms/solve
                    </span>
                  </div>
                )}
              </div>
              <div className="graph-container">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={chartInfo.chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="index"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                      tickFormatter={(value) => Math.round(value)}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                      label={{
                        value: 'Time (s)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'rgba(255,255,255,0.5)',
                        fontSize: 12,
                      }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(26, 26, 37, 0.95)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value, name) => {
                        const option = Object.values(GRAPH_OPTIONS).find(
                          (o) => o.key === name
                        );
                        return [
                          `${formatNumber(value)}s`,
                          option?.label || name,
                        ];
                      }}
                      labelFormatter={(label) => `Solve #${label}`}
                    />

                    {activeGraphs.includes('solves') && (
                      <Line
                        type="monotone"
                        dataKey="time"
                        stroke={GRAPH_OPTIONS.solves.color}
                        strokeWidth={2}
                        dot={{
                          fill: GRAPH_OPTIONS.solves.color,
                          strokeWidth: 0,
                          r: 2,
                        }}
                        activeDot={{
                          r: 5,
                          fill: GRAPH_OPTIONS.solves.color,
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    )}
                    {activeGraphs.includes('trend') && (
                      <Line
                        type="monotone"
                        dataKey="trend"
                        stroke={GRAPH_OPTIONS.trend.color}
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('ao5') && (
                      <Line
                        type="monotone"
                        dataKey="ao5"
                        stroke={GRAPH_OPTIONS.ao5.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('ao12') && (
                      <Line
                        type="monotone"
                        dataKey="ao12"
                        stroke={GRAPH_OPTIONS.ao12.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('ao100') && (
                      <Line
                        type="monotone"
                        dataKey="ao100"
                        stroke={GRAPH_OPTIONS.ao100.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('mean') && (
                      <Line
                        type="monotone"
                        dataKey="mean"
                        stroke={GRAPH_OPTIONS.mean.color}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('stdUpper') && (
                      <Line
                        type="monotone"
                        dataKey="stdUpper"
                        stroke={GRAPH_OPTIONS.stdUpper.color}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {activeGraphs.includes('stdLower') && (
                      <Line
                        type="monotone"
                        dataKey="stdLower"
                        stroke={GRAPH_OPTIONS.stdLower.color}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="main-grid">
        <section className="events-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">◆</span>
              Sessions
            </h2>
            <div className="section-tabs">
              <button
                className={`section-tab ${
                  selectedSession === null ? 'active' : ''
                }`}
                onClick={() => setSelectedSession(null)}
              >
                All
              </button>
            </div>
          </div>
          <div className="events-grid">
            {sessions.map((session) => {
              const sessionStats = calculateStats([session]);
              return (
                <div
                  key={session.id}
                  className={`event-card ${
                    selectedSession === session.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <img
                    src={getEventIcon(session)}
                    alt={session.name}
                    className="event-icon"
                  />
                  <div className="event-name">{session.name}</div>
                  <div className="event-time">
                    {session.solves.length} solve
                    {session.solves.length !== 1 ? 's' : ''}
                  </div>
                  <div className="event-pb">
                    PB:{' '}
                    {sessionStats.bestSingle
                      ? formatTime(sessionStats.bestSingle.time)
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="sidebar">
          <div className="pb-card">
            <div className="pb-header">
              <div className="pb-badge">🏅</div>
              <div>
                <div className="pb-title">Best Single</div>
                <div className="pb-event">
                  {currentSession ? currentSession.name : 'All Sessions'}
                </div>
              </div>
            </div>
            <div className="pb-time">
              {stats.bestSingle ? formatTime(stats.bestSingle.time) : '—'}
            </div>
            {stats.bestSingle && (
              <div className="pb-scramble">
                <div className="pb-scramble-label">Scramble</div>
                <div className="pb-scramble-text">
                  {stats.bestSingle.scramble}
                </div>
              </div>
            )}
            <div className="pb-details">
              <div className="pb-detail">
                <div className="pb-detail-value">
                  {stats.average ? formatTime(stats.average) : '—'}
                </div>
                <div className="pb-detail-label">Mean</div>
              </div>
              <div className="pb-detail">
                <div className="pb-detail-value">{stats.totalSolves}</div>
                <div className="pb-detail-label">Solves</div>
              </div>
            </div>
          </div>

          <div className="sessions-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-icon">◆</span>
                Recent Solves
              </h2>
            </div>
            <div className="sessions-list">
              {stats.recentSolves.map((solve, index) => (
                <div key={solve.id} className="session-item">
                  <div
                    className={`session-rank ${
                      solve.time === stats.bestSingle?.time ? 'gold' : ''
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="session-info">
                    <div className="session-event">
                      {solve.scramble.substring(0, 20)}...
                    </div>
                    <div className="session-date">
                      {solve.date.toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className={`session-time ${solve.time === -1 ? 'dnf' : ''}`}
                  >
                    {formatTime(solve.time)}
                  </div>
                </div>
              ))}
              {stats.recentSolves.length === 0 && (
                <div className="empty-state">No solves yet</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
