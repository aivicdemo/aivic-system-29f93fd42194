import { validateJudgmentCriteriaDataIntegrity } from "../../src/logic/it-6-2-2-1";

describe("判定基準・学習データ整合性検証", () => {
  test("SCEN-941: 判定基準と学習データ間に矛盾がある場合、警告が発せられ自動判定が停止される", () => {
    // 準備: 矛盾したテストデータセットを構築
    const contradictory_criteria = {
      item_id: "ITM001",
      work_type: "土工",
      region: "東京都",
      amount_band_min: 1000000,
      amount_band_max: 5000000,
      allowable_deviation_rate: 5,
    };

    const contradictory_learning_data = {
      item_id: "ITM001",
      work_type: "土工",
      region: "東京都",
      amount_band_min: 2000000, // 判定基準の min と矛盾
      amount_band_max: 4000000, // 判定基準の max と矛盾
      market_reference_rate: 10, // 許容乖離率と矛盾
    };

    const validation_input = {
      judgment_criteria: [contradictory_criteria],
      learning_data: [contradictory_learning_data],
      auto_judge_enabled: true,
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果 (1): 矛盾内容を示す警告メッセージが返される
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.warning_message).toMatch(/矛盾/);
    expect(validation_result.warning_message).toMatch(/ITM001/);

    // 期待結果 (2): 自動判定機能が停止/無効化される
    expect(validation_result.auto_judge_status).toBe("STOPPED");
    expect(validation_result.auto_judge_halted).toBe(true);

    // 期待結果 (3): システムログに矛盾の詳細情報が記録される
    expect(validation_result.error_log).toBeDefined();
    expect(validation_result.error_log.length).toBeGreaterThan(0);

    const error_entry = validation_result.error_log[0];
    expect(error_entry.contradiction_type).toMatch(/amount_band_min|amount_band_max|allowable_deviation_rate/);
    expect(error_entry.criteria_value).toBeDefined();
    expect(error_entry.learning_data_value).toBeDefined();
    expect(error_entry.item_id).toBe("ITM001");
    expect(error_entry.timestamp).toBeDefined();

    // 期待結果 (4): ユーザーが矛盾を解決するまで自動判定は再開されない
    expect(validation_result.resolution_required).toBe(true);
    expect(validation_result.can_resume_auto_judge).toBe(false);

    // 追加検証: 複数項目の矛盾がある場合、すべてが記録される
    expect(validation_result.contradiction_count).toBeGreaterThanOrEqual(1);
  });

  test("SCEN-941: 判定基準と学習データに矛盾がない場合、自動判定が継続される", () => {
    // 準備: 整合性のあるテストデータセット
    const consistent_criteria = {
      item_id: "ITM002",
      work_type: "鉄筋",
      region: "大阪府",
      amount_band_min: 1000000,
      amount_band_max: 5000000,
      allowable_deviation_rate: 5,
    };

    const consistent_learning_data = {
      item_id: "ITM002",
      work_type: "鉄筋",
      region: "大阪府",
      amount_band_min: 1000000, // 判定基準と一致
      amount_band_max: 5000000, // 判定基準と一致
      market_reference_rate: 5, // 許容乖離率と一致
    };

    const validation_input = {
      judgment_criteria: [consistent_criteria],
      learning_data: [consistent_learning_data],
      auto_judge_enabled: true,
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果: 整合性が確認され自動判定が継続
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.auto_judge_status).toBe("RUNNING");
    expect(validation_result.auto_judge_halted).toBe(false);
    expect(validation_result.warning_message).toBeNull();
    expect(validation_result.resolution_required).toBe(false);
    expect(validation_result.can_resume_auto_judge).toBe(true);
    expect(validation_result.error_log.length).toBe(0);
  });

  test("SCEN-941: 判定基準が未定義で学習データが存在する場合、警告が発せられる", () => {
    // 準備: 判定基準が空で学習データが存在
    const validation_input = {
      judgment_criteria: [],
      learning_data: [
        {
          item_id: "ITM003",
          work_type: "コンクリート",
          region: "福岡県",
          amount_band_min: 1500000,
          amount_band_max: 6000000,
          market_reference_rate: 7,
        },
      ],
      auto_judge_enabled: true,
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果: 判定基準の不在を警告
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.warning_message).toMatch(/判定基準/);
    expect(validation_result.auto_judge_status).toBe("STOPPED");
    expect(validation_result.contradiction_count).toBeGreaterThanOrEqual(1);
  });

  test("SCEN-941: 学習データが未定義で判定基準が存在する場合、警告が発せられる", () => {
    // 準備: 判定基準は存在し学習データが空
    const validation_input = {
      judgment_criteria: [
        {
          item_id: "ITM004",
          work_type: "塗装",
          region: "愛知県",
          amount_band_min: 800000,
          amount_band_max: 3000000,
          allowable_deviation_rate: 4,
        },
      ],
      learning_data: [],
      auto_judge_enabled: true,
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果: 学習データの不在を警告
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.warning_message).toMatch(/学習データ/);
    expect(validation_result.auto_judge_status).toBe("STOPPED");
  });

  test("SCEN-941: 複数項目に矛盾がある場合、すべての矛盾が記録される", () => {
    // 準備: 複数の矛盾を含むテストデータ
    const contradictory_criteria = [
      {
        item_id: "ITM005",
        work_type: "躯体",
        region: "東京都",
        amount_band_min: 2000000,
        amount_band_max: 10000000,
        allowable_deviation_rate: 3,
      },
      {
        item_id: "ITM006",
        work_type: "仕上げ",
        region: "神奈川県",
        amount_band_min: 500000,
        amount_band_max: 2000000,
        allowable_deviation_rate: 5,
      },
    ];

    const contradictory_learning_data = [
      {
        item_id: "ITM005",
        work_type: "躯体",
        region: "東京都",
        amount_band_min: 3000000, // 矛盾
        amount_band_max: 8000000, // 矛盾
        market_reference_rate: 8, // 矛盾
      },
      {
        item_id: "ITM006",
        work_type: "仕上げ",
        region: "神奈川県",
        amount_band_min: 600000, // 矛盾
        amount_band_max: 1800000, // 矛盾
        market_reference_rate: 6, // 矛盾
      },
    ];

    const validation_input = {
      judgment_criteria: contradictory_criteria,
      learning_data: contradictory_learning_data,
      auto_judge_enabled: true,
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果: 複数の矛盾がすべて記録される
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.auto_judge_status).toBe("STOPPED");
    expect(validation_result.error_log.length).toBeGreaterThanOrEqual(6); // 各項目で複数矛盾が記録される
    expect(validation_result.contradiction_count).toBeGreaterThanOrEqual(2);

    // 矛盾ログに ITM005 と ITM006 の両方が含まれていることを確認
    const item_ids_in_log = validation_result.error_log.map((log: { item_id: string }) => log.item_id);
    expect(item_ids_in_log).toContain("ITM005");
    expect(item_ids_in_log).toContain("ITM006");
  });

  test("SCEN-941: 判定基準が無効化されている場合、自動判定は停止される", () => {
    // 準備: 自動判定が無効化されたテストケース
    const criteria = {
      item_id: "ITM007",
      work_type: "電気",
      region: "京都府",
      amount_band_min: 1200000,
      amount_band_max: 4500000,
      allowable_deviation_rate: 6,
    };

    const learning_data = {
      item_id: "ITM007",
      work_type: "電気",
      region: "京都府",
      amount_band_min: 1200000,
      amount_band_max: 4500000,
      market_reference_rate: 6,
    };

    const validation_input = {
      judgment_criteria: [criteria],
      learning_data: [learning_data],
      auto_judge_enabled: false, // 自動判定が無効化
    };

    // 実行: 整合性検証プロセスを実行
    const validation_result = validateJudgmentCriteriaDataIntegrity(
      validation_input
    );

    // 期待結果: 自動判定が停止
    expect(validation_result.auto_judge_status).toBe("DISABLED");
    expect(validation_result.auto_judge_halted).toBe(true);
  });
});