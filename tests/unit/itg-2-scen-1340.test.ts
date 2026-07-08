import { describe, test, expect } from "@jest/globals";
import {
  validateEstimateFormatCompleteness,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1340: 見積書サンプル件数0件時のチェック処理スキップとアラート通知", () => {
    // 入力: 見積書サンプル件数が0件の状態
    const estimateSamples: Array<{
      id: string;
      format: string;
      items: string[];
    }> = [];

    // 期待動作: チェック処理がスキップされ、アラート通知が返される
    const result = validateEstimateFormatCompleteness({
      samples: estimateSamples,
      checkRequired: true,
    });

    // 検証1: 処理がスキップされたことを確認（isSkipped = true）
    expect(result.isSkipped).toBe(true);

    // 検証2: エラーが発生していないことを確認
    expect(result.hasError).toBe(false);

    // 検証3: アラート通知が生成されていることを確認
    expect(result.alertMessage).toBeDefined();
    expect(result.alertMessage).toMatch(/見積書サンプル/);

    // 検証4: 通知メッセージが「存在しません」を含むことを確認
    expect(result.alertMessage).toMatch(/存在しません/);

    // 検証5: チェック結果が空配列であることを確認（処理がスキップされたため）
    expect(result.checkResults).toEqual([]);

    // 検証6: 処理完了ステータスが正常終了（"SKIPPED"）であることを確認
    expect(result.status).toBe("SKIPPED");

    // 検証7: 処理対象件数が0件であることを確認
    expect(result.processedCount).toBe(0);

    // 検証8: システムエラーフラグが立っていないことを確認
    expect(result.systemError).toBe(false);
  });
});