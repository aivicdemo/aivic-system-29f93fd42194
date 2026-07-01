import { classifyCustomerInquiry } from "../../src/logic/it-1-1-1";

describe("顧客質問・異議の内容分類と対応ルート判定", () => {
  test("SCEN-985: 質問内容が0文字の境界値でバリデーションエラーが返却される", () => {
    // Arrange: 質問内容が空文字列（0文字）の入力
    const inquiry_input = {
      inquiry_content: "",
      inquiry_type: "質問",
      customer_id: "CUST001",
      received_at: "2024-01-15T10:30:00Z",
    };

    // Act & Assert: エラーハンドリングの検証
    expect(() => classifyCustomerInquiry(inquiry_input)).toThrow(/質問内容/);
  });

  test("SCEN-985: 質問内容が1文字以上の場合、分類処理が正常に実行される", () => {
    // Arrange: 質問内容が1文字以上の有効な入力
    const inquiry_input = {
      inquiry_content: "請求金額について質問があります",
      inquiry_type: "質問",
      customer_id: "CUST001",
      received_at: "2024-01-15T10:30:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 分類結果が正常に返却される
    expect(result).toHaveProperty("classification_category");
    expect(result).toHaveProperty("response_route");
    expect(result).toHaveProperty("priority_level");
    expect(typeof result.classification_category).toBe("string");
    expect(typeof result.response_route).toBe("string");
  });

  test("SCEN-985: 異議内容が空文字列の場合、バリデーションエラーが返却される", () => {
    // Arrange: 異議内容が空文字列
    const inquiry_input = {
      inquiry_content: "",
      inquiry_type: "異議",
      customer_id: "CUST002",
      received_at: "2024-01-15T11:00:00Z",
    };

    // Act & Assert: エラーハンドリングの検証
    expect(() => classifyCustomerInquiry(inquiry_input)).toThrow(/内容/);
  });

  test("SCEN-985: 質問内容が100文字を超える場合、分類処理が正常に実行される", () => {
    // Arrange: 質問内容が100文字を超える入力
    const inquiry_input = {
      inquiry_content:
        "先月の請求金額について質問があります。営業データの集計方法に関して確認したいのですが、アポ数の計算方法は契約書に記載されている内容と一致しているでしょうか。また割引の適用条件についても説明していただきたいです。",
      inquiry_type: "質問",
      customer_id: "CUST003",
      received_at: "2024-01-15T09:00:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 長文でも正常に分類される
    expect(result).toHaveProperty("classification_category");
    expect(result.classification_category).toBe("請求内容確認");
    expect(result.response_route).toBe("調査後回答");
  });

  test("SCEN-985: 質問タイプが異議で内容が有効な場合、対応ルートが修正対応に分類される", () => {
    // Arrange: 異議タイプで内容が有効な入力
    const inquiry_input = {
      inquiry_content: "請求金額の計算方法が契約内容と異なります",
      inquiry_type: "異議",
      customer_id: "CUST004",
      received_at: "2024-01-16T14:20:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 異議は修正対応ルートに分類される
    expect(result.classification_category).toBe("計算誤り疑い");
    expect(result.response_route).toBe("修正対応");
    expect(result.priority_level).toBe("高");
  });

  test("SCEN-985: 質問タイプが質問で納期関連の場合、対応ルートが説明対応に分類される", () => {
    // Arrange: 納期に関する質問
    const inquiry_input = {
      inquiry_content: "成果物の納期が遅延する可能性はありますか",
      inquiry_type: "質問",
      customer_id: "CUST005",
      received_at: "2024-01-17T13:45:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 納期質問は説明対応ルート
    expect(result.classification_category).toBe("納期確認");
    expect(result.response_route).toBe("説明対応");
  });

  test("SCEN-985: 複数の質問要素を含む場合、優先度が高に設定される", () => {
    // Arrange: 複合的な質問内容
    const inquiry_input = {
      inquiry_content:
        "請求金額が前月比で30%増加しているのはなぜでしょうか。また納期の変更はありませんか。",
      inquiry_type: "質問",
      customer_id: "CUST006",
      received_at: "2024-01-18T16:10:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 複合質問は優先度高
    expect(result.priority_level).toBe("高");
    expect(result.response_route).toBe("調査後回答");
  });

  test("SCEN-985: 期限延長要求の場合、対応ルートが期限延長に分類される", () => {
    // Arrange: 期限延長要求
    const inquiry_input = {
      inquiry_content:
        "請求内容の確認に時間が必要なので、確認期限を1週間延長していただけますか",
      inquiry_type: "要求",
      customer_id: "CUST007",
      received_at: "2024-01-19T10:00:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 期限延長は適切なルートに分類される
    expect(result.classification_category).toBe("期限延長要求");
    expect(result.response_route).toBe("期限延長");
  });

  test("SCEN-985: null値を含む場合、バリデーションエラーが返却される", () => {
    // Arrange: nullを含む入力
    const inquiry_input = {
      inquiry_content: null,
      inquiry_type: "質問",
      customer_id: "CUST008",
      received_at: "2024-01-20T11:30:00Z",
    };

    // Act & Assert: null値はエラー
    expect(() => classifyCustomerInquiry(inquiry_input as any)).toThrow(/質問内容/);
  });

  test("SCEN-985: undefinedを含む場合、バリデーションエラーが返却される", () => {
    // Arrange: undefinedを含む入力
    const inquiry_input = {
      inquiry_content: undefined,
      inquiry_type: "質問",
      customer_id: "CUST009",
      received_at: "2024-01-21T09:15:00Z",
    };

    // Act & Assert: undefined値はエラー
    expect(() => classifyCustomerInquiry(inquiry_input as any)).toThrow(/質問内容/);
  });

  test("SCEN-985: 空白のみの入力（スペース）は無効と判定される", () => {
    // Arrange: 空白のみの入力
    const inquiry_input = {
      inquiry_content: "   ",
      inquiry_type: "質問",
      customer_id: "CUST010",
      received_at: "2024-01-22T14:50:00Z",
    };

    // Act & Assert: 空白のみはエラー
    expect(() => classifyCustomerInquiry(inquiry_input)).toThrow(/質問内容/);
  });

  test("SCEN-985: タブ文字のみの入力は無効と判定される", () => {
    // Arrange: タブ文字のみ
    const inquiry_input = {
      inquiry_content: "\t\t",
      inquiry_type: "質問",
      customer_id: "CUST011",
      received_at: "2024-01-23T15:20:00Z",
    };

    // Act & Assert: タブのみはエラー
    expect(() => classifyCustomerInquiry(inquiry_input)).toThrow(/質問内容/);
  });

  test("SCEN-985: 改行文字のみの入力は無効と判定される", () => {
    // Arrange: 改行のみ
    const inquiry_input = {
      inquiry_content: "\n\n",
      inquiry_type: "質問",
      customer_id: "CUST012",
      received_at: "2024-01-24T10:40:00Z",
    };

    // Act & Assert: 改行のみはエラー
    expect(() => classifyCustomerInquiry(inquiry_input)).toThrow(/質問内容/);
  });

  test("SCEN-985: 有効な質問内容で分類結果にタイムスタンプが含まれる", () => {
    // Arrange: 有効な質問入力
    const inquiry_input = {
      inquiry_content: "請求内容について確認したい",
      inquiry_type: "質問",
      customer_id: "CUST013",
      received_at: "2024-01-25T12:00:00Z",
    };

    // Act
    const result = classifyCustomerInquiry(inquiry_input);

    // Assert: 分類結果に処理タイムスタンプが含まれる
    expect(result).toHaveProperty("classified_at");
    expect(typeof result.classified_at).toBe("string");
  });
});