'use client';

import * as React from 'react';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used inside Tabs');
  return ctx;
}

function Tabs({
  value,
  onValueChange,
  children,
  className,
}: React.PropsWithChildren<{
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}>) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div role="tablist" className={className}>
      {children}
    </div>
  );
}

function TabsTrigger({
  value,
  children,
  className,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const tabs = useTabs();
  const active = tabs.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      className={className}
      onClick={() => tabs.onValueChange(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  children,
  className,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
