// src/components/Register.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LocationSelector from './LocationSelector';
import type { LocationData, RegisterData } from '../../types';

const Register: React.FC = () => {
  // const [formData, setFormData] = useState<RegisterData>({
  //   nationalId: '',
  //   email: '',
  //   phone: '',
  //   password: '',
  //   confirmPassword: '',
  //   county: '',
  //   division: '',
  //   pollingStation: ''
  // });
  const [formData, setFormData] = useState<RegisterData>({
    nationalId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    countyId: null,
    countyName: '',
    subCountyId: null,
    subCountyName: '',
    wardId: null,
    wardName: '',
    pollingStation: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // National ID validation (example for Kenya)
    if (!/^\d{8}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'Valid National ID required (8 digits)';
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email required';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // if (!formData.pollingStation) {
    //   newErrors.pollingStation = 'Polling station selection required';
    // }

    if (!formData.pollingStation) {
      newErrors.pollingStation = 'Polling station selection required';
    }

    if (!formData.wardId) {
      newErrors.ward = 'Ward selection required';
    }
    if (!formData.subCountyId) {
      newErrors.division = 'Sub county selection required';
    }
    if (!formData.countyId) {
      newErrors.county = 'County selection required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData);
      // Show success message and redirect
      navigate('/login', {
        state: {
          message: 'Registration successful! Please check your email to verify your account.'
        }
      });
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Registration failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationSelect = useCallback((locationData: LocationData): void => {
    setFormData(prev => ({
      ...prev,
      ...locationData
    }));
  }, []);

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Voter Registration</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nationalId">National ID *</label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              placeholder="Enter your 8-digit National ID"
              className={errors.nationalId ? 'error' : ''}
              required
            />
            {errors.nationalId && <span className="error-message">{errors.nationalId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <LocationSelector onSelect={handleLocationSelect} errors={errors} />

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              className={errors.password ? 'error' : ''}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className={errors.confirmPassword ? 'error' : ''}
              required
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="login-link">
          Already registered? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;