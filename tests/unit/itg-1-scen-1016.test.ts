import { classifyCustomerQuestion } from "../../src/logic/it-1-2-1";

describe("顧客質問内容分類・優先度判定機能", () => {
  test("SCEN-1016: 分類不可能な質問内容に対して、エラーまたはデフォルト分類が返される", () => {
    // ケース1: 空文字列を入力 → エラーが発生
    expect(() =>
      classifyCustomerQuestion({
        questionContent: "",
        customerId: "C001",
      })
    ).toThrow(/質問内容/);

    // ケース2: NULL値（undefined）を入力 → エラーが発生
    expect(() =>
      classifyCustomerQuestion({
        questionContent: undefined as any,
        customerId: "C001",
      })
    ).toThrow(/質問内容/);

    // ケース3: 特殊文字のみ（例：「!!!」）を入力 → デフォルト分類が返される
    const specialCharsResult = classifyCustomerQuestion({
      questionContent: "!!!",
      customerId: "C001",
    });
    expect(specialCharsResult).toEqual({
      category: "その他",
      priority: "低",
      confidence: 0,
    });

    // ケース4: 極度に短い文字列（例：「1文字」）を入力 → デフォルト分類が返される
    const shortTextResult = classifyCustomerQuestion({
      questionContent: "a",
      customerId: "C001",
    });
    expect(shortTextResult).toEqual({
      category: "その他",
      priority: "低",
      confidence: 0,
    });

    // ケース5: 正常な質問内容（請求内容に関する具体的な質問）を入力 → 適切な分類と優先度が返される
    const validResult = classifyCustomerQuestion({
      questionContent:
        "2024年1月分の請求額が前月比で50%増加しているが、その理由を教えてください。成約数は変わっていないはずです。",
      customerId: "C001",
    });
    expect(validResult).toEqual({
      category: "請求内容",
      priority: "高",
      confidence: expect.any(Number),
    });
    expect(validResult.confidence).toBeGreaterThan(0.7);

    // ケース6: 納期変更に関する質問を入力 → 「納期」カテゴリで高優先度が返される
    const deliveryResult = classifyCustomerQuestion({
      questionContent:
        "成果物の納期が2月28日から3月15日に変更されるということですが、これによる請求額への影響はありますか？",
      customerId: "C002",
    });
    expect(deliveryResult).toEqual({
      category: "納期変更",
      priority: "高",
      confidence: expect.any(Number),
    });
    expect(deliveryResult.confidence).toBeGreaterThan(0.7);

    // ケース7: 契約内容に関する一般的な質問を入力 → 「契約内容」カテゴリで中優先度が返される
    const contractResult = classifyCustomerQuestion({
      questionContent:
        "現在の契約内容を確認したいのですが、ポータルのどこから閲覧できますか？",
      customerId: "C003",
    });
    expect(contractResult).toEqual({
      category: "契約内容",
      priority: "中",
      confidence: expect.any(Number),
    });
    expect(contractResult.confidence).toBeGreaterThan(0.6);

    // ケース8: システムの技術的問題に関する質問を入力 → 「システム動作」カテゴリで高優先度が返される
    const systemResult = classifyCustomerQuestion({
      questionContent:
        "ポータルにログインできません。エラーメッセージ『403 Forbidden』が表示されます。",
      customerId: "C004",
    });
    expect(systemResult).toEqual({
      category: "システム動作",
      priority: "高",
      confidence: expect.any(Number),
    });
    expect(systemResult.confidence).toBeGreaterThan(0.7);

    // ケース9: 空白文字のみ（スペース、タブ、改行）を入力 → デフォルト分類が返される
    const whitespaceResult = classifyCustomerQuestion({
      questionContent: "   \t\n  ",
      customerId: "C005",
    });
    expect(whitespaceResult).toEqual({
      category: "その他",
      priority: "低",
      confidence: 0,
    });

    // ケース10: 意味不明な文字列（ランダム文字）を入力 → デフォルト分類が返される
    const randomResult = classifyCustomerQuestion({
      questionContent: "xyzabc defgh ijklmn opqrst",
      customerId: "C006",
    });
    expect(randomResult).toEqual({
      category: "その他",
      priority: "低",
      confidence: expect.any(Number),
    });
    expect(randomResult.confidence).toBeLessThanOrEqual(0.3);
  });
});