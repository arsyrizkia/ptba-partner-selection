import Image from 'next/image';

interface PTBALogoProps {
  variant?: 'full' | 'compact';
  className?: string;
  width?: number;
  height?: number;
}

export function PTBALogo({ variant = 'full', className = '', width, height }: PTBALogoProps) {
  if (variant === 'compact') {
    return (
      <Image
        src="/ptba-logo.svg"
        alt="PT Bukit Asam Tbk"
        width={width || 140}
        height={height || 25}
        className={className}
        priority
      />
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Image
        src="/ptba-logo.svg"
        alt="PT Bukit Asam Tbk"
        width={width || 200}
        height={height || 36}
        priority
      />
    </div>
  );
}
