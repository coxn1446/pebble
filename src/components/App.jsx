import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { setUser, clearUser, selectIsAuthenticated, selectAuthLoading } from '../store/auth.reducer';
import { fetchCurrentUser } from '../helpers/authHelpers';
import Nav from './Nav/Nav';
import Loading from './Loading/Loading';

const Home = lazy(() => import('../routes/Home'));
const Login = lazy(() => import('../routes/Login'));
const Register = lazy(() => import('../routes/Register'));

const GuestOnlyRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
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
    <div className="flex min-h-dvh flex-col">
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
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
