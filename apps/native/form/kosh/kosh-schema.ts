import * as v from "valibot";

const REQUIRED_NUMBER = v.pipe(
  v.string("This field is required"),
  v.nonEmpty("This field is required"),
  v.regex(/^\d+(\.\d{1,2})?$/, "Enter a valid number"),
);

const REQUIRED_INTEGER = v.pipe(
  v.string("This field is required"),
  v.nonEmpty("This field is required"),
  v.regex(/^\d+$/, "Enter a whole number"),
);

export const ADD_KOSH_SCHEMA = v.object({
  name: v.pipe(
    v.string("Name is required"),
    v.nonEmpty("Name is required"),
    v.maxLength(80, "Name must be 80 characters or fewer"),
  ),
  description: v.pipe(
    v.string(),
    v.maxLength(500, "Keep the description under 500 characters"),
  ),
  transaction_pin: v.pipe(
    v.string("A 6-digit PIN is required"),
    v.nonEmpty("A 6-digit PIN is required"),
    v.regex(/^\d{6}$/, "PIN must be 6 digits"),
  ),
  icon_url: v.string(),
  monthly_amount: REQUIRED_NUMBER,
  due_day: v.pipe(
    v.string("Select a due day"),
    v.nonEmpty("Select a due day"),
    v.regex(/^(?:[1-9]|1[0-9]|2[0-8])$/, "Due day must be between 1 and 28"),
  ),
  member_interest_rate: REQUIRED_NUMBER,
  non_member_interest_rate: REQUIRED_NUMBER,
  loan_cap: REQUIRED_NUMBER,
  late_penalty_amount: v.pipe(
    v.string(),
    v.regex(/^(\d+(\.\d{1,2})?)?$/, "Enter a valid amount"),
  ),
  start_date: v.pipe(
    v.optional(v.date("Select a start date")),
    v.check((input) => input instanceof Date, "Select a start date"),
    v.check((input) => {
      if (!(input instanceof Date)) return true;
      const today = new Date();
      const start = new Date(
        input.getFullYear(),
        input.getMonth(),
        input.getDate(),
      );
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      return start.getTime() <= todayStart.getTime();
    }, "Start date cannot be in the future"),
  ),
  duration_months: REQUIRED_INTEGER,
  max_members: v.pipe(v.string(), v.regex(/^\d*$/, "Enter a whole number")),
});

export type ADD_KOSH_FORM_VALUE = v.InferOutput<typeof ADD_KOSH_SCHEMA>;