import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import AppContext from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const THEME_KEY = 'moodify_theme';

const applyThemeToDocument = (theme) => {
  try {
    // DaisyUI
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    
    if (theme === 'dark') document.documentElement.classList.add('moodify-dark');
    else document.documentElement.classList.remove('moodify-dark');

    
    document.documentElement.style.setProperty('--moodify-bg', theme === 'dark' ? '#0f172a' : '#ffffff');
    document.documentElement.style.setProperty('--moodify-text', theme === 'dark' ? '#e5e7eb' : '#0f172a');
  } catch (e) {
    
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContext);

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp');
      if (data.success) {
        navigate('/email-verify');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/logout');
      data.success && setIsLoggedin(false);
      data.success && setUserData(false);
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Theme state
  const [theme, setTheme] = useState(() => {
    try {
      const s = localStorage.getItem(THEME_KEY);
      if (s === 'dark' || s === 'light') return s;
    } catch {}
    return 'light';
  });

  // on mount, apply saved/initial theme
  useEffect(() => {
    applyThemeToDocument(theme);
  }, []); // run only once

  // persist/apply whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    applyThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <header className="w-full absolute top-0 left-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4 sm:p-6">
        {/* left: logo */}
        <img
          onClick={() => navigate('/')}
          src={assets.logo}
          alt="logo"
          className="w-28 sm:w-32 cursor-pointer"
        />

        {/* right part */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="btn btn-ghost btn-circle tooltip tooltip-bottom"
            data-tip={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Your existing auth UI (unchanged logic) */}
          {userData ? (
            <div className="w-8 h-8 flex justify-center items-center rounded-full bg-black text-white relative group">
              {userData.name ? userData.name[0].toUpperCase() : 'U'}
              <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
                <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                  {!userData.isAccountVerified && (
                    <li onClick={sendVerificationOtp} className="py-1 px-2 hover:bg-gray-200 cursor-pointer">
                      Verify email
                    </li>
                  )}
                  <li onClick={logout} className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10">
                    Logout
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="
                flex items-center gap-2
                mt-2
                px-8 py-3
                text-base font-medium
                rounded-full
                border border-gray-300
                text-gray-800
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-md
                hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500
                hover:text-white
                active:translate-y-0
              "
            >
              Login
              <img src={assets.arrow_icon} alt="arrow" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
