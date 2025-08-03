import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import './style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Navbar from './components/Navbar';
import Details from './components/pages/Details';
import Summary from './components/pages/Summary';
import Config from './components/pages/Config';

const queryClient = new QueryClient();

function Main() {
  return (
    <BrowserRouter basename=''>
      <div className='d-flex flex-column flex-lg-row min-vh-100'>
        <Navbar />
        <div className='flex-1 content px-2 px-lg-0'>
          <div className='container-fluid'>
            <div className='row'>
              <div className='col-12'>
                <Routes>
                  <Route path='/' element={<Summary />} />
                  <Route path='/summary' element={<Summary />} />
                  <Route path='/details' element={<Details />} />
                  <Route path='/config' element={<Config />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Toaster position='bottom-right' />
    <Main />
  </QueryClientProvider>,
);
