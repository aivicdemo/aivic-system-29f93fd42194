import { adjustQualityControlParameter } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1221: パラメータ調整値が許容範囲外の場合に調整を拒否し詳細理由を通知する", () => {
    // ハッピーパス: 許容範囲内の調整は成功
    const valid_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.08,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.1,
    };

    const valid_result = adjustQualityControlParameter(valid_input);
    expect(valid_result).toEqual({
      success: true,
      parameter_name: "relative_deviation_threshold",
      adjusted_value: 0.08,
      message: "パラメータを正常に調整しました。",
    });

    // エラーケース1: 上限値を超える値
    const over_max_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.2,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.1,
    };

    expect(() => adjustQualityControlParameter(over_max_input)).toThrow(
      /許容範囲/
    );

    // エラーケース2: 下限値未満の値
    const below_min_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.02,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.1,
    };

    expect(() => adjustQualityControlParameter(below_min_input)).toThrow(
      /許容範囲/
    );

    // エラーメッセージの詳細確認: 上限超過時の具体的な理由
    try {
      adjustQualityControlParameter(over_max_input);
      fail("例外がスローされるべき");
    } catch (error: any) {
      const error_message = error.message;
      expect(error_message).toMatch(/0.15/); // 上限値を含む
      expect(error_message).toMatch(/0.2/); // 入力値を含む
      expect(error_message).toMatch(/0.05/); // 下限値を含む
    }

    // エラーメッセージの詳細確認: 下限未満時の具体的な理由
    try {
      adjustQualityControlParameter(below_min_input);
      fail("例外がスローされるべき");
    } catch (error: any) {
      const error_message = error.message;
      expect(error_message).toMatch(/0.05/); // 下限値を含む
      expect(error_message).toMatch(/0.02/); // 入力値を含む
      expect(error_message).toMatch(/0.15/); // 上限値を含む
    }

    // 境界値テスト: 正確に上限値と同じ値（成功）
    const boundary_max_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.15,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.1,
    };

    const boundary_max_result = adjustQualityControlParameter(
      boundary_max_input
    );
    expect(boundary_max_result.success).toBe(true);
    expect(boundary_max_result.adjusted_value).toBe(0.15);

    // 境界値テスト: 正確に下限値と同じ値（成功）
    const boundary_min_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.05,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.1,
    };

    const boundary_min_result = adjustQualityControlParameter(
      boundary_min_input
    );
    expect(boundary_min_result.success).toBe(true);
    expect(boundary_min_result.adjusted_value).toBe(0.05);

    // 中間値テスト: 範囲のちょうど中央（成功）
    const middle_input = {
      parameter_name: "relative_deviation_threshold",
      input_value: 0.1,
      min_value: 0.05,
      max_value: 0.15,
      current_value: 0.12,
    };

    const middle_result = adjustQualityControlParameter(middle_input);
    expect(middle_result.success).toBe(true);
    expect(middle_result.adjusted_value).toBe(0.1);
  });
});