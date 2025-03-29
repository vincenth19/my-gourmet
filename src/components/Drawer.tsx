import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoBnw from '../assets/logo-w-text-bnw.svg';
import logoWText from '../assets/logo-w-text.svg';
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  isDark?: boolean;
}

const Drawer = ({ isOpen, onClose, children, isDark = false }: DrawerProps) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto ${isDark ? 'bg-navy text-white' : 'bg-white text-gray-900'}`}
          >
            {/* Drawer header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/20' : 'border-gray-200'}`}>
              <h2 className="text-lg font-semibold">
                <img src={isDark ? logoWText : logoBnw} alt="Logo" className="w-30" />
              </h2>
              <button 
                onClick={onClose}
                className={`p-1 rounded-full ${isDark ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}
                aria-label="Close menu"
              >
                <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-500'}`} />
              </button>
            </div>
            
            {/* Drawer content */}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Drawer; 