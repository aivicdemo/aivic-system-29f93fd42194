import { recordExceptionCase } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次業務例外ケース記録機能', () => {
  // SCEN-908
  test('請求ロジック確認ステップで標準手順書未定義の状況が発生した場合、判断基準と根拠を記録する', () => {
    const step_id = 'billing_logic_confirmation';
    const judgment_criteria = '請求割引ルールが複数同時適用された場合の優先順位判定基準が標準手順書に未定義';
    const basis = '顧客A（契約タイプ1）に対して、基本割引10%と成果報酬割引15%が同時に適用される状況が発生。契約書では両割引の併用可否が明記されていない。この場合、基本割引を優先適用し、成果報酬割引は加算（合計24.5%割引）する判定を実施した。理由は契約締結順序による。';
    const record_timestamp = new Date('2024-01-15T09:30:00Z');
    const recorder_user_id = 'user_00001';
    const recorder_name = '営業代表太郎';

    const result = recordExceptionCase({
      step_id,
      judgment_criteria,
      basis,
      record_timestamp,
      recorder_user_id,
      recorder_name,
    });

    expect(result).toEqual({
      exception_case_id: expect.any(String),
      step_id: 'billing_logic_confirmation',
      judgment_criteria: '請求割引ルールが複数同時適用された場合の優先順位判定基準が標準手順書に未定義',
      basis: '顧客A（契約タイプ1）に対して、基本割引10%と成果報酬割引15%が同時に適用される状況が発生。契約書では両割引の併用可否が明記されていない。この場合、基本割引を優先適用し、成果報酬割引は加算（合計24.5%割引）する判定を実施した。理由は契約締結順序による。',
      status: 'recorded',
      record_timestamp: new Date('2024-01-15T09:30:00Z'),
      recorder_user_id: 'user_00001',
      recorder_name: '営業代表太郎',
      is_active: true,
    });

    expect(result.exception_case_id).toBeTruthy();
    expect(result.status).toBe('recorded');
    expect(result.is_active).toBe(true);
    expect(result.record_timestamp.getTime()).toBe(
      new Date('2024-01-15T09:30:00Z').getTime()
    );
  });
});