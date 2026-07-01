import { describe, test, expect } from "@jest/globals";
import { registerSalesDataMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理", () => {
  // SCEN-752
  test("データ型が不正に設定されている場合、メタデータ登録時にエラーが検出される", () => {
    const invalidMetadata = {
      fieldName: "顧客ID",
      dataType: "invalid_type",
      description: "顧客を識別するID",
      format: "string",
      required: true,
    };

    expect(() => registerSalesDataMetadata(invalidMetadata)).toThrow(
      /データ型/
    );
  });

  test("データ型が空文字列の場合、メタデータ登録時にエラーが検出される", () => {
    const invalidMetadata = {
      fieldName: "顧客ID",
      dataType: "",
      description: "顧客を識別するID",
      format: "string",
      required: true,
    };

    expect(() => registerSalesDataMetadata(invalidMetadata)).toThrow(
      /データ型/
    );
  });

  test("有効なデータ型が設定されている場合、メタデータが正常に登録される", () => {
    const validMetadata = {
      fieldName: "顧客ID",
      dataType: "string",
      description: "顧客を識別するID",
      format: "uuid",
      required: true,
    };

    const result = registerSalesDataMetadata(validMetadata);

    expect(result).toEqual({
      fieldName: "顧客ID",
      dataType: "string",
      description: "顧客を識別するID",
      format: "uuid",
      required: true,
      registeredAt: expect.any(String),
      status: "registered",
    });
  });

  test("複数の有効なデータ型で登録が成功する", () => {
    const numberMetadata = {
      fieldName: "アポ数",
      dataType: "number",
      description: "当月のアポイント件数",
      format: "integer",
      required: true,
    };

    const result = registerSalesDataMetadata(numberMetadata);

    expect(result.status).toBe("registered");
    expect(result.dataType).toBe("number");
  });

  test("データ型が null の場合、メタデータ登録時にエラーが検出される", () => {
    const invalidMetadata = {
      fieldName: "成約数",
      dataType: null as any,
      description: "成約件数",
      format: "integer",
      required: true,
    };

    expect(() => registerSalesDataMetadata(invalidMetadata)).toThrow(
      /データ型/
    );
  });

  test("データ型が undefined の場合、メタデータ登録時にエラーが検出される", () => {
    const invalidMetadata = {
      fieldName: "顧客反応",
      dataType: undefined as any,
      description: "顧客の反応度",
      format: "string",
      required: true,
    };

    expect(() => registerSalesDataMetadata(invalidMetadata)).toThrow(
      /データ型/
    );
  });

  test("boolean 型のデータ型で登録が成功する", () => {
    const booleanMetadata = {
      fieldName: "成約フラグ",
      dataType: "boolean",
      description: "成約に至ったかどうか",
      format: "flag",
      required: true,
    };

    const result = registerSalesDataMetadata(booleanMetadata);

    expect(result.status).toBe("registered");
    expect(result.dataType).toBe("boolean");
  });

  test("date 型のデータ型で登録が成功する", () => {
    const dateMetadata = {
      fieldName: "接触日時",
      dataType: "date",
      description: "顧客との接触日時",
      format: "ISO8601",
      required: true,
    };

    const result = registerSalesDataMetadata(dateMetadata);

    expect(result.status).toBe("registered");
    expect(result.dataType).toBe("date");
  });
});