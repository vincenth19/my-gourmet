import { useState, useEffect } from 'react';
import { Address } from '../types/database.types';

interface AddressFormProps {
  initialValues?: Partial<Address>;
  onChange: (values: Partial<Address>) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  submitButtonText?: string;
}

// Australian states and territories
const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'SA', name: 'South Australia' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'Australian Capital Territory' }
];

const AddressForm = ({
  initialValues = {},
  onChange,
  onSubmit,
  onCancel,
  disabled = false,
  className = '',
  submitButtonText = 'Save Address'
}: AddressFormProps) => {
  const [address, setAddress] = useState<Partial<Address>>({
    address_line: '',
    city: '',
    state: '',
    zip_code: '',
    access_note: '',
    ...initialValues
  });

  // Update local state when initialValues change
  useEffect(() => {
    setAddress({
      address_line: '',
      city: '',
      state: '',
      zip_code: '',
      access_note: '',
      ...initialValues
    });
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For zip_code, validate to ensure only digits and max 4 characters
    if (name === 'zip_code') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      const updatedAddress = { ...address, [name]: numericValue };
      setAddress(updatedAddress);
      onChange(updatedAddress);
      return;
    }
    
    const updatedAddress = { ...address, [name]: value };
    setAddress(updatedAddress);
    onChange(updatedAddress);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          id="address_line"
          name="address_line"
          type="text"
          value={address.address_line || ''}
          onChange={handleChange}
          disabled={disabled}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={address.city || ''}
            onChange={handleChange}
            disabled={disabled}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            id="state"
            name="state"
            value={address.state || ''}
            onChange={handleChange}
            disabled={disabled}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="" disabled>Select a state</option>
            {AUSTRALIAN_STATES.map(state => (
              <option key={state.code} value={state.code}>
                {state.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
          Postcode
        </label>
        <input
          id="zip_code"
          name="zip_code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          value={address.zip_code || ''}
          onChange={handleChange}
          disabled={disabled}
          required
          placeholder="4 digit postcode"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">4 digits only</p>
      </div>

      <div>
        <label htmlFor="access_note" className="block text-sm font-medium text-gray-700 mb-1">
          Access Notes (Optional)
        </label>
        <textarea
          id="access_note"
          name="access_note"
          value={address.access_note || ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder="E.g., Entrance code, delivery instructions, landmark..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 min-h-[80px]"
        />
      </div>

      {(onSubmit || onCancel) && (
        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              disabled={disabled}
              className="px-4 py-2 bg-navy hover:bg-navy-light text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default AddressForm; 