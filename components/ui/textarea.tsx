import * as React from 'react';

function Textarea({ className = '', ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={
        'min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        className
      }
      {...props}
    />
  );
}

export { Textarea };
