import { Link } from 'react-router-dom';

export default function IconButton({ 
  icon: Icon,
  className = '', 
  iconClassName = 'w-5 h-5 sm:w-4 sm:h-4',
  onClick,
  disabled = false,
  as = 'button',
  to,
  href,
  "aria-label": ariaLabel = "Action button",
  ...props
}) {
  const baseClasses = `w-[44px] h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border`;
  
  // Default circular subtle ghost button variant
  const variantClasses = `bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95`;

  const mergedStyle = { ...props.style };
  const content = <Icon className={`${iconClassName} shrink-0 pointer-events-none`} />;

  if (as === 'Link' && to) {
    return <Link to={to} className={`${baseClasses} ${variantClasses} ${className}`} style={mergedStyle} aria-label={ariaLabel} {...props}>{content}</Link>;
  }
  if (as === 'a' && href) {
    return <a href={href} className={`${baseClasses} ${variantClasses} ${className}`} style={mergedStyle} aria-label={ariaLabel} {...props}>{content}</a>;
  }

  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={mergedStyle}
      {...props}
    >
      {content}
    </button>
  );
}
