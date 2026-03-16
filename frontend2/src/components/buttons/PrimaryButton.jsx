import { Link } from 'react-router-dom';

export default function PrimaryButton({ 
  children, 
  as = 'button', 
  to, 
  href, 
  className = '', 
  colorStr = '#3b82f6', 
  colAlpha = (a) => `rgba(59, 130, 246, ${a})`,
  ...props 
}) {
  const baseClasses = `flex items-center justify-center gap-[9px] w-full sm:w-auto px-[30px] py-[13px] rounded-[13px] text-white font-orbitron text-[13px] sm:text-[10.5px] font-bold tracking-[0.12em] border border-purple-400/40 cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 min-h-[44px] sm:min-h-0`;
  const defaultStyle = { 
    background: `linear-gradient(135deg, ${colorStr}, rgba(59,130,246,1))`, 
    boxShadow: `0 4px 36px ${colAlpha(0.55)}` 
  };
  const mergedStyle = { ...defaultStyle, ...props.style };

  const content = (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[sweep_3s_ease-in-out_infinite_1.8s]" />
      <span className="relative z-10 flex items-center justify-center gap-[9px] w-full">{children}</span>
    </>
  );

  if (as === 'Link' && to) {
    return <Link to={to} className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</Link>;
  }
  if (as === 'a' && href) {
    return <a href={href} className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</a>;
  }
  return <button className={`${baseClasses} ${className}`} style={mergedStyle} {...props}>{content}</button>;
}
