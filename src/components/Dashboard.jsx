import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Brain,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  BookOpen,
  ChevronRight,
  Star,
  CheckCircle2,
  Flame,
  BarChart3,
} from 'lucide-react';
import { db } from '../data/mockDatabase.js';
import {
  getNextMove,
  getRecallZone,
  getExamCountdowns,
  getTodaySchedule,
  getProgressStats,
  getPrioritizedTopics,
} from '../engine/priorityEngine.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showPriorityMobile, setShowPriorityMobile] = useState(false);
  const subjects = db.getSubjects();
  const topics = db.getTopics();
  const exams = db.getExams();
  const timetable = db.getTimetable();

  const nextMove = useMemo(() => getNextMove(topics, subjects, exams), [topics, subjects, exams]);
  const recallZone = useMemo(() => getRecallZone(topics, subjects, exams), [topics, subjects, exams]);
  const countdowns = useMemo(() => getExamCountdowns(exams, subjects), [exams, subjects]);
  const todaySchedule = useMemo(() => getTodaySchedule(timetable), [timetable]);
  const stats = useMemo(() => getProgressStats(topics), [topics]);
  const prioritized = useMemo(() => getPrioritizedTopics(topics, subjects, exams), [topics, subjects, exams]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col mb-6 sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting}, Alex
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="dashboard-chip">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
            <strong style={{ color: 'var(--text-primary)' }}>{stats.completionPercent}%</strong>
            <span>Complete</span>
          </span>
          <span className="dashboard-chip">
            <BarChart3 className="w-3.5 h-3.5 text-accent-cyan" />
            <strong style={{ color: 'var(--text-primary)' }}>{stats.overallConfidence}</strong>
            <span>Avg Confidence</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Mastered" value={stats.mastered} total={stats.total} color="#10b981" />
        <StatCard label="In Progress" value={stats.inProgress} total={stats.total} color="#f59e0b" />
        <StatCard label="Not Started" value={stats.notStarted} total={stats.total} color="#64748b" />
        <StatCard label="Total" value={stats.total} color="#6366f1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <section className="glass-card dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-accent-indigo" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Next Move</h2>
          </div>
          {nextMove ? (
            <div className="space-y-4">
              <p className="dashboard-primary-copy" style={{ color: 'var(--text-primary)' }}>{nextMove.learningOutcome}</p>
              <p className="dashboard-secondary-copy">
                {nextMove.subjectName} • {nextMove.unit} • {nextMove.topic}
              </p>
              <div className="dashboard-meta-row">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {nextMove.priority.toFixed(3)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {nextMove.daysToExam}d left
                </span>
                <ConfidenceDots score={nextMove.confidence} />
              </div>
              <button className="btn-primary text-xs touch-target w-full sm:w-auto justify-center" onClick={() => navigate('/tracker')}>
                <BookOpen className="w-3.5 h-3.5" />
                Open in Tracker
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All topics mastered.</p>
          )}
        </section>

        <section className="glass-card dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-accent-rose" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recall Zone</h2>
          </div>
          {recallZone.length > 0 ? (
            <div className="space-y-2.5">
              {recallZone.map((topic) => (
                <div
                  key={topic.id}
                  className="dashboard-list-item"
                  style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-tertiary)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="dashboard-item-primary">{topic.learningOutcome}</p>
                    <p className="dashboard-item-secondary">{topic.subjectName} • {topic.topic}</p>
                  </div>
                  <ConfidenceDots score={topic.confidence} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No low-confidence topics.</p>
          )}
        </section>

        <section className="glass-card dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent-rose" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Exam Countdown</h2>
            </div>
            <button className="btn-secondary text-xs px-3 touch-target" onClick={() => navigate('/countdown')}>
              View all
            </button>
          </div>
          <div className="space-y-3">
            {countdowns.slice(0, 4).map((exam) => {
              const maxDays = 60;
              const pct = Math.max(0, Math.min(100, ((maxDays - exam.daysLeft) / maxDays) * 100));
              const urgClass = exam.urgencyLevel === 'critical' ? 'urgency-critical' : exam.urgencyLevel === 'warning' ? 'urgency-warning' : 'urgency-normal';
              const barColor = exam.urgencyLevel === 'critical' ? '#f43f5e' : exam.urgencyLevel === 'warning' ? '#f59e0b' : '#10b981';
              return (
                <div key={exam.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {exam.subjectName} {exam.paper.split('—')[1]?.trim() || ''}
                    </span>
                    <span className={`font-semibold ${urgClass}`}>{exam.daysLeft === 0 ? 'TODAY' : `${exam.daysLeft}d`}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today</h2>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.slice(0, 5).map((entry) => (
                <div key={entry.id} className={`timetable-slot ${entry.type}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{entry.label}</span>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>{entry.startTime}–{entry.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No classes scheduled today.</p>
          )}
        </section>
      </div>

      <section className="glass-card-static" style={{ padding: 0 }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-amber" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Priority Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs py-1.5 px-3 touch-target hidden lg:inline-flex" onClick={() => navigate('/tracker')}>
              Full Tracker <ChevronRight className="w-3 h-3" />
            </button>
            <button
              className="btn-secondary text-xs py-1.5 px-3 touch-target lg:hidden"
              onClick={() => setShowPriorityMobile((prev) => !prev)}
            >
              {showPriorityMobile ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {!showPriorityMobile && (
          <div className="lg:hidden px-5 py-4 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Top Priority</p>
            {prioritized[0] ? (
              <>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{prioritized[0].learningOutcome}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {prioritized[0].subjectName} • {prioritized.length} active items
                </p>
              </>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No active items</p>
            )}
          </div>
        )}

        <div className={`${showPriorityMobile ? 'block' : 'hidden'} lg:block overflow-x-auto`}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-secondary)' }}>
                <th className="py-2.5 px-5 font-medium w-8">#</th>
                <th className="py-2.5 font-medium">Topic</th>
                <th className="py-2.5 font-medium hidden md:table-cell">Subject</th>
                <th className="py-2.5 font-medium">Conf.</th>
                <th className="py-2.5 font-medium hidden md:table-cell">Days</th>
                <th className="py-2.5 pr-5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {prioritized.slice(0, 6).map((t, i) => (
                <tr key={t.id} className="border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                  <td className="py-3 px-5 font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="py-3 pr-3">
                    <p className="font-medium truncate max-w-[240px]" style={{ color: 'var(--text-primary)' }}>{t.learningOutcome}</p>
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.subjectColor }}>{t.subjectName}</span>
                  </td>
                  <td className="py-3">
                    <ConfidenceDots score={t.confidence} compact />
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    <span className={`font-semibold ${t.daysToExam <= 7 ? 'urgency-critical' : t.daysToExam <= 14 ? 'urgency-warning' : 'urgency-normal'}`}>
                      {t.daysToExam}d
                    </span>
                  </td>
                  <td className="py-3 pr-5 text-right">
                    <span className="font-mono font-bold text-accent-indigo">{t.priority.toFixed(4)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, total, color }) {
  return (
    <div className="glass-card-static px-3 py-3 text-center dashboard-stat-card">
      <p className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {total !== undefined && total > 0 && (
        <div className="progress-bar-track mt-2 h-1.5">
          <div className="progress-bar-fill h-1.5" style={{ width: `${(value / total) * 100}%`, background: color }} />
        </div>
      )}
      <p className="text-[10px] mt-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function ConfidenceDots({ score, compact = false }) {
  const sizeClass = compact ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <span className="inline-flex items-center gap-1 shrink-0" aria-label={`Confidence ${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`${sizeClass} rounded-full`}
          style={{
            background: index < score ? 'var(--color-accent-amber)' : 'color-mix(in srgb, var(--text-muted) 40%, transparent)',
          }}
        />
      ))}
    </span>
  );
}
