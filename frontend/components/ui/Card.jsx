import React from 'react';

/**
 * Premium Editorial Card component with warm borders and restrained elevation
 */
export function Card({ children, className = '', hover = false, subtle = false, ...props }) {
  return (
    <div
      className={`${
        subtle ? 'bg-[#FAF8F5]' : 'bg-white'
      } border border-[#E7E3DC] rounded-2xl shadow-subtle transition-all duration-200 ${
        hover ? 'hover:shadow-card-hover hover:border-[#D8D2C5]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action = null,
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`px-6 py-5 border-b border-[#F0ECE4] flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <div>
        {title && (
          <h3 className="text-base font-semibold text-[#171717] tracking-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-[#6B665E] mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 bg-[#FAF8F5] border-t border-[#F0ECE4] rounded-b-2xl flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
