import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { setUser, clearUser, selectIsAuthenticated, selectAuthLoading } from '../store/auth.reducer';
import { fetchCurrentUser } from '../helpers/authHelpers';
import ContentArea from './Layout/ContentArea';
import Loading from './Loading/Loading';

const Home = lazy(() => import('../routes/Home'));
const HowItWorks = lazy(() => import('../routes/HowItWorks'));
const AboutUs = lazy(() => import('../routes/AboutUs'));
const Login = lazy(() => import('../routes/Login'));
const Register = lazy(() => import('../routes/Register'));
const Map = lazy(() => import('../routes/Map'));
const PebbleNew = lazy(() => import('../routes/PebbleNew'));
const PebbleDetail = lazy(() => import('../routes/PebbleDetail'));
const PebbleEdit = lazy(() => import('../routes/PebbleEdit'));
const Collections = lazy(() => import('../routes/Collections'));
const CollectionDetail = lazy(() => import('../routes/CollectionDetail'));
const Profile = lazy(() => import('../routes/Profile'));
const Settings = lazy(() => import('../routes/Settings'));
const Notifications = lazy(() => import('../routes/Notifications'));

const GuestOnlyRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadSession = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
    };
    loadSession();
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
      <ContentArea>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnlyRoute>
                  <Register />
                </GuestOnlyRoute>
              }
            />
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pebbles/new"
              element={
                <ProtectedRoute>
                  <PebbleNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pebbles/:id/edit"
              element={
                <ProtectedRoute>
                  <PebbleEdit />
                </ProtectedRoute>
              }
            />
            <Route path="/pebbles/:id" element={<PebbleDetail />} />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <Collections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections/:id"
              element={
                <ProtectedRoute>
                  <CollectionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/u/:username" element={<Profile />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ContentArea>
    </>
  );
};

export default App;
