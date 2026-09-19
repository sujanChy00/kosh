import * as v from "valibot";

export const transactionPinSchema = v.pipe(
  v.object({
    oldPin: v.pipe(
      v.string("Old PIN is required"),
      v.nonEmpty("Old PIN is required"),
      v.regex(/^\d{6}$/, "PIN must be 6 digits"),
    ),
    newPin: v.pipe(
      v.string("New PIN is required"),
      v.nonEmpty("New PIN is required"),
      v.regex(/^\d{6}$/, "PIN must be 6 digits"),
    ),
    confirmPin: v.pipe(
      v.string("Confirm PIN is required"),
      v.nonEmpty("Confirm PIN is required"),
      v.regex(/^\d{6}$/, "PIN must be 6 digits"),
    ),
  }),
  v.forward(
    v.partialCheck(
      [["newPin"], ["confirmPin"]],
      (input) => input.newPin === input.confirmPin,
      "PINs do not match",
    ),
    ["confirmPin"],
  ),
  v.forward(
    v.partialCheck(
      [["oldPin"], ["newPin"]],
      (input) => input.oldPin !== input.newPin,
      "New PIN must be different from the old one",
    ),
    ["newPin"],
  ),
);

export type TRANSACTION_PIN_FORM_VALUES = v.InferOutput<
  typeof transactionPinSchema
>;
