import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'sweetalert2/dist/sweetalert2.min.css'; 
import './styles/SweetAlert.scss'
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
