import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuthLoading, selectIsAuthenticated } from '../store/auth.reducer';
import Welcome from '../components/Welcome/Welcome';
import Loading from '../components/Loading/Loading';
import Map from './Map';

const Home = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <Loading />;
  if (isAuthenticated) return <Map />;
  return <Welcome />;
};

export default Home;
