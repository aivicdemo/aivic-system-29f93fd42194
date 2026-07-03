import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  generateCorrectionInstructions,
  CorrectionInstruction,
  ValidationDefect,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理 - 修正指示生成・通知機能", () => {
  // SCEN-711: [normal] 修正指示生成・通知機能 - 検出された不備・矛盾ごとに修正指示の内容が正確に生成され、統一フォーマットで出力される

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("複数の不備・矛盾を含む営業データから統一フォーマットの修正指示が生成される", () => {
    // Arrange: テストデータとして複数の不備・矛盾を含む営業データを定義
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF001",
        data_item_name: "売上金額",
        defect_type: "value_mismatch",
        defect_description: "アポ数が3件なのに、成約数が5件になっています。成約数がアポ数を超過しています。",
        target_field: "contract_count",
        current_value: "5",
        expected_rule: "成約数 <= アポ数",
        severity: "high",
        detected_at: "2024-01-15T09:30:00Z",
      },
      {
        defect_id: "DEF002",
        data_item_name: "営業担当者",
        defect_type: "required_missing",
        defect_description: "営業担当者IDが入力されていません。この項目は必須です。",
        target_field: "sales_representative_id",
        current_value: "",
        expected_rule: "必須項目",
        severity: "high",
        detected_at: "2024-01-15T09:30:00Z",
      },
      {
        defect_id: "DEF003",
        data_item_name: "接触日時",
        defect_type: "format_invalid",
        defect_description: "接触日時が正しいフォーマットで入力されていません。期待: YYYY-MM-DD HH:mm:ss",
        target_field: "contact_datetime",
        current_value: "2024/01/15 9:30",
        expected_rule: "YYYY-MM-DD HH:mm:ss",
        severity: "medium",
        detected_at: "2024-01-15T09:30:00Z",
      },
      {
        defect_id: "DEF004",
        data_item_name: "請求金額",
        defect_type: "value_out_of_range",
        defect_description: "請求金額が負の値になっています。金額は0以上である必要があります。",
        target_field: "billing_amount",
        current_value: "-50000",
        expected_rule: "金額 >= 0",
        severity: "high",
        detected_at: "2024-01-15T09:30:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER123";
    const correction_deadline_days = 3;

    // Act: 修正指示生成機能を実行
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 生成された修正指示の構成要素・フォーマットを検証
    expect(corrections).toBeDefined();
    expect(Array.isArray(corrections)).toBe(true);
    expect(corrections.length).toBe(4);

    // 各修正指示の構成要素と統一フォーマットを検証
    corrections.forEach((correction: CorrectionInstruction, index: number) => {
      // 修正指示IDが存在し、ユニークであることを確認
      expect(correction.correction_instruction_id).toBeDefined();
      expect(typeof correction.correction_instruction_id).toBe("string");
      expect(correction.correction_instruction_id.length).toBeGreaterThan(0);

      // 対応する不備IDと整合性を確認
      expect(correction.defect_id).toBe(defects[index].defect_id);

      // 営業データ項目名が正確に記載されている
      expect(correction.data_item_name).toBe(defects[index].data_item_name);

      // 修正方法が具体的かつ実行可能な内容であること
      expect(correction.correction_method).toBeDefined();
      expect(typeof correction.correction_method).toBe("string");
      expect(correction.correction_method.length).toBeGreaterThan(10);

      // 優先度が適切に設定されている
      expect(correction.priority).toBeDefined();
      expect(["high", "medium", "low"]).toContain(correction.priority);
      if (defects[index].severity === "high") {
        expect(correction.priority).toBe("high");
      }

      // 期限が適切に計算されている（リクエスト日から3日後）
      expect(correction.deadline).toBeDefined();
      const deadline_date = new Date(correction.deadline);
      const request_date = new Date("2024-01-15T09:30:00Z");
      const expected_deadline = new Date(
        request_date.getTime() + correction_deadline_days * 24 * 60 * 60 * 1000
      );
      expect(deadline_date.getDate()).toBe(expected_deadline.getDate());
      expect(deadline_date.getMonth()).toBe(expected_deadline.getMonth());
      expect(deadline_date.getFullYear()).toBe(expected_deadline.getFullYear());

      // 修正指示が発行したユーザーIDを記録
      expect(correction.requested_by_user_id).toBe(correction_requested_by_user_id);

      // 修正指示のステータスが「未対応」から開始
      expect(correction.status).toBe("pending");

      // 修正指示の発行日時がタイムスタンプとして記録
      expect(correction.issued_at).toBeDefined();
      expect(typeof correction.issued_at).toBe("string");

      // 統一フォーマット: すべての修正指示が同じ構造を持つこと
      const required_fields = [
        "correction_instruction_id",
        "defect_id",
        "data_item_name",
        "correction_method",
        "priority",
        "deadline",
        "requested_by_user_id",
        "status",
        "issued_at",
      ];
      required_fields.forEach((field) => {
        expect(correction).toHaveProperty(field);
      });
    });

    // 各不備タイプに対して適切な修正方法が生成されていることを詳細検証
    const defect001_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF001"
    );
    expect(defect001_correction?.correction_method).toMatch(
      /成約数.*アポ数.*確認/
    );

    const defect002_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF002"
    );
    expect(defect002_correction?.correction_method).toMatch(/営業担当者.*入力/);

    const defect003_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF003"
    );
    expect(defect003_correction?.correction_method).toMatch(
      /YYYY-MM-DD.*HH:mm:ss/
    );

    const defect004_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF004"
    );
    expect(defect004_correction?.correction_method).toMatch(/負の値.*0以上/);

    // 優先度の分布を検証（高: 3件、中: 1件）
    const high_priority_count = corrections.filter(
      (c: CorrectionInstruction) => c.priority === "high"
    ).length;
    expect(high_priority_count).toBe(3);

    const medium_priority_count = corrections.filter(
      (c: CorrectionInstruction) => c.priority === "medium"
    ).length;
    expect(medium_priority_count).toBe(1);
  });

  test("単一の不備に対して修正指示が生成される場合、フォーマットが統一されている", () => {
    // Arrange: 単一の不備のみを含むテストデータ
    const single_defect: ValidationDefect[] = [
      {
        defect_id: "DEF005",
        data_item_name: "顧客名",
        defect_type: "required_missing",
        defect_description: "顧客名が空白です。顧客名は必須項目です。",
        target_field: "customer_name",
        current_value: "",
        expected_rule: "必須項目",
        severity: "high",
        detected_at: "2024-01-15T10:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER456";
    const correction_deadline_days = 1;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      single_defect,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 単一修正指示の構成要素を検証
    expect(corrections.length).toBe(1);

    const correction = corrections[0];
    expect(correction.correction_instruction_id).toBeDefined();
    expect(correction.defect_id).toBe("DEF005");
    expect(correction.data_item_name).toBe("顧客名");
    expect(correction.priority).toBe("high");
    expect(correction.requested_by_user_id).toBe("USER456");
    expect(correction.status).toBe("pending");

    // 期限が1日後で計算されていることを確認
    const deadline_date = new Date(correction.deadline);
    const request_date = new Date("2024-01-15T10:00:00Z");
    const expected_deadline = new Date(
      request_date.getTime() + 1 * 24 * 60 * 60 * 1000
    );
    expect(deadline_date.getDate()).toBe(expected_deadline.getDate());
  });

  test("修正指示の修正方法が具体的で曖昧でない内容である", () => {
    // Arrange: 異なるタイプの不備を含むテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF006",
        data_item_name: "メールアドレス",
        defect_type: "format_invalid",
        defect_description:
          "メールアドレスが正しいフォーマットではありません。",
        target_field: "email",
        current_value: "invalid-email-format",
        expected_rule: "example@domain.com 形式",
        severity: "medium",
        detected_at: "2024-01-15T11:00:00Z",
      },
      {
        defect_id: "DEF007",
        data_item_name: "アポ数",
        defect_type: "value_out_of_range",
        defect_description: "アポ数が範囲外です。0〜999の整数で入力してください。",
        target_field: "appointment_count",
        current_value: "1500",
        expected_rule: "0-999",
        severity: "high",
        detected_at: "2024-01-15T11:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER789";
    const correction_deadline_days = 2;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 各修正指示の修正方法が具体的であることを検証
    corrections.forEach((correction: CorrectionInstruction) => {
      // 修正方法が空でなく、最小限の詳細を含むこと
      expect(correction.correction_method.length).toBeGreaterThan(20);

      // 修正方法が具体的な値や条件を含むこと
      if (correction.defect_id === "DEF006") {
        expect(correction.correction_method).toContain("@");
        expect(correction.correction_method).toContain("domain");
      }

      if (correction.defect_id === "DEF007") {
        expect(correction.correction_method).toMatch(/0.*999/);
        expect(correction.correction_method).toMatch(/整数/);
      }
    });
  });

  test("複数の修正指示が同じ構造・フォーマットで出力され、一貫性が保たれている", () => {
    // Arrange: 複数の異なる不備タイプを含むテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF008",
        data_item_name: "成約日",
        defect_type: "required_missing",
        defect_description: "成約日が入力されていません。",
        target_field: "contract_date",
        current_value: "",
        expected_rule: "必須項目",
        severity: "high",
        detected_at: "2024-01-15T12:00:00Z",
      },
      {
        defect_id: "DEF009",
        data_item_name: "サービス種別",
        defect_type: "value_out_of_range",
        defect_description: "サービス種別が定義されたリストに含まれていません。",
        target_field: "service_type",
        current_value: "UNKNOWN_SERVICE",
        expected_rule: "SERVICE_A, SERVICE_B, SERVICE_C",
        severity: "medium",
        detected_at: "2024-01-15T12:00:00Z",
      },
      {
        defect_id: "DEF010",
        data_item_name: "顧客企業ID",
        defect_type: "format_invalid",
        defect_description: "顧客企業IDが正しい形式で入力されていません。",
        target_field: "customer_company_id",
        current_value: "C-INVALID",
        expected_rule: "C-XXXXX 形式（X は数字）",
        severity: "high",
        detected_at: "2024-01-15T12:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER999";
    const correction_deadline_days = 5;

    // Act: 複数の修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: すべての修正指示が同一構造を持つことを検証
    expect(corrections.length).toBe(3);

    const all_required_fields = [
      "correction_instruction_id",
      "defect_id",
      "data_item_name",
      "correction_method",
      "priority",
      "deadline",
      "requested_by_user_id",
      "status",
      "issued_at",
    ];

    corrections.forEach((correction: CorrectionInstruction) => {
      all_required_fields.forEach((field) => {
        expect(correction).toHaveProperty(field);
      });

      // すべての必須フィールドが値を持つこと
      expect(correction.correction_instruction_id).not.toEqual("");
      expect(correction.defect_id).not.toEqual("");
      expect(correction.data_item_name).not.toEqual("");
      expect(correction.correction_method).not.toEqual("");
      expect(["high", "medium", "low"]).toContain(correction.priority);
      expect(correction.deadline).not.toEqual("");
      expect(correction.requested_by_user_id).not.toEqual("");
      expect(correction.status).toBe("pending");
      expect(correction.issued_at).not.toEqual("");
    });

    // データ型の一貫性を検証
    const field_types = {
      correction_instruction_id: "string",
      defect_id: "string",
      data_item_name: "string",
      correction_method: "string",
      priority: "string",
      deadline: "string",
      requested_by_user_id: "string",
      status: "string",
      issued_at: "string",
    };

    corrections.forEach((correction: CorrectionInstruction) => {
      Object.entries(field_types).forEach(([field, expected_type]) => {
        expect(typeof (correction as any)[field]).toBe(expected_type);
      });
    });

    // 修正指示IDがユニークであることを検証
    const instruction_ids = corrections.map(
      (c: CorrectionInstruction) => c.correction_instruction_id
    );
    const unique_ids = new Set(instruction_ids);
    expect(unique_ids.size).toBe(corrections.length);
  });

  test("修正指示の優先度が不備の重大度に基づいて正確に設定される", () => {
    // Arrange: 異なる重大度の不備を含むテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF011",
        data_item_name: "項目A",
        defect_type: "required_missing",
        defect_description: "必須項目が欠落",
        target_field: "field_a",
        current_value: "",
        expected_rule: "必須",
        severity: "high",
        detected_at: "2024-01-15T13:00:00Z",
      },
      {
        defect_id: "DEF012",
        data_item_name: "項目B",
        defect_type: "format_invalid",
        defect_description: "フォーマット不正",
        target_field: "field_b",
        current_value: "invalid",
        expected_rule: "正しい形式",
        severity: "medium",
        detected_at: "2024-01-15T13:00:00Z",
      },
      {
        defect_id: "DEF013",
        data_item_name: "項目C",
        defect_type: "value_out_of_range",
        defect_description: "値が範囲外",
        target_field: "field_c",
        current_value: "999999",
        expected_rule: "0-100",
        severity: "low",
        detected_at: "2024-01-15T13:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER111";
    const correction_deadline_days = 2;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 各不備の重大度に基づいて優先度が正確に設定されている
    const high_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF011"
    );
    expect(high_correction?.priority).toBe("high");

    const medium_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF012"
    );
    expect(medium_correction?.priority).toBe("medium");

    const low_correction = corrections.find(
      (c: CorrectionInstruction) => c.defect_id === "DEF013"
    );
    expect(low_correction?.priority).toBe("low");
  });

  test("修正指示の期限が指定された日数に基づいて正確に計算される", () => {
    // Arrange: 異なる期限設定でのテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF014",
        data_item_name: "テスト項目",
        defect_type: "required_missing",
        defect_description: "テスト用",
        target_field: "test_field",
        current_value: "",
        expected_rule: "テスト",
        severity: "high",
        detected_at: "2024-01-15T14:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER222";

    // Act & Assert: 異なる期限設定で検証
    [1, 3, 7].forEach((deadline_days) => {
      const corrections = generateCorrectionInstructions(
        defects,
        correction_requested_by_user_id,
        deadline_days
      );

      const correction = corrections[0];
      const deadline_date = new Date(correction.deadline);
      const request_date = new Date("2024-01-15T14:00:00Z");
      const expected_deadline = new Date(
        request_date.getTime() + deadline_days * 24 * 60 * 60 * 1000
      );

      expect(deadline_date.getDate()).toBe(expected_deadline.getDate());
      expect(deadline_date.getMonth()).toBe(expected_deadline.getMonth());
      expect(deadline_date.getFullYear()).toBe(expected_deadline.getFullYear());
    });
  });

  test("修正指示の発行日時が正確に記録される", () => {
    // Arrange: テストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF015",
        data_item_name: "テスト項目",
        defect_type: "required_missing",
        defect_description: "テスト用",
        target_field: "test_field",
        current_value: "",
        expected_rule: "テスト",
        severity: "high",
        detected_at: "2024-01-15T15:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER333";
    const correction_deadline_days = 1;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 発行日時がISO 8601形式であり、タイムスタンプとして機能すること
    const correction = corrections[0];
    expect(correction.issued_at).toBeDefined();

    const issued_date = new Date(correction.issued_at);
    expect(issued_date instanceof Date).toBe(true);
    expect(issued_date.getTime()).not.toBeNaN();
  });

  test("修正指示のステータスが常に pending で初期化される", () => {
    // Arrange: 複数の不備を含むテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF016",
        data_item_name: "項目1",
        defect_type: "required_missing",
        defect_description: "欠落",
        target_field: "field1",
        current_value: "",
        expected_rule: "必須",
        severity: "high",
        detected_at: "2024-01-15T16:00:00Z",
      },
      {
        defect_id: "DEF017",
        data_item_name: "項目2",
        defect_type: "format_invalid",
        defect_description: "不正",
        target_field: "field2",
        current_value: "invalid",
        expected_rule: "正しい形式",
        severity: "medium",
        detected_at: "2024-01-15T16:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER444";
    const correction_deadline_days = 2;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: すべての修正指示が pending ステータスで初期化されている
    corrections.forEach((correction: CorrectionInstruction) => {
      expect(correction.status).toBe("pending");
    });
  });

  test("修正指示の defect_id が対応する不備と正確に紐付いている", () => {
    // Arrange: 複数の不備を含むテストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF018",
        data_item_name: "営業活動日",
        defect_type: "required_missing",
        defect_description: "営業活動日が欠落",
        target_field: "activity_date",
        current_value: "",
        expected_rule: "必須",
        severity: "high",
        detected_at: "2024-01-15T17:00:00Z",
      },
      {
        defect_id: "DEF019",
        data_item_name: "成約金額",
        defect_type: "value_out_of_range",
        defect_description: "金額が範囲外",
        target_field: "contract_amount",
        current_value: "-10000",
        expected_rule: "0以上",
        severity: "high",
        detected_at: "2024-01-15T17:00:00Z",
      },
    ];

    const correction_requested_by_user_id = "USER555";
    const correction_deadline_days = 1;

    // Act: 修正指示を生成
    const corrections = generateCorrectionInstructions(
      defects,
      correction_requested_by_user_id,
      correction_deadline_days
    );

    // Assert: 各修正指示の defect_id が対応する不備と紐付いている
    expect(corrections.length).toBe(2);

    const defect_ids = defects.map((d) => d.defect_id);
    const correction_defect_ids = corrections.map((c) => c.defect_id);

    expect(correction_defect_ids).toEqual(expect.arrayContaining(defect_ids));
    expect(correction_defect_ids.length).toBe(defect_ids.length);

    defects.forEach((defect) => {
      const matching_correction = corrections.find(
        (c: CorrectionInstruction) => c.defect_id === defect.defect_id
      );
      expect(matching_correction).toBeDefined();
      expect(matching_correction?.data_item_name).toBe(defect.data_item_name);
    });
  });

  test("修正指示の requested_by_user_id が発行者として正確に記録される", () => {
    // Arrange: テストデータ
    const defects: ValidationDefect[] = [
      {
        defect_id: "DEF020",
        data_item_name: "テスト",
        defect_type: "required_missing",
        defect_description: "テスト",
        target_field: "test",
        current_value: "",
        expected_rule: "テスト",
        severity: "high",
        detected_at: "2024-01-15T18:00:00Z",
      },
    ];

    const test_user_ids = ["USER_ALPHA", "USER_BETA", "USER_GAMMA"];

    // Act & Assert: 異なるユーザーIDで検証
    test_user_ids.forEach((user_id) => {
      const corrections = generateCorrectionInstructions(defects, user_id, 1);

      corrections.forEach((correction: CorrectionInstruction) => {
        expect(correction.requested_by_user_id).toBe(user_id);
      });
    });
  });
});