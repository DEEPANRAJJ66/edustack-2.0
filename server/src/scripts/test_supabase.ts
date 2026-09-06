import { createClient } from '@supabase/supabase-js';

const sb = createClient('https://fobymcyikluggrwgravo.supabase.co', 'sb_publishable_2BE14KH5kECGXvtI1eRu8w_nKlwHseT');

async function test() {
  const { data: tests, error: err1 } = await sb.from('tests').select('*');
  console.log('Tests query:', { testsCount: tests?.length, err1 });

  const { data: profiles, error: err2 } = await sb.from('profiles').select('*');
  console.log('Profiles query:', { profilesCount: profiles?.length, err2 });

  const { data: rpcRes, error: err3 } = await sb.rpc('create_next_attempt', {
    p_student_id: 'a0000000-0000-0000-0000-000000000001',
    p_test_id: 'jee-main-mock-01',
    p_duration_minutes: 180,
    p_is_error_correct_test: false,
    p_parent_attempt_id: null
  });
  console.log('RPC create_next_attempt result:', { rpcRes, err3 });

  const { data: attempts, error: err4 } = await sb.from('attempts').select('*');
  console.log('Attempts query:', { attemptsCount: attempts?.length, err4 });
}

test();
