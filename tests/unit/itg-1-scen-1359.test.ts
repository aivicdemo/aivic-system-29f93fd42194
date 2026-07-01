import { generateValidationChecklist } from '../../src/logic/it-1781935279444-2-1-1';

describe('品質管理ルール・チェックリスト作成機能', () => {
  test('SCEN-1359: 検証ルール条件が0件の場合、チェックリストが空リストで正常に生成される', async () => {
    const checklistName = 'テスト_空ルールチェックリスト';
    const checklistDescription = '検証ルール条件なしのテストケース';
    const emptyRules: any[] = [];

    const result = await generateValidationChecklist({
      name: checklistName,
      description: checklistDescription,
      rules: emptyRules,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe(checklistName);
    expect(result.description).toBe(checklistDescription);
    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.rules.length).toBe(0);
    expect(result.status).toBe('success');
    expect(result.httpStatusCode).toBe(200);
  });
});