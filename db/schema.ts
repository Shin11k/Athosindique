import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const people = pgTable(
  'people',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    cpf: text('cpf').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    code: text('code').notNull(),
    parent: text('parent'),
    role: text('role').notNull().default('member'),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cpfUnique: uniqueIndex('people_cpf_unique').on(table.cpf),
    emailUnique: uniqueIndex('people_email_unique').on(table.email),
    codeUnique: uniqueIndex('people_code_unique').on(table.code),
  }),
);

export const leads = pgTable(
  'leads',
  {
    id: text('id').primaryKey(),
    referrer: text('referrer').notNull(),
    parentName: text('parent_name').notNull(),
    parentCpf: text('parent_cpf'),
    parentEmail: text('parent_email'),
    phone: text('phone').notNull(),
    childName: text('child_name'),
    childCpf: text('child_cpf'),
    grade: text('grade'),
    birthDate: text('birth_date'),
    status: text('status').notNull().default('new'),
    benefitKind: text('benefit_kind').notNull().default('discount'),
    discountMonth: text('discount_month'),
    discountPercent: integer('discount_percent').notNull().default(0),
    tuition: integer('tuition').notNull().default(0),
    reward: integer('reward').notNull().default(0),
    created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
    consent: timestamp('consent', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    parentCpfUnique: uniqueIndex('leads_parent_cpf_unique').on(table.parentCpf),
  }),
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  lead: text('lead').notNull(),
  action: text('action').notNull(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
});
