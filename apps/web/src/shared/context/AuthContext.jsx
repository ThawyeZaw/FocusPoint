import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@focuspoint/shared/study-data/mockDatabase';

const AuthContext = createContext(null);

function nextWeekdayDate(dayOffset = 1) {
  const date = new Date();
  const current = date.getDay();
  const distance = (dayOffset - current + 7) % 7 || 7;
  date.setDate(date.getDate() + distance);
  date.setHours(16, 0, 0, 0);
  return date;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateTime(date) {
  return `${formatDate(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function seedWeeklyStudyBlock(course, answers) {
  if (!course || !answers.weeklyStudyHours) return;
  const start = nextWeekdayDate(1);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const repeatUntil = new Date(start);
  repeatUntil.setMonth(repeatUntil.getMonth() + 6);

  db.addTimetableEntry({
    id: uuidv4(),
    title: `${course.title} study block`,
    subjectId: course.id,
    subjectName: course.title,
    category: 'study',
    start: formatDateTime(start),
    end: formatDateTime(end),
    repeat: 'weekly',
    repeatUntil: formatDate(repeatUntil),
    notes: answers.schoolHours ? `School hours: ${answers.schoolHours}` : '',
  });
}

function normalizeCourseNames(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createPrototypeSession(authUser = db.getUser()) {
  const userName = authUser?.name || authUser?.email?.split('@')[0] || 'Prototype Student';
  const user = {
    id: authUser?.id || 'prototype-user',
    email: authUser?.email || 'prototype@focuspoint.local',
    created_at: authUser?.createdAt || new Date().toISOString(),
    user_metadata: {
      full_name: userName,
    },
  };

  return {
    access_token: 'focuspoint-prototype-session',
    token_type: 'bearer',
    user,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingWorkspace] = useState(false);
  const [setupError, setSetupError] = useState('');

  const loadWorkspace = useCallback(() => {
    db.disconnectSupabase();
    const data = db.init();
    const nextSession = createPrototypeSession(data.user);
    setSession(nextSession);
    setUser(nextSession.user);
    setProfile(data.profile || db.getProfile() || { onboarding_completed: db.isOnboardingComplete() });
    setSetupError('');
    setLoading(false);
    return nextSession;
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const signUp = useCallback(async ({ name, email }) => {
    const updatedUser = db.updateUser({
      name: name || email?.split('@')[0] || 'Prototype Student',
      email: email || 'prototype@focuspoint.local',
    });
    const nextSession = createPrototypeSession(updatedUser);
    setSession(nextSession);
    setUser(nextSession.user);
    setProfile(db.getProfile() || { onboarding_completed: db.isOnboardingComplete() });
    return { user: nextSession.user, session: nextSession };
  }, []);

  const signIn = useCallback(async ({ email }) => {
    const currentUser = db.getUser();
    const updatedUser = email ? db.updateUser({ email }) : currentUser;
    const nextSession = createPrototypeSession(updatedUser);
    setSession(nextSession);
    setUser(nextSession.user);
    setProfile(db.getProfile() || { onboarding_completed: db.isOnboardingComplete() });
    return { user: nextSession.user, session: nextSession };
  }, []);

  const signOut = useCallback(async () => {
    db.disconnectSupabase();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const completeOnboarding = useCallback(async (answers) => {
    const currentUser = db.updateUser({
      name: answers.name,
      email: user?.email || answers.email || '',
      level: answers.academicLevel,
    });

    db.updateSettings({
      academicLevel: answers.academicLevel,
      examSittings: {
        mayJune2026: answers.examDate || undefined,
      },
      preferences: {
        accentColor: answers.accentColor || '#6366f1',
        rowMethod: true,
        focusMethod: true,
      },
    });

    const selectedTemplates = Array.isArray(answers.templateIds) ? answers.templateIds : [];
    selectedTemplates.forEach((templateId) => db.addCourseFromTemplate(templateId));

    const customCourseNames = normalizeCourseNames(answers.courses);
    customCourseNames.forEach((title) => {
      db.addCustomCourse({
        title,
        curriculum: answers.curriculum || answers.academicLevel || 'Custom',
        structureType: 'custom',
      });
    });

    if (db.getUserCourses().length === 0) {
      db.addCustomCourse({
        title: 'General Study',
        curriculum: answers.curriculum || answers.academicLevel || 'Custom',
        structureType: 'custom',
      });
    }

    const courses = db.getUserCourses();
    if (answers.examDate) {
      courses.forEach((course) => {
        db.addExam({
          subjectId: course.id,
          paper: `${course.title} exam`,
          date: answers.examDate,
          color: course.color,
        });
      });
    }

    seedWeeklyStudyBlock(courses[0], answers);

    const completed = db.markOnboardingComplete({
      ...answers,
      email: currentUser.email,
      completedAt: new Date().toISOString(),
    });
    setProfile(completed.profile || db.getProfile());
  }, [user?.email]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    syncingWorkspace,
    setupError,
    isAuthenticated: Boolean(session?.user),
    onboardingComplete: Boolean(profile?.onboarding_completed || db.isOnboardingComplete()),
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    refreshWorkspace: loadWorkspace,
  }), [completeOnboarding, loadWorkspace, loading, profile, session, setupError, signIn, signOut, signUp, syncingWorkspace, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
