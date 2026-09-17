import { env } from '@/config/env';

export interface Judge0Result {
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compile_error';
  runtime?: number;
  memory?: number;
  passedTests: number;
  totalTests: number;
  stdout?: string;
  stderr?: string;
}

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 61,
  python: 71,
  java: 62,
  cpp: 50,
  c: 53,
};

export const evaluateCode = async (
  language: string,
  code: string,
  testCases: { input: string; expectedOutput: string }[],
  timeLimit: number = 1000,
  memoryLimit: number = 256
): Promise<Judge0Result> => {
  if (!env.judge0.apiKey) {
    // Mock evaluation for development
    return mockEvaluate(language, code, testCases);
  }

  try {
    const languageId = LANGUAGE_IDS[language.toLowerCase()] || 61;
    let passed = 0;
    let runtime = 0;
    let memory = 0;
    let status: Judge0Result['status'] = 'compile_error';

    for (const tc of testCases) {
      const response = await fetch(`${env.judge0.url}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': env.judge0.apiKey,
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
          stdin: tc.input,
          expected_output: tc.expectedOutput,
          cpu_time_limit: Math.max(1, timeLimit / 1000),
          memory_limit: memoryLimit,
        }),
      });

      if (!response.ok) {
        status = 'runtime_error';
        continue;
      }

      const result = await response.json();
      if (result.status?.id === 3) {
        // Accepted
        passed++;
        runtime = Math.max(runtime, result.time || 0);
        memory = Math.max(memory, result.memory || 0);
        if (status === 'compile_error') status = 'wrong_answer';
      } else if (result.status?.id === 6) {
        status = 'compile_error';
      } else if (result.status?.id === 5) {
        status = 'time_limit';
      } else if (result.status?.id === 4) {
        status = 'runtime_error';
      } else {
        status = 'wrong_answer';
      }
    }

    return {
      status: passed === testCases.length ? 'accepted' : status,
      runtime: runtime * 1000,
      memory,
      passedTests: passed,
      totalTests: testCases.length,
    };
  } catch (error) {
    return {
      status: 'runtime_error',
      passedTests: 0,
      totalTests: testCases.length,
    };
  }
};

const mockEvaluate = (
  language: string,
  code: string,
  testCases: { input: string; expectedOutput: string }[]
): Judge0Result => {
  // Simple mock: check if code contains basic structure
  if (!code || code.trim().length < 5) {
    return { status: 'compile_error', passedTests: 0, totalTests: testCases.length };
  }
  // Mock: pass all tests if code looks reasonable
  const passed = Math.min(testCases.length, Math.max(1, Math.floor(code.length / 10)));
  return {
    status: passed === testCases.length ? 'accepted' : 'wrong_answer',
    passedTests: passed,
    totalTests: testCases.length,
    runtime: Math.random() * 100,
    memory: Math.random() * 100,
  };
};