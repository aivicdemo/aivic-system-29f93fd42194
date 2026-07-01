import { validateSalesActivityInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-684: [normal] 営業データ入力時フォーム検証機能 - 顧客名・商談内容・アポ確定状況が正しい形式で入力された場合に検証が合格する
  test('正しい形式のすべてのフィールドが入力された場合に検証が合格し、エラーメッセージが表示されず、フォーム送信が正常に完了する', () => {
    // 入力データ：正しい形式のフィールド値
    const inputData = {
      customerName: '株式会社〇〇',
      discussionContent: '製品A導入検討',
      appointmentStatus: '確定'
    };

    // 検証実行
    const result = validateSalesActivityInput(inputData);

    // 期待結果：検証が合格し、エラーメッセージが表示されず、送信が正常に完了する
    expect(result).toEqual({
      isValid: true,
      errors: [],
      canSubmit: true
    });
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.canSubmit).toBe(true);
  });
});