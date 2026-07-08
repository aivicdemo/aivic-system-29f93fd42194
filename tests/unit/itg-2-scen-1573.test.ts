import { evaluateComprehensionTest } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1573
  test('理解度テスト実施・評価機能 - 配信後の理解度テストが実施され、合格基準に基づいて評価結果が記録される', () => {
    // 理解度テスト配信・実施・採点シナリオ
    const test_id = 'comprehension_test_001';
    const user_id = 'assessor_12345';
    const test_title = '相場判定ロジック理解度テスト';
    const passing_score_threshold = 70;
    const total_questions = 10;
    const distributed_at = new Date('2024-03-15T09:00:00Z');
    const test_start_time = new Date('2024-03-15T10:30:00Z');
    const test_end_time = new Date('2024-03-15T10:45:00Z');

    // テスト回答データ: 全10問中8問正解 = 80点
    const user_answers = [
      { question_id: 'q_001', user_answer: 'A', correct_answer: 'A', is_correct: true },
      { question_id: 'q_002', user_answer: 'B', correct_answer: 'B', is_correct: true },
      { question_id: 'q_003', user_answer: 'C', correct_answer: 'D', is_correct: false },
      { question_id: 'q_004', user_answer: 'A', correct_answer: 'A', is_correct: true },
      { question_id: 'q_005', user_answer: 'B', correct_answer: 'B', is_correct: true },
      { question_id: 'q_006', user_answer: 'D', correct_answer: 'C', is_correct: false },
      { question_id: 'q_007', user_answer: 'A', correct_answer: 'A', is_correct: true },
      { question_id: 'q_008', user_answer: 'C', correct_answer: 'C', is_correct: true },
      { question_id: 'q_009', user_answer: 'B', correct_answer: 'B', is_correct: true },
      { question_id: 'q_010', user_answer: 'D', correct_answer: 'D', is_correct: true }
    ];

    const correct_count = user_answers.filter((ans) => ans.is_correct).length; // 8
    const raw_score = (correct_count / total_questions) * 100; // 80

    const test_input = {
      test_id: test_id,
      user_id: user_id,
      test_title: test_title,
      passing_score_threshold: passing_score_threshold,
      total_questions: total_questions,
      distributed_at: distributed_at,
      test_start_time: test_start_time,
      test_end_time: test_end_time,
      user_answers: user_answers,
      raw_score: raw_score
    };

    // 評価実行
    const evaluation_result = evaluateComprehensionTest(test_input);

    // 【期待結果の検証】
    // 1. 得点が正確に計算されていること: 80点
    expect(evaluation_result.score).toBe(80);

    // 2. 得点が合格基準を超えているか判定されていること
    expect(evaluation_result.is_passed).toBe(true);

    // 3. 合格/不合格ステータスが記録されていること
    expect(evaluation_result.status).toBe('合格');

    // 4. テスト実施日時が記録されていること
    expect(evaluation_result.executed_at).toEqual(test_end_time);

    // 5. テスト配信日時が記録されていること
    expect(evaluation_result.distributed_at).toEqual(distributed_at);

    // 6. ユーザーIDが記録されていること
    expect(evaluation_result.user_id).toBe(user_id);

    // 7. テストIDが記録されていること
    expect(evaluation_result.test_id).toBe(test_id);

    // 8. テストタイトルが記録されていること
    expect(evaluation_result.test_title).toBe(test_title);

    // 9. 正解数が記録されていること
    expect(evaluation_result.correct_count).toBe(8);

    // 10. 総出題数が記録されていること
    expect(evaluation_result.total_questions).toBe(10);

    // 11. 合格基準が記録されていること
    expect(evaluation_result.passing_score_threshold).toBe(70);

    // 12. テスト実施時間（分）が記録されていること
    const elapsed_minutes = (test_end_time.getTime() - test_start_time.getTime()) / (1000 * 60);
    expect(evaluation_result.elapsed_minutes).toBe(15);

    // 13. 回答データが記録されていること
    expect(evaluation_result.user_answers).toEqual(user_answers);

    // 【不合格ケースの検証】
    const failing_test_input = {
      test_id: 'comprehension_test_002',
      user_id: 'assessor_67890',
      test_title: '相場判定ロジック理解度テスト',
      passing_score_threshold: 70,
      total_questions: 10,
      distributed_at: new Date('2024-03-16T09:00:00Z'),
      test_start_time: new Date('2024-03-16T10:30:00Z'),
      test_end_time: new Date('2024-03-16T10:45:00Z'),
      user_answers: [
        { question_id: 'q_001', user_answer: 'A', correct_answer: 'B', is_correct: false },
        { question_id: 'q_002', user_answer: 'B', correct_answer: 'A', is_correct: false },
        { question_id: 'q_003', user_answer: 'C', correct_answer: 'D', is_correct: false },
        { question_id: 'q_004', user_answer: 'A', correct_answer: 'C', is_correct: false },
        { question_id: 'q_005', user_answer: 'B', correct_answer: 'A', is_correct: false },
        { question_id: 'q_006', user_answer: 'D', correct_answer: 'B', is_correct: false },
        { question_id: 'q_007', user_answer: 'A', correct_answer: 'D', is_correct: false },
        { question_id: 'q_008', user_answer: 'C', correct_answer: 'A', is_correct: false },
        { question_id: 'q_009', user_answer: 'B', correct_answer: 'C', is_correct: false },
        { question_id: 'q_010', user_answer: 'D', correct_answer: 'B', is_correct: false }
      ],
      raw_score: 0 // 全問不正解
    };

    const failing_evaluation_result = evaluateComprehensionTest(failing_test_input);

    // 不合格時の期待結果検証
    expect(failing_evaluation_result.score).toBe(0);
    expect(failing_evaluation_result.is_passed).toBe(false);
    expect(failing_evaluation_result.status).toBe('不合格');
    expect(failing_evaluation_result.correct_count).toBe(0);

    // 【境界値テスト：ちょうど合格基準スコア】
    const boundary_correct_count = 7; // 70点ちょうど
    const boundary_test_input = {
      test_id: 'comprehension_test_003',
      user_id: 'assessor_11111',
      test_title: '相場判定ロジック理解度テスト',
      passing_score_threshold: 70,
      total_questions: 10,
      distributed_at: new Date('2024-03-17T09:00:00Z'),
      test_start_time: new Date('2024-03-17T10:30:00Z'),
      test_end_time: new Date('2024-03-17T10:40:00Z'),
      user_answers: [
        { question_id: 'q_001', user_answer: 'A', correct_answer: 'A', is_correct: true },
        { question_id: 'q_002', user_answer: 'B', correct_answer: 'B', is_correct: true },
        { question_id: 'q_003', user_answer: 'C', correct_answer: 'C', is_correct: true },
        { question_id: 'q_004', user_answer: 'A', correct_answer: 'A', is_correct: true },
        { question_id: 'q_005', user_answer: 'B', correct_answer: 'B', is_correct: true },
        { question_id: 'q_006', user_answer: 'D', correct_answer: 'D', is_correct: true },
        { question_id: 'q_007', user_answer: 'A', correct_answer: 'A', is_correct: true },
        { question_id: 'q_008', user_answer: 'C', correct_answer: 'D', is_correct: false },
        { question_id: 'q_009', user_answer: 'B', correct_answer: 'C', is_correct: false },
        { question_id: 'q_010', user_answer: 'D', correct_answer: 'B', is_correct: false }
      ],
      raw_score: 70
    };

    const boundary_evaluation_result = evaluateComprehensionTest(boundary_test_input);

    // 境界値での期待結果検証（ちょうど70点は合格）
    expect(boundary_evaluation_result.score).toBe(70);
    expect(boundary_evaluation_result.is_passed).toBe(true);
    expect(boundary_evaluation_result.status).toBe('合格');
    expect(boundary_evaluation_result.correct_count).toBe(7);
  });
});