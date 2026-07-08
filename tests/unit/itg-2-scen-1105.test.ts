import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateMonthlyAnalysisCycleCompletion,
} from "../../src/logic/it-1-br-6-2-1";

describe("月次分析サイクル完了判定機能", () => {
  let mockCurrentDate: Date;

  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });

  // SCEN-1105: [error] 月次分析サイクル完了判定機能 - 月次分析プロセスが5営業日を超過した場合、警告フラグが立てられ遅延が記録される
  test("should flag warning and record delay when analysis cycle exceeds 5 business days", () => {
    // プロセス開始日時を設定（2024-01-08 09:00:00 UTC、月曜日）
    const process_start_datetime = new Date("2024-01-08T09:00:00Z");

    // 現在時刻をプロセス開始日時から6営業日を超過した時点に設定
    // 営業日カウント: 2024-01-08(月)、2024-01-09(火)、2024-01-10(水)、2024-01-11(木)、2024-01-12(金)、2024-01-15(月)、2024-01-16(火)
    // 6営業日後 = 2024-01-16 15:00:00 UTC（火曜日 3PM）
    mockCurrentDate = new Date("2024-01-16T15:00:00Z");

    const process_id = "PROC-20240108-001";
    const analysis_start_time = process_start_datetime;
    const analysis_end_time = mockCurrentDate;

    // 月次分析サイクル完了判定機能を実行
    const result = validateMonthlyAnalysisCycleCompletion({
      process_id,
      analysis_start_time,
      analysis_end_time,
      current_time: mockCurrentDate,
    });

    // 期待結果の検証

    // 1. 警告フラグが『ON』の状態で立てられていることを確認
    expect(result.warning_flag_status).toBe("ON");

    // 2. 遅延ステータスが『遅延あり』と記録されていることを確認
    expect(result.delay_status).toBe("遅延あり");

    // 3. 遅延ログが記録されていることを確認
    expect(result.delay_log).toBeDefined();

    // 4. 超過営業日数が正確に計算されていることを確認（6営業日 - 5営業日 = 1営業日超過）
    expect(result.delay_log.exceeded_business_days).toBe(1);

    // 5. 警告発生日時が正確に記録されていることを確認
    expect(result.delay_log.warning_issued_datetime).toEqual(mockCurrentDate);

    // 6. プロセスIDが遅延ログに正確に記録されていることを確認
    expect(result.delay_log.process_id).toBe(process_id);

    // 7. 遅延ログにプロセス開始日時が記録されていることを確認
    expect(result.delay_log.process_start_datetime).toEqual(analysis_start_time);

    // 8. 遅延ログに分析終了日時が記録されていることを確認
    expect(result.delay_log.analysis_end_datetime).toEqual(analysis_end_time);

    // 9. 超過理由が正確に記録されていることを確認
    expect(result.delay_log.exceeded_reason).toBe(
      "月次分析プロセスが規定の5営業日を超過"
    );
  });
});