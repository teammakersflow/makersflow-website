-- Create quiz_questions table
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question_text text not null,
  options jsonb not null, -- JSON array of strings: e.g. ["Answer A", "Answer B"]
  correct_option_index integer not null,
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quiz_attempts table
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index quiz_questions_lesson_id_idx on public.quiz_questions(lesson_id);
create index quiz_attempts_lesson_id_idx on public.quiz_attempts(lesson_id);

-- Enable Row Level Security
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- RLS Policies for quiz_questions
create policy "Users enrolled in the course can read quiz questions"
  on public.quiz_questions
  for select
  using (
    exists (
      select 1 from public.lessons l
      join public.enrollments e on e.course_id = l.course_id
      where l.id = quiz_questions.lesson_id
      and e.user_id = auth.uid()
    )
  );

-- RLS Policies for quiz_attempts
create policy "Users can read their own quiz attempts"
  on public.quiz_attempts
  for select
  using (user_id = auth.uid());

create policy "Users can insert their own quiz attempts"
  on public.quiz_attempts
  for insert
  with check (user_id = auth.uid());

-- Create a secure public view that excludes correct_option_index
create view public.quiz_questions_public
  with (security_invoker = true) as
  select
    id,
    lesson_id,
    question_text,
    options,
    position,
    created_at
  from public.quiz_questions;

-- Create security definer RPC function to check answer
create or replace function public.check_quiz_answer(
  p_question_id uuid,
  p_selected_index integer
)
returns table (
  is_correct boolean,
  correct_option_index integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct_index integer;
  v_lesson_id uuid;
  v_enrolled boolean;
begin
  -- Fetch the correct index and lesson_id
  select lesson_id, correct_option_index
  into v_lesson_id, v_correct_index
  from public.quiz_questions
  where id = p_question_id;

  if not found then
    raise exception 'Question not found';
  end if;

  -- Check if the user is enrolled in the course that contains this lesson
  select exists (
    select 1 from public.lessons l
    join public.enrollments e on e.course_id = l.course_id
    where l.id = v_lesson_id
    and e.user_id = auth.uid()
  ) into v_enrolled;

  if not v_enrolled then
    raise exception 'Access denied. You are not enrolled in this course.';
  end if;

  return query
  select
    (p_selected_index = v_correct_index) as is_correct,
    v_correct_index as correct_option_index;
end;
$$;
