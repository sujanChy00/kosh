import * as v from "valibot";

export const LOGIN_SCHEMA = v.object({
  email: v.pipe(
    v.string("Email is required"),
    v.nonEmpty("Email is required"),
    v.email("Please enter a valid email address"),
  ),
  password: v.pipe(
    v.string("Password is required"),
    v.minLength(1, "Password is required"),
  ),
});

export const PASSWORD_SCHEMA = v.pipe(
  v.string("Password is required"),
  v.minLength(1, "Password is required"),
  v.minLength(8, "Password must be at least 8 characters"),
  v.regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
  v.regex(/[0-9]/, "Password must contain at least one number"),
  v.regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
);

export const REGISTER_SCHEMA = v.pipe(
  v.object({
    name: v.pipe(
      v.string("Name is required"),
      v.minLength(1, "Name is required"),
    ),
    email: v.pipe(
      v.string("Email is required"),
      v.nonEmpty("Email is required"),
      v.email("Please enter a valid email address"),
    ),
    password: PASSWORD_SCHEMA,
    confirm_password: v.pipe(
      v.string("Please confirm your password"),
      v.minLength(1, "Please confirm your password"),
    ),
  }),
  v.forward(
    v.check(
      (input) => input.password === input.confirm_password,
      "Passwords don't match",
    ),
    ["confirm_password"],
  ),
);

export const RESET_PASSWORD_SCHEMA = v.pipe(
  v.object({
    otp: v.pipe(
      v.string("Reset code is required"),
      v.nonEmpty("Reset code is required"),
      v.length(6, "Enter the 6-digit reset code"),
    ),
    password: PASSWORD_SCHEMA,
    confirm_password: v.pipe(
      v.string("Please confirm your password"),
      v.minLength(1, "Please confirm your password"),
    ),
  }),
  v.forward(
    v.check(
      (input) => input.password === input.confirm_password,
      "Passwords don't match",
    ),
    ["confirm_password"],
  ),
);

export type LOGIN_FORM_VALUE = v.InferOutput<typeof LOGIN_SCHEMA>;
export type REGISTER_FORM_VALUE = v.InferOutput<typeof REGISTER_SCHEMA>;
export type RESET_PASSWORD_FORM_VALUE = v.InferOutput<typeof RESET_PASSWORD_SCHEMA>;
