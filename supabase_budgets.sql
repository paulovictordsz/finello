-- Create budgets table
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount numeric(12, 2) not null,
  month_year text not null, -- Format: 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, month_year)
);

alter table public.budgets enable row level security;

create policy "Users can CRUD own budgets" on public.budgets
  for all using (auth.uid() = user_id);
