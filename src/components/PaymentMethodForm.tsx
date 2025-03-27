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
            Security Code (CVV/CVC/CSC)
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