// ============================================================
// FocusPoint — Prioritization Engine
// 
// Priority = (Weighting × (1 - ConfidenceScore/5)) / DaysToExam
//
// This engine drives the "Heart" Dashboard by calculating
// which topics a student should focus on next.
// ============================================================

/**
 * Calculate days remaining until a date
 */
export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Normalize confidence score from 1-5 to 0-1
 */
function normalizeConfidence(score) {
  return Math.max(0, Math.min(1, (score - 1) / 4));
}

/**
 * Core priority formula:
 * Priority = (Weighting × (1 - NormalizedConfidence)) / DaysToExam
 * Higher priority = needs more attention
 */
export function calculatePriority(weighting, confidence, daysToExam) {
  const normalizedConf = normalizeConfidence(confidence);
  const urgency = 1 - normalizedConf;

  // Avoid division by zero — if exam is today, max urgency
  const days = Math.max(daysToExam, 0.5);

  return (weighting * urgency) / days;
}

/**
 * Get prioritized topics with full context
 */
export function getPrioritizedTopics(topics, subjects, exams) {
  const now = new Date();

  return topics
    .filter((t) => t.status !== 'mastered')
    .map((topic) => {
      const subject = subjects.find((s) => s.id === topic.subjectId);
      if (!subject) return null;

      // Find the nearest exam for this subject
      const subjectExams = exams
        .filter((e) => e.subjectId === topic.subjectId)
        .map((e) => ({ ...e, daysLeft: daysUntil(e.date) }))
        .filter((e) => e.daysLeft > 0)
        .sort((a, b) => a.daysLeft - b.daysLeft);

      const nearestExam = subjectExams[0];
      if (!nearestExam) return null;

      const priority = calculatePriority(
        subject.weighting,
        topic.confidence,
        nearestExam.daysLeft
      );

      return {
        ...topic,
        subjectName: subject.name,
        subjectColor: subject.color,
        weighting: subject.weighting,
        nearestExam: nearestExam,
        daysToExam: nearestExam.daysLeft,
        priority,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get the "Next Move" — highest priority topic
 */
export function getNextMove(topics, subjects, exams) {
  const prioritized = getPrioritizedTopics(topics, subjects, exams);
  return prioritized[0] || null;
}

/**
 * Get "Recall Zone" — 2 topics with lowest confidence that aren't mastered
 */
export function getRecallZone(topics, subjects, exams) {
  const prioritized = getPrioritizedTopics(topics, subjects, exams);
  return prioritized
    .filter((t) => t.confidence <= 2)
    .slice(0, 2);
}

/**
 * Get exam countdowns grouped by subject
 */
export function getExamCountdowns(exams, subjects) {
  return exams
    .map((exam) => {
      const subject = subjects.find((s) => s.id === exam.subjectId);
      const daysLeft = daysUntil(exam.date);
      return {
        ...exam,
        subjectName: subject?.name || 'Unknown',
        subjectColor: subject?.color || '#6366f1',
        daysLeft,
        isPast: daysLeft === 0 && new Date(exam.date) < new Date(),
        urgencyLevel: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'normal',
      };
    })
    .filter((e) => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Get today's schedule
 */
export function getTodaySchedule(timetable) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const normalized = timetable.map((entry) => {
    if (entry.start && entry.end) {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      return {
        ...entry,
        day: days[start.getDay()],
        startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        label: entry.title || entry.label || 'Session',
        type: entry.category === 'study' ? 'self-study' : (entry.category || entry.type || 'school'),
      };
    }

    return {
      ...entry,
      label: entry.label || entry.title || 'Session',
      type: entry.type || (entry.category === 'study' ? 'self-study' : (entry.category || 'school')),
    };
  });

  return normalized
    .filter((entry) => {
      if (!entry.start) return entry.day === today;

      const startDate = new Date(entry.start);
      startDate.setHours(0, 0, 0, 0);
      const repeatUntil = entry.repeatUntil ? new Date(`${entry.repeatUntil}T00:00`) : null;
      if (repeatUntil) repeatUntil.setHours(0, 0, 0, 0);

      if (entry.repeat === 'daily') {
        if (todayDate < startDate) return false;
        if (repeatUntil && todayDate > repeatUntil) return false;
        return true;
      }

      if (entry.repeat === 'weekly') {
        if (todayDate < startDate) return false;
        if (repeatUntil && todayDate > repeatUntil) return false;
        return entry.day === today;
      }

      return startDate.getTime() === todayDate.getTime();
    })
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

/**
 * Get overall progress stats
 */
export function getProgressStats(topics) {
  const total = topics.length;
  if (total === 0) return { mastered: 0, inProgress: 0, notStarted: 0, overallConfidence: 0, completionPercent: 0 };

  const mastered = topics.filter((t) => t.status === 'mastered').length;
  const notStarted = topics.filter((t) => t.status === 'not-started').length;
  const inProgress = topics.filter((t) => t.status !== 'mastered' && t.status !== 'not-started').length;
  const avgConfidence = topics.reduce((sum, t) => sum + t.confidence, 0) / total;
  const completionPercent = Math.round((mastered / total) * 100);

  return {
    total,
    mastered,
    inProgress,
    notStarted,
    overallConfidence: avgConfidence.toFixed(1),
    completionPercent,
  };
}
