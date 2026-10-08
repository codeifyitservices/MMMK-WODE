import { memo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

import { FiRefreshCw } from 'react-icons/fi';

export const RefreshButton = memo(({ onClick, loading = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center justify-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50',
        className
      )}
      title="Refresh Data"
    >
      <FiRefreshCw className={cn('w-5 h-5 text-gray-600', loading ? 'animate-spin' : '')} />
    </button>
  );
});

export const Button1 = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    uppercase = true,
    children,
  }) => {
    const fullClassName = cn(
      'px-8 py-1.5 text-sm text-white transition duration-300 border-2 border-orange-200 md:px-12 sm:px-16 sm:py-3 hover:bg-orange-200 hover:text-black',
      className,
      uppercase ? 'uppercase' : ''
    );
    return isLink ? (
      <Link to={to} className={fullClassName}>
        {children}
      </Link>
    ) : (
      <button className={fullClassName} onClick={onClick}>
        {children}
      </button>
    );
  }
);

export const Button2 = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    uppercase = true,
    children,
  }) => {
    const fullClassName = cn(
      'px-6 py-2 font-semibold border-2 md:text-lg text-xs border-[var(--primary-dark)] rounded-sm text-[var(--primary-dark)] hover:bg-[var(--primary-dark)] hover:text-white transition duration-300 sm:px-10 sm:py-3 md:px-12 md:py-3 lg:px-16 lg:py-4',
      className,
      uppercase ? 'uppercase' : ''
    );
    return isLink ? (
      <Link to={to} className={fullClassName}>
        {children}
      </Link>
    ) : (
      <button className={fullClassName} onClick={onClick}>
        {children}
      </button>
    );
  }
);

export const Button3 = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    uppercase = true,
    children,
  }) => {
    const fullClassName = cn(
      'px-6 py-2 font-medium border md:text-lg text-xs border-[var(--primary-dark)] rounded-sm text-[var(--primary-dark)] hover:bg-[var(--primary-dark)] hover:text-white transition duration-300 sm:px-10 sm:py-3 md:px-12 md:py-3 lg:px-16 lg:py-4',
      className,
      uppercase ? 'uppercase' : ''
    );
    return isLink ? (
      <Link to={to} className={fullClassName}>
        {children}
      </Link>
    ) : (
      <button className={fullClassName} onClick={onClick}>
        {children}
      </button>
    );
  }
);

export const Button4 = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    children,
    uppercase = true,
    ...props
  }) => {
    const fullClassName = cn(
      'px-12 py-3 border-2 border-white text-white hover:bg-white hover:text-[var(--primary-light)] transition-colors duration-300 tracking-wider relative top-8',
      className,
      uppercase ? 'uppercase' : ''
    );
    return isLink ? (
      <Link to={to} className={fullClassName} {...props}>
        {children}
      </Link>
    ) : (
      <button className={fullClassName} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }
);

export const Button5 = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    uppercase = true,
    children,
  }) => {
    const fullClassName = cn(
      'px-6 py-2 font-medium border md:text-lg text-xs border-black rounded-sm text-black hover:bg-black hover:text-white transition duration-300 sm:px-10 sm:py-3 md:px-12 md:py-3 lg:px-16 lg:py-4',
      className,
      uppercase ? 'uppercase' : ''
    );
    return isLink ? (
      <Link to={to} className={fullClassName}>
        {children}
      </Link>
    ) : (
      <button className={fullClassName} onClick={onClick}>
        {children}
      </button>
    );
  }
);

export const CommonButton = memo(
  ({
    onClick,
    className = '',
    isLink = false,
    to = '',
    uppercase = true,
    variant = 1,
    size = 'base',
    disabled = false,
    children,
    ...props
  }) => {
    const fullClassName = cn(
      variantClasses[variant] || variantClasses[1],
      sizeClasses[size] || sizeClasses.base,
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      uppercase ? 'uppercase' : '',
      'text-center',
      className
    );
    return isLink ? (
      <Link to={to} className={fullClassName} {...props}>
        {children}
      </Link>
    ) : (
      <button
        disabled={disabled}
        className={fullClassName}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

const sizeClasses = {
  base: 'px-6 py-2 font-medium md:text-lg text-xs sm:px-10 sm:py-3 md:px-12 md:py-3 lg:px-16 lg:py-4',
  xs: 'px-2 py-1 text-sm md:px-4 md:py-2',
  sm: 'px-4 py-1.5 text-sm md:px-8 md:py-2',
  md: 'px-4 py-2 md:text-lg text-xs md:px-8 md:py-3',
  lg: 'px-8 py-3 text-lg md:px-12 md:py-4',
};

const variantClasses = {
  1: 'text-white transition duration-300 border-2 border-orange-200 hover:bg-orange-200 hover:text-black',
  2: 'border border-[var(--primary-dark)] rounded-sm text-[var(--primary-dark)] hover:bg-[var(--primary-dark)] hover:text-white transition duration-300',
  3: 'border border-[var(--primary-dark)] rounded-sm text-[var(--primary-dark)] hover:bg-[var(--primary-dark)] hover:text-white transition duration-300',
  4: 'border-2 border-white text-white hover:bg-white hover:text-[var(--primary-light)] transition-colors duration-300 tracking-wider',
  5: 'border border-black rounded-sm text-black hover:bg-black hover:text-white transition duration-300',
  6: 'border border-black rounded-sm hover:text-black bg-black hover:bg-transparent text-white transition duration-300',
  7: 'text-black transition duration-300 border-2 border-orange-200 bg-orange-200',
  danger1:
    'border border-red-500 rounded-sm hover:text-white bg-transparent hover:bg-red-500 text-red-500 transition duration-300',
  primary1:
    'border border-[var(--primary-dark)] rounded-sm hover:text-white bg-transparent hover:bg-[var(--primary-dark)] text-[var(--primary-dark)] transition duration-300',
};
