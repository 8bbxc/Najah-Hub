import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full mt-8 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-500">© 2026 Najah Hub. Developed by Eng. Yazan Saadeh</p>
        <div className="flex items-center gap-3">
          <a href="https://www.instagram.com/eng.yazan46" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-500 transition footer-instagram">
            <img src="/instagram (1).svg" alt="Instagram" className="w-6 h-6 object-contain" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/instagram.png'; }} />
            <span className="hidden sm:inline">Instagram</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
