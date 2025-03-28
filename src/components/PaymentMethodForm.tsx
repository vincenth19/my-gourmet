import { useState, useEffect } from 'react';
import { PaymentMethod } from '../types/database.types';

export interface PaymentMethodFormProps {
  initialValues?: Partial<PaymentMethod>;
  onChange: (values: Partial<PaymentMethod>) => void;
  disabled?: boolean;
  className?: string;
}

const PaymentMethodForm = ({ initialValues = {}, onChange, disabled = false, className = '' }: PaymentMethodFormProps) => {
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1); // JavaScript months are 0-indexed
  const [expiryMonth, setExpiryMonth] = useState<string>('');
  const [expiryYear, setExpiryYear] = useState<string>('');
  const [formValues, setFormValues] = useState<Partial<PaymentMethod>>({
    name_on_card: '',
    card_number: '',
    expiry_date: '',
    cvv: '',
    ...initialValues
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse initial expiry date
  useEffect(() => {
    if (initialValues.expiry_date) {
      const [month, year] = initialValues.expiry_date.split('/');
      if (month) setExpiryMonth(month);
      if (year) setExpiryYear(year);
    }
  }, [initialValues.expiry_date]);

  // Validate the form inputs
  const validateField = (name: string, value: string): string => {
    if (!value) return 'This field is required';

    switch (name) {
      case 'card_number':
        if (!/^\d+$/.test(value)) return 'Card number must contain only digits';
        if (value.length !== 16) return 'Card number must be 16 digits';
        break;
      case 'cvv':
        if (!/^\d+$/.test(value)) return 'CVV must contain only digits';
        if (value.length !== 3) return 'CVV must be 3 digits';
        break;
      case 'expiry_date':
        if (!value.includes('/')) return 'Invalid expiry date format';
        const [month, year] = value.split('/');
        const expMonth = parseInt(month, 10);
        const expYear = parseInt(`20${year}`, 10);
        
        if (isNaN(expMonth) || isNaN(expYear)) return 'Invalid expiry date';
        if (expMonth < 1 || expMonth > 12) return 'Invalid month';
        
        // Check if date is in the past
        const currentYearNum = currentYear;
        const currentMonthNum = currentMonth;
        
        if (expYear < currentYearNum || (expYear === currentYearNum && expMonth < currentMonthNum)) {
          return 'Expiry date cannot be in the past';
        }
        break;
    }
    return '';
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For card number and CVV, only allow digits
    if (name === 'card_number' || name === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit card number to 16 digits and CVV to 3 digits
      const limitedValue = name === 'card_number' 
        ? digitsOnly.slice(0, 16) 
        : digitsOnly.slice(0, 3);
      
      // Only update if the value is all digits or empty
      if (value === '' || value === limitedValue) {
        const newValues = { ...formValues, [name]: limitedValue };
        setFormValues(newValues);
        
        // Validate the field
        const error = validateField(name, limitedValue);
        setErrors(prev => ({ ...prev, [name]: error }));
        
        onChange(newValues);
      }
    } else {
      const newValues = { ...formValues, [name]: value };
      setFormValues(newValues);
      
      // Validate the field
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
      
      onChange(newValues);
    }
  };

  // Handle expiry date dropdowns
  const handleExpiryChange = (type: 'month' | 'year', value: string) => {
    if (type === 'month') {
      setExpiryMonth(value);
    } else {
      setExpiryYear(value);
    }
    
    // Update the expiry date based on selected month and year
    const newExpiryDate = type === 'month' 
      ? `${value}/${expiryYear}` 
      : `${expiryMonth}/${value}`;
    
    const newValues = { ...formValues, expiry_date: newExpiryDate };
    setFormValues(newValues);
    
    // Validate the expiry date
    const error = validateField('expiry_date', newExpiryDate);
    setErrors(prev => ({ ...prev, expiry_date: error }));
    
    onChange(newValues);
  };

  // Check if month/year combination is in the past
  const isExpiryInvalid = (month: string, year: string): boolean => {
    if (!month || !year) return false;
    
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(`20${year}`, 10);
    
    return expYear < currentYear || (expYear === currentYear && expMonth < currentMonth);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="name_on_card" className="block text-sm font-medium text-gray-700 mb-1">
          Name on Card
        </label>
        <input
          id="name_on_card"
          name="name_on_card"
          type="text"
          value={formValues.name_on_card || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-navy focus:border-transparent"
          placeholder="John Doe"
          disabled={disabled}
          required
        />
        {errors.name_on_card && (
          <p className="mt-1 text-sm text-red-600">{errors.name_on_card}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number (16 digits)
        </label>
        <div className="relative">
          <input
            id="card_number"
            name="card_number"
            type="text"
            value={formValues.card_number || ''}
            onChange={handleChange}
            className={`w-full px-4 py-3 border focus:ring-2 focus:ring-navy focus:border-transparent ${
              errors.card_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1234567890123456"
            disabled={disabled}
            required
            maxLength={16}
            inputMode="numeric"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Visa Card Icon */}
            <svg className="h-6 w-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 0H740C762.1 0 780 17.9 780 40V460C780 482.1 762.1 500 740 500H40C17.9 500 0 482.1 0 460V40C0 17.9 17.9 0 40 0Z" fill="#1A1F71"/>
              <path d="M286.9 199.1L241 330.3H209.3L186.2 227.9C184.9 222.4 183.8 220.3 179.2 217.8C171.8 213.8 160 210.2 150 207.7L151 199.2H202.8C208.8 199.2 214.3 203.3 215.6 210.3L227.6 282.2L255.7 199.2H286.9V199.1ZM506.9 273.7C507 245.6 467.1 244.3 467.4 230.3C467.5 225.7 471.9 220.8 482.1 219.4C487.3 218.8 502 218.4 518.9 226L525.7 200.5C516.6 196.6 504.9 193 491 193C461.7 193 440.6 209.2 440.4 232.7C440.1 249.5 455.2 258.6 466.5 264.1C478.2 269.7 482.1 273.3 482 278.3C481.9 286.2 472.5 289.6 463.8 289.7C448.4 289.9 439.4 285.1 432.2 281.5L425.2 308C432.5 311.5 446.4 314.5 460.9 314.6C492.2 314.6 512.9 298.6 513 273.5L506.9 273.7V273.7ZM587.8 330.3H616L587.2 199.2H561.6C556.4 199.2 551.9 202.3 550 207.1L501.7 330.3H532.9L539.9 311.9H580.4L587.8 330.3ZM549.7 287.3L566.1 239.6L576 287.3H549.7ZM377.3 199.2L353.2 330.3H323.7L347.9 199.2H377.3Z" fill="white"/>
            </svg>
            
            {/* Mastercard Icon */}
            <svg className="h-6 w-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 0H740C762.1 0 780 17.9 780 40V460C780 482.1 762.1 500 740 500H40C17.9 500 0 482.1 0 460V40C0 17.9 17.9 0 40 0Z" fill="white"/>
              <path d="M449.9 250.8C449.9 322.2 392.9 380 322.5 380C252.1 380 195.1 322.2 195.1 250.8C195.1 179.4 252.1 121.6 322.5 121.6C392.9 121.6 449.9 179.4 449.9 250.8Z" fill="#EB001B"/>
              <path d="M584.9 250.8C584.9 322.2 527.9 380 457.5 380C387.1 380 330.1 322.2 330.1 250.8C330.1 179.4 387.1 121.6 457.5 121.6C527.9 121.6 584.9 179.4 584.9 250.8Z" fill="#F79E1B"/>
              <path d="M390 174.5C363.7 203.2 353.8 234 362.2 277.3C352.5 236.4 361.6 204.5 390 174.5Z" fill="#FF5F00"/>
              <path d="M390 174.5C416.3 203.2 426.2 234 417.8 277.3C427.5 236.4 418.4 204.5 390 174.5Z" fill="#FF5F00"/>
            </svg>
          </div>
        </div>
        {errors.card_number && (
          <p className="mt-1 text-sm text-red-600">{errors.card_number}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={expiryMonth}
              onChange={(e) => handleExpiryChange('month', e.target.value)}
              className={`px-3 py-3 border focus:ring-2 focus:ring-navy focus:border-transparent ${
                errors.expiry_date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={disabled}
              required
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }).map((_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                const isInvalidCombination = expiryYear && isExpiryInvalid(month, expiryYear);
                return (
                  <option key={month} value={month} disabled={isInvalidCombination || undefined}>
                    {month}
                  </option>
                );
              })}
            </select>
            
            <select
              value={expiryYear}
              onChange={(e) => handleExpiryChange('year', e.target.value)}
              className={`px-3 py-3 border focus:ring-2 focus:ring-navy focus:border-transparent ${
                errors.expiry_date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={disabled}
              required
            >
              <option value="">Year</option>
              {Array.from({ length: 11 }).map((_, i) => {
                const year = (currentYear + i).toString().slice(-2);
                return (
                  <option key={year} value={year}>
                    {currentYear + i}
                  </option>
                );
              })}
            </select>
          </div>
          {errors.expiry_date && (
            <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            id="cvv"
            name="cvv"
            type="password"
            value={formValues.cvv || ''}
            onChange={handleChange}
            className={`w-full px-4 py-3 border focus:ring-2 focus:ring-navy focus:border-transparent ${
              errors.cvv ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="•••"
            disabled={disabled}
            required
            maxLength={3}
            inputMode="numeric"
          />
          {errors.cvv && (
            <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodForm; 