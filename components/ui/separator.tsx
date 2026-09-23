import * as React from 'react';

function Separator({
  orientation = 'horizontal',
  decorative = true,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={
        (orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px') +
        ' bg-border ' +
        className
      }
      {...props}
    />
  );
}

export { Separator };
