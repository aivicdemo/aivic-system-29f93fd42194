import { validateUnifiedJudgmentLogicExecutable } from '../../src/logic/it-6-3-1';

describe('統一判定ロジック実行可能性確認機能', () => {
  // SCEN-929: [error] 統一判定ロジック実行可能性確認機能 - 必須の相場判定ロジックが登録されていない場合に実行不可エラーが発生する
  test('必須の相場判定ロジックが登録されていない場合、実行不可エラーが発生する', () => {
    const input = {
      registered_market_judgment_logics: [],
      required_logic_count: 5,
    };

    expect(() => validateUnifiedJudgmentLogicExecutable(input)).toThrow(/相場判定ロジック/);
  });

  test('必須の相場判定ロジックがすべて登録されている場合、実行可能な状態を返す', () => {
    const input = {
      registered_market_judgment_logics: [
        { logic_id: 'logic_001', name: 'ロジック1', status: 'active' },
        { logic_id: 'logic_002', name: 'ロジック2', status: 'active' },
        { logic_id: 'logic_003', name: 'ロジック3', status: 'active' },
        { logic_id: 'logic_004', name: 'ロジック4', status: 'active' },
        { logic_id: 'logic_005', name: 'ロジック5', status: 'active' },
      ],
      required_logic_count: 5,
    };

    const result = validateUnifiedJudgmentLogicExecutable(input);

    expect(result.is_executable).toBe(true);
    expect(result.registered_count).toBe(5);
    expect(result.required_count).toBe(5);
    expect(result.missing_count).toBe(0);
  });

  test('必須の相場判定ロジックの一部が登録されていない場合、実行不可エラーが発生する', () => {
    const input = {
      registered_market_judgment_logics: [
        { logic_id: 'logic_001', name: 'ロジック1', status: 'active' },
        { logic_id: 'logic_002', name: 'ロジック2', status: 'active' },
        { logic_id: 'logic_003', name: 'ロジック3', status: 'active' },
      ],
      required_logic_count: 5,
    };

    expect(() => validateUnifiedJudgmentLogicExecutable(input)).toThrow(/相場判定ロジック/);
  });

  test('登録されている相場判定ロジックがすべて有効状態である場合、実行可能である', () => {
    const input = {
      registered_market_judgment_logics: [
        { logic_id: 'logic_001', name: 'ロジック1', status: 'active' },
        { logic_id: 'logic_002', name: 'ロジック2', status: 'active' },
        { logic_id: 'logic_003', name: 'ロジック3', status: 'active' },
        { logic_id: 'logic_004', name: 'ロジック4', status: 'active' },
        { logic_id: 'logic_005', name: 'ロジック5', status: 'active' },
      ],
      required_logic_count: 5,
    };

    const result = validateUnifiedJudgmentLogicExecutable(input);

    expect(result.is_executable).toBe(true);
    expect(result.all_logics_active).toBe(true);
  });

  test('登録されている相場判定ロジックに無効状態のものが含まれる場合、実行不可エラーが発生する', () => {
    const input = {
      registered_market_judgment_logics: [
        { logic_id: 'logic_001', name: 'ロジック1', status: 'active' },
        { logic_id: 'logic_002', name: 'ロジック2', status: 'active' },
        { logic_id: 'logic_003', name: 'ロジック3', status: 'inactive' },
        { logic_id: 'logic_004', name: 'ロジック4', status: 'active' },
        { logic_id: 'logic_005', name: 'ロジック5', status: 'active' },
      ],
      required_logic_count: 5,
    };

    expect(() => validateUnifiedJudgmentLogicExecutable(input)).toThrow(/相場判定ロジック/);
  });

  test('相場判定ロジックが正確に必須数と一致する場合、完全に実行可能である', () => {
    const input = {
      registered_market_judgment_logics: [
        { logic_id: 'logic_001', name: 'ロジック1', status: 'active' },
        { logic_id: 'logic_002', name: 'ロジック2', status: 'active' },
      ],
      required_logic_count: 2,
    };

    const result = validateUnifiedJudgmentLogicExecutable(input);

    expect(result.is_executable).toBe(true);
    expect(result.registered_count).toBe(2);
    expect(result.required_count).toBe(2);
    expect(result.missing_count).toBe(0);
  });
});