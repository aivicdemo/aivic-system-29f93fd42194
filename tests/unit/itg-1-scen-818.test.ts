import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { recordConsultationHistory } from "../../src/logic/it-1781935279444-2-2-1";

describe("代表への相談受領・履歴管理機能 - 対応者情報の形式検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-818
  test("対応者情報が不正な形式の場合、エラーが発生して履歴記録が失敗すること", () => {
    // 不正な形式のテストケース
    const invalid_cases = [
      {
        respondent_name: "###@@@",
        respondent_email: "invalid.email",
        respondent_phone: "abc",
        expected_error: /対応者名/,
      },
      {
        respondent_name: "12345",
        respondent_email: "test@example.com",
        respondent_phone: "090-1234-5678",
        expected_error: /対応者名/,
      },
      {
        respondent_name: "山田太郎",
        respondent_email: "invalid-format",
        respondent_phone: "090-1234-5678",
        expected_error: /メールアドレス/,
      },
      {
        respondent_name: "山田太郎",
        respondent_email: "test@example.com",
        respondent_phone: "not-a-phone",
        expected_error: /電話番号/,
      },
      {
        respondent_name: "",
        respondent_email: "test@example.com",
        respondent_phone: "090-1234-5678",
        expected_error: /対応者名/,
      },
    ];

    invalid_cases.forEach((test_case) => {
      const consultation_record = {
        consultation_id: "CONS-001",
        customer_id: "CUST-001",
        consultation_content: "契約内容に関する相談",
        respondent_name: test_case.respondent_name,
        respondent_email: test_case.respondent_email,
        respondent_phone: test_case.respondent_phone,
        consultation_date: new Date("2024-01-15T10:00:00Z"),
        response_status: "pending",
      };

      expect(() => recordConsultationHistory(consultation_record)).toThrow(
        test_case.expected_error
      );
    });
  });

  test("対応者情報が正常な形式の場合、履歴が正常に記録されること", () => {
    const valid_consultation_record = {
      consultation_id: "CONS-001",
      customer_id: "CUST-001",
      consultation_content: "契約内容に関する相談",
      respondent_name: "山田太郎",
      respondent_email: "yamada.taro@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T10:00:00Z"),
      response_status: "pending",
    };

    const result = recordConsultationHistory(valid_consultation_record);

    expect(result).toEqual({
      consultation_id: "CONS-001",
      customer_id: "CUST-001",
      consultation_content: "契約内容に関する相談",
      respondent_name: "山田太郎",
      respondent_email: "yamada.taro@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T10:00:00Z"),
      response_status: "pending",
      recorded_at: expect.any(Date),
      is_valid: true,
    });

    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.is_valid).toBe(true);
  });

  test("対応者メールアドレスが複数の無効な形式の場合、各々エラーが発生すること", () => {
    const invalid_email_cases = [
      "test@",
      "@example.com",
      "test.example.com",
      "test@ example.com",
      "test@.com",
    ];

    invalid_email_cases.forEach((invalid_email) => {
      const consultation_record = {
        consultation_id: "CONS-002",
        customer_id: "CUST-002",
        consultation_content: "納期について",
        respondent_name: "佐藤花子",
        respondent_email: invalid_email,
        respondent_phone: "080-9876-5432",
        consultation_date: new Date("2024-01-15T11:00:00Z"),
        response_status: "pending",
      };

      expect(() => recordConsultationHistory(consultation_record)).toThrow(
        /メールアドレス/
      );
    });
  });

  test("対応者電話番号が複数の無効な形式の場合、各々エラーが発生すること", () => {
    const invalid_phone_cases = [
      "090",
      "12345",
      "abc-def-ghij",
      "090-",
      "090-1234",
      "+81-90-1234-5678-extra",
    ];

    invalid_phone_cases.forEach((invalid_phone) => {
      const consultation_record = {
        consultation_id: "CONS-003",
        customer_id: "CUST-003",
        consultation_content: "請求額について",
        respondent_name: "鈴木次郎",
        respondent_email: "suzuki.jiro@example.com",
        respondent_phone: invalid_phone,
        consultation_date: new Date("2024-01-15T12:00:00Z"),
        response_status: "pending",
      };

      expect(() => recordConsultationHistory(consultation_record)).toThrow(
        /電話番号/
      );
    });
  });

  test("複合的な複数フィールドが不正な場合、最初に検出される不正フィールドのエラーが発生すること", () => {
    const consultation_record = {
      consultation_id: "CONS-004",
      customer_id: "CUST-004",
      consultation_content: "複数の懸念事項",
      respondent_name: "###!!!",
      respondent_email: "invalid.format",
      respondent_phone: "xyz",
      consultation_date: new Date("2024-01-15T13:00:00Z"),
      response_status: "pending",
    };

    expect(() => recordConsultationHistory(consultation_record)).toThrow(
      /対応者名/
    );
  });

  test("対応者名が最小限の正常な形式で記録されること", () => {
    const consultation_record = {
      consultation_id: "CONS-005",
      customer_id: "CUST-005",
      consultation_content: "簡潔な相談",
      respondent_name: "太郎",
      respondent_email: "taro@test.co.jp",
      respondent_phone: "090-1111-2222",
      consultation_date: new Date("2024-01-15T14:00:00Z"),
      response_status: "pending",
    };

    const result = recordConsultationHistory(consultation_record);

    expect(result.is_valid).toBe(true);
    expect(result.respondent_name).toBe("太郎");
  });

  test("対応者名が最大限の正常な形式で記録されること", () => {
    const consultation_record = {
      consultation_id: "CONS-006",
      customer_id: "CUST-006",
      consultation_content: "長い相談内容",
      respondent_name: "山田太郎アルファベットサンプル名前",
      respondent_email: "yamada.taro.long.name@subdomain.example.co.jp",
      respondent_phone: "+81-90-1234-5678",
      consultation_date: new Date("2024-01-15T15:00:00Z"),
      response_status: "pending",
    };

    const result = recordConsultationHistory(consultation_record);

    expect(result.is_valid).toBe(true);
    expect(result.respondent_name).toBe("山田太郎アルファベットサンプル名前");
  });

  test("空文字列の対応者名はエラーになること", () => {
    const consultation_record = {
      consultation_id: "CONS-007",
      customer_id: "CUST-007",
      consultation_content: "テスト相談",
      respondent_name: "",
      respondent_email: "test@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T16:00:00Z"),
      response_status: "pending",
    };

    expect(() => recordConsultationHistory(consultation_record)).toThrow(
      /対応者名/
    );
  });

  test("空白のみの対応者名はエラーになること", () => {
    const consultation_record = {
      consultation_id: "CONS-008",
      customer_id: "CUST-008",
      consultation_content: "テスト相談",
      respondent_name: "   ",
      respondent_email: "test@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T17:00:00Z"),
      response_status: "pending",
    };

    expect(() => recordConsultationHistory(consultation_record)).toThrow(
      /対応者名/
    );
  });

  test("undefined の対応者情報フィールドはエラーになること", () => {
    const consultation_record = {
      consultation_id: "CONS-009",
      customer_id: "CUST-009",
      consultation_content: "テスト相談",
      respondent_name: undefined as any,
      respondent_email: "test@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T18:00:00Z"),
      response_status: "pending",
    };

    expect(() => recordConsultationHistory(consultation_record)).toThrow(
      /対応者名/
    );
  });

  test("null の対応者情報フィールドはエラーになること", () => {
    const consultation_record = {
      consultation_id: "CONS-010",
      customer_id: "CUST-010",
      consultation_content: "テスト相談",
      respondent_name: null as any,
      respondent_email: "test@example.com",
      respondent_phone: "090-1234-5678",
      consultation_date: new Date("2024-01-15T19:00:00Z"),
      response_status: "pending",
    };

    expect(() => recordConsultationHistory(consultation_record)).toThrow(
      /対応者名/
    );
  });

  test("正常な複数の相談記録が逐次処理されること", () => {
    const records = [
      {
        consultation_id: "CONS-011",
        customer_id: "CUST-011",
        consultation_content: "最初の相談",
        respondent_name: "阿部利子",
        respondent_email: "abe.toshiko@example.com",
        respondent_phone: "090-1111-1111",
        consultation_date: new Date("2024-01-16T09:00:00Z"),
        response_status: "pending",
      },
      {
        consultation_id: "CONS-012",
        customer_id: "CUST-012",
        consultation_content: "次の相談",
        respondent_name: "伊藤健太",
        respondent_email: "ito.kenta@example.com",
        respondent_phone: "080-2222-2222",
        consultation_date: new Date("2024-01-16T10:00:00Z"),
        response_status: "pending",
      },
    ];

    const results = records.map((record) =>
      recordConsultationHistory(record)
    );

    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.is_valid).toBe(true);
      expect(result.recorded_at).toBeInstanceOf(Date);
    });
  });
});