import { validateProductionOrderReceiptResponse } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('指定時間を超過した場合に自動エスカレーション処理が実行される', () => {
    // SCEN-368
    // 生産指示書配信時刻を30分前に設定
    const distributionTimestamp = new Date('2024-01-15T14:00:00Z');
    
    // 現在時刻を31分後に設定（超過状態）
    const currentTime = new Date('2024-01-15T14:31:00Z');
    
    // 受領確認応答なし
    const responseTimestamp = null;
    
    // 必須応答時間を30分に設定
    const requiredResponseMinutes = 30;
    
    // 作業員ID
    const workerId = "WORKER001";

    const result = validateProductionOrderReceiptResponse(
      distributionTimestamp,
      responseTimestamp,
      requiredResponseMinutes,
      workerId
    );

    // エスカレーション処理が実行される
    expect(result.isValidResponse).toBe(false);
    expect(result.responseStatus).toBe("未応答");
    expect(result.escalationRequired).toBe(true);
    expect(result.responseDelayMinutes).toBe(31);
  });
});