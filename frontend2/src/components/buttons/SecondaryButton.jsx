import { Link } from 'react-router-dom';

export default function SecondaryButton({ 
  children, 
  as = 'button', 
  to, 
  href, 
  className = '', 
  colAlpha = (a) => `rgba(167, 139, 250, ${a})`,
  accentColor = 'rgba(196,181,253, 1)',
  ...props 
}) {
  const baseClasses = `flex items-center justify-center gap-[9px] w-full sm:w-auto px-[30px] py-[13px] rounded-[13px] font-orbitron text-[13px] sm:text-[10.5px] font-bold tracking-[0.12em] border cursor-pointer transition-all duration-300 hover:bg-white/10 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(196,181,253,0.2)] hover:border-white/30 min-h-[44px] sm:min-h-0`;
  const defaultStyle = { 
    background: colAlpha(0.07), 
    color: accentColor, 
    borderColor: colAlpha(0.3) 
  };
  const mergedStyle = { ...defaultStyle, ...props.style };

  const content = <span className="flex items-center justify-center gap-[9px]">{children}</span>;

  if (as === 'Link' && to) {
    return <Link to={to} className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</Link>;
  }
  if (as === 'a' && href) {
    return <a href={href} className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</a>;
  }
  return <button className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</button>;
}
