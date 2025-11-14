import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, CheckSquare, List, FileText, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validateEmail, validatePassword } from '../utils/validation';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const Login = () => {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState({
    email: null,
    password: null,
  });
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate on change if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (fieldName, value) => {
    let error = null;
    switch (fieldName) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [fieldName]: error });
    return error;
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setIsLoading(true);
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result) {
        toast.success('Login successful!');
        // Wait a bit for Redux state to update, then navigate
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-login-cream">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-cream-light items-center justify-center p-12">
        <div className="max-w-md w-full">
          {/* Character Illustration */}
          <div className="bg-cream rounded-3xl p-12 mb-8">
            <div className="flex justify-center">
              <div className="relative w-40 h-48">
                {/* Character Head */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-28 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FCD34D' }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-3">
                      <div className="w-2.5 h-2.5 bg-brown-dark rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-brown-dark rounded-full"></div>
                    </div>
                    <div className="w-14 h-7 border-2 border-brown-dark rounded-full border-t-0"></div>
                  </div>
                </div>
                {/* Character Body - Raised Arm (waving) */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-14 h-1 bg-brown-dark rotate-[135deg] rounded-full origin-left"></div>
                </div>
                {/* Character Body - Looped Arm */}
                <div className="absolute top-20 right-1/2 transform translate-x-1/2 -translate-y-1/2">
                  <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-6 h-6 border-2 border-brown-dark rounded-full border-r-0 border-b-0"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-2 border-brown-dark rounded-full border-l-0 border-t-0"></div>
                    <div className="absolute top-3 left-3 w-6 h-6 border-2 border-brown-dark rounded-full"></div>
                  </div>
                </div>
                {/* Character Legs */}
                <div className="absolute top-32 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-1 bg-brown-dark rotate-12 rounded-full"></div>
                </div>
                <div className="absolute top-32 left-1/2 transform translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-1 bg-brown-dark -rotate-12 rounded-full"></div>
                </div>
                {/* Hands and Feet */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -ml-12 w-5 h-5 bg-tan rounded-full"></div>
                <div className="absolute top-16 right-1/2 transform translate-x-1/2 -translate-y-1/2 mr-2 w-5 h-5 bg-tan rounded-full"></div>
                <div className="absolute top-36 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -ml-10 w-5 h-5 bg-tan rounded-full"></div>
                <div className="absolute top-36 left-1/2 transform translate-x-1/2 -translate-y-1/2 ml-10 w-5 h-5 bg-tan rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Connected Icons with Blob Background */}
          <div className="flex justify-center">
            <div className="relative bg-primary-100 rounded-full px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-tan rounded-full flex items-center justify-center shadow-sm">
                  <FileText className="text-brown-dark" size={20} />
                </div>
                <div className="w-0.5 h-6 bg-brown-light"></div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FCD34D' }}>
                  <CheckSquare className="text-brown-dark" size={20} />
                </div>
                <div className="w-0.5 h-6 bg-brown-light"></div>
                <div className="w-14 h-14 bg-tan rounded-full flex items-center justify-center shadow-sm">
                  <List className="text-brown-dark" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <img src={logo} alt="TaskFlow" className="w-14 h-14 object-contain" />
              <h1 className="text-4xl font-serif font-bold text-brown-dark">TaskFlow</h1>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-brown mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full px-4 py-3.5 bg-cream-input rounded-2xl focus:outline-none focus:ring-2 transition-all text-brown-dark placeholder-brown-light ${
                      errors.email && touched.email
                        ? 'border-2 border-red-500 focus:ring-red-500'
                        : !errors.email && touched.email && formData.email
                        ? 'border-2 border-green-500 focus:ring-green-500'
                        : 'border-0 focus:ring-primary-500'
                    }`}
                    placeholder="Your email"
                  />
                  {touched.email && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {errors.email ? (
                        <AlertCircle size={20} className="text-red-500" />
                      ) : !errors.email && formData.email ? (
                        <CheckCircle2 size={20} className="text-green-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-brown mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-4 py-3.5 pr-12 bg-cream-input rounded-2xl focus:outline-none focus:ring-2 transition-all text-brown-dark placeholder-brown-light ${
                      errors.password && touched.password
                        ? 'border-2 border-red-500 focus:ring-red-500'
                        : !errors.password && touched.password && formData.password
                        ? 'border-2 border-green-500 focus:ring-green-500'
                        : 'border-0 focus:ring-primary-500'
                    }`}
                    placeholder="Your password"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {/* Password visibility toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-brown-light hover:text-brown-dark transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                    {/* Validation icon */}
                    {touched.password && (
                      <>
                        {errors.password ? (
                          <AlertCircle size={20} className="text-red-500" />
                        ) : !errors.password && formData.password ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-brown-dark py-3.5 rounded-2xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#FCD34D' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FACC15'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FCD34D'}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-cream-input">
              <p className="text-xs text-center text-brown-light mb-3 font-medium">Demo Credentials</p>
              <div className="bg-cream-input rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brown-light font-medium">Admin:</span>
                  <span className="text-brown-dark font-mono text-xs">admin@taskflow.com</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brown-light font-medium">Password:</span>
                  <span className="text-brown-dark font-mono text-xs">admin123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

