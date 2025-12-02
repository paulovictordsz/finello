-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. ACCOUNTS
create type account_type as enum ('CHECKING', 'SAVINGS', 'CASH', 'OTHER');

create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type account_type not null default 'CHECKING',
  initial_balance numeric(12, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.accounts enable row level security;

create policy "Users can CRUD own accounts" on public.accounts
  for all using (auth.uid() = user_id);

-- 3. CATEGORIES
create type transaction_type as enum ('INCOME', 'EXPENSE', 'TRANSFER');

create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users, -- Nullable for global categories
  name text not null,
  type transaction_type not null, -- INCOME or EXPENSE
  icon text, -- Optional: for UI icons
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Users can view own and global categories" on public.categories
  for select using (auth.uid() = user_id or user_id is null);

create policy "Users can create own categories" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update/delete own categories" on public.categories
  for all using (auth.uid() = user_id);

-- Insert Default Categories
insert into public.categories (name, type, icon) values
  ('Salary', 'INCOME', 'Briefcase'),
  ('Freelance', 'INCOME', 'Laptop'),
  ('Investments', 'INCOME', 'TrendingUp'),
  ('Housing', 'EXPENSE', 'Home'),
  ('Food', 'EXPENSE', 'Utensils'),
  ('Transport', 'EXPENSE', 'Car'),
  ('Health', 'EXPENSE', 'Heart'),
  ('Leisure', 'EXPENSE', 'Smile'),
  ('Education', 'EXPENSE', 'GraduationCap'),
  ('Shopping', 'EXPENSE', 'ShoppingBag');

-- 4. CARDS
create table public.cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  limit_amount numeric(12, 2) not null,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cards enable row level security;

create policy "Users can CRUD own cards" on public.cards
  for all using (auth.uid() = user_id);

-- 5. RECURRINGS (For Forecasting)
create type frequency_type as enum ('WEEKLY', 'MONTHLY', 'YEARLY');

create table public.recurrings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references public.accounts, -- Optional, can be null if it's just for forecast
  category_id uuid references public.categories,
  type transaction_type not null,
  amount numeric(12, 2) not null,
  frequency frequency_type not null default 'MONTHLY',
  start_date date not null,
  end_date date, -- Null = Indefinite
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recurrings enable row level security;

create policy "Users can CRUD own recurrings" on public.recurrings
  for all using (auth.uid() = user_id);

-- 6. TRANSACTIONS
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references public.accounts, -- Nullable for Credit Card purchases before payment
  card_id uuid references public.cards, -- Nullable if not card purchase
  category_id uuid references public.categories,
  type transaction_type not null,
  amount numeric(12, 2) not null,
  date date not null,
  description text,
  
  -- Transfer fields
  from_account_id uuid references public.accounts,
  to_account_id uuid references public.accounts,
  
  -- Recurring & Installment Metadata
  recurring_id uuid references public.recurrings,
  is_installment boolean default false,
  installment_number integer,
  total_installments integer,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can CRUD own transactions" on public.transactions
  for all using (auth.uid() = user_id);

-- 7. CARD INVOICES (Simplified for MVP)
-- We can generate these on the fly or store them. Storing is better for status tracking.
create type invoice_status as enum ('OPEN', 'CLOSED', 'PAID');

create table public.card_invoices (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references public.cards not null,
  month_year text not null, -- Format: 'YYYY-MM'
  status invoice_status default 'OPEN',
  amount_total numeric(12, 2) default 0.00,
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(card_id, month_year)
);

alter table public.card_invoices enable row level security;

create policy "Users can CRUD own invoices" on public.card_invoices
  for all using (
    exists (select 1 from public.cards where id = card_invoices.card_id and user_id = auth.uid())
  );
