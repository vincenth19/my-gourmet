interface FooterProps {
  isDark?: boolean;
}

const Footer = ({ isDark = false }: FooterProps) => {
  return (
    <footer className={`${isDark ? 'bg-gray-900 border-gray-800 border-t-gray-600 ' : 'bg-white border-t-gray-200 '} border-t mt-8`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-gray-500">
          <p className={`${isDark ? 'text-gray-400 font-light' : ''}`}>&copy; 2025 MyGourmet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 