// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="text-4xl font-bold text-gray-800 font-tamil mb-3">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 font-tamil mb-2">பக்கம் கண்டுபிடிக்கப்படவில்லை</h2>
      <p className="text-gray-400 font-tamil mb-8">Page not found</p>
      <Link to="/"
        className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a1a2e] text-white rounded-2xl font-tamil text-sm hover:bg-[#16213e] transition-colors shadow-lg">
        🏠 முகப்புக்கு திரும்பு / Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
