import { Link } from 'react-router-dom';

export default function ActionButton({ 
  children, 
  as = 'button', 
  to, 
  href, 
  className = '', 
  variant = 'default',
  ...props 
}) {
  let variantClasses = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white';
  if (variant === 'danger') variantClasses = 'bg-[#e24b4a]/10 border-[#e24b4a]/30 text-[#e24b4a] hover:bg-[#e24b4a]/20 hover:text-white';
  if (variant === 'success') variantClasses = 'bg-[#1d9e75]/10 border-[#1d9e75]/30 text-[#1d9e75] hover:bg-[#1d9e75]/20 hover:text-white';
  if (variant === 'accent') variantClasses = 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/20 hover:text-white';
  
  // Specific Scanner CTA style
  if (variant === 'scanner') {
    variantClasses = 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed';
  }

  const baseClasses = `w-full sm:w-auto min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border transition-all duration-300 font-orbitron text-[13px] sm:text-[12px] tracking-widest uppercase font-bold relative overflow-hidden group ${variantClasses}`;
  const mergedStyle = { ...props.style };

  const content = (
    <>
      {variant !== 'scanner' && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
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
