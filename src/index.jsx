import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { setupIonicReact } from '@ionic/react';
import rootReducer from './store/rootReducer';
import { NativeProvider } from './utils/NativeContext';
import App from './components/App.jsx';
import './index.css';

setupIonicReact({ mode: 'ios' });

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <NativeProvider>
          <App />
        </NativeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
