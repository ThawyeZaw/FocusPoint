import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient.js';
import { db } from '../data/mockDatabase.js';

const AuthContext = createContext(null);

function getAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
}

function nextWeekdayDate(dayOffset = 1) {
  const date = new Date();
  const current = date.getDay();
  const distance = (dayOffset - current + 7) % 7 || 7;
  date.setDate(date.getDate() + distance);
  date.setHours(16, 0, 0, 0);
  return date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return date.toISOString().slice(0, 16);
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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState('');

  const loadWorkspace = useCallback(async (nextSession) => {
    setSession(nextSession);
    setUser(nextSession?.user || null);
    setSetupError('');

    if (!nextSession?.user) {
      db.disconnectSupabase();
      setProfile(null);
      setLoading(false);
      return;
    }

    db.connectSupabase({ supabase, user: nextSession.user });
    try {
      const data = await db.hydrateFromSupabase();
      setProfile(data.profile || db.getProfile());
    } catch (error) {
      console.error('Supabase workspace load failed:', error);
      setSetupError(error.message || 'Supabase workspace is not ready yet.');
      db.createEmptyWorkspace(null, nextSession.user);
      setProfile(db.getProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setSetupError(error.message);
        setLoading(false);
        return;
      }
      loadWorkspace(data.session);
    });

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setLoading(true);
      loadWorkspace(nextSession);
    });

    return () => {
      isMounted = false;
      subscriptionData.subscription.unsubscribe();
    };
  }, [loadWorkspace]);

  const signUp = useCallback(async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: { full_name: name },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    db.disconnectSupabase();
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
    await db.saveLocalToSupabase();
    setProfile(completed.profile || db.getProfile());
  }, [user?.email]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    setupError,
    isAuthenticated: Boolean(session?.user),
    onboardingComplete: Boolean(profile?.onboarding_completed || db.isOnboardingComplete()),
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    refreshWorkspace: () => loadWorkspace(session),
  }), [completeOnboarding, loadWorkspace, loading, profile, session, setupError, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
