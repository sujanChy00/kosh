import { ProfileImagePicker } from "@/components/setting/profile-image-picker";
import { ThemedText } from "@/components/themed-text";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { isRemoteImage, uploadToCloudinary } from "@/lib/cloudinary";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import ACCOUNT_BALANCE_ICON from "@expo/material-symbols/account_balance.xml";
import CALENDAR_ICON from "@expo/material-symbols/calendar_month.xml";
import EVENT_REPEAT_ICON from "@expo/material-symbols/event_repeat.xml";
import GROUP_ICON from "@expo/material-symbols/group.xml";
import NOTES_ICON from "@expo/material-symbols/notes.xml";
import PAYMENT_ICON from "@expo/material-symbols/payments.xml";
import PERCENTAGE_ICON from "@expo/material-symbols/percent.xml";
import PERSON_ICON from "@expo/material-symbols/person.xml";
import CLOCK_ICON from "@expo/material-symbols/schedule.xml";
import TIMER_ICON from "@expo/material-symbols/timer.xml";
import WARNING_ICON from "@expo/material-symbols/warning.xml";
import { Icon } from "@expo/ui/jetpack-compose";
import type { CreateKoshInput } from "@kosh-app/api/routers/kosh";
import { DUE_DAY_OPTIONS } from "@kosh-app/utils/constants/data";
import { dateFormatterWithSeparator } from "@kosh-app/utils/date";
import { useSelector } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ADD_KOSH_FORM_VALUE, ADD_KOSH_SCHEMA } from "./kosh-schema";

const SectionTitle = ({ children }: { children: string }) => (
  <View className="mb-1 mt-2">
    <ThemedText className="font-mono-semibold text-xs uppercase tracking-[0.2em] text-primary">
      {children}
    </ThemedText>
  </View>
);

export const AddKoshForm = () => {
  const router = useRouter();
  const haptics = useHaptics();

  const mutation = useMutation(
    trpc.kosh.create.mutationOptions({
      onSuccess: () => {
        haptics("success");
        successToast({ title: "Kosh created successfully" });
        queryClient.invalidateQueries({
          queryKey: trpc.kosh.list.queryKey(),
        });
        router.back();
      },
      onError: (error) => {
        haptics("error");
        errorToast({ title: error.message || "Failed to create kosh" });
      },
    }),
  );

  const defaultValues: ADD_KOSH_FORM_VALUE = {
    name: "",
    description: "",
    transaction_pin: "",
    icon_url: "",
    monthly_amount: "",
    due_day: "",
    member_interest_rate: "2",
    non_member_interest_rate: "5",
    loan_cap: "",
    late_penalty_amount: "",
    apply_penalty: false,
    penalty_grace_days: "",
    start_date: undefined,
    duration_months: "",
    max_members: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ADD_KOSH_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: async ({ value }) => {
      let iconUrl = value.icon_url.trim() || undefined;
      if (iconUrl && !isRemoteImage(iconUrl)) {
        try {
          iconUrl = await uploadToCloudinary(iconUrl);
        } catch (error) {
          haptics("error");
          errorToast({
            title:
              error instanceof Error ? error.message : "Failed to upload image",
          });
          return;
        }
      }
      const input: CreateKoshInput = {
        name: value.name.trim(),
        description: value.description.trim() || undefined,
        iconUrl,
        transactionPin: value.transaction_pin,
        monthlyAmount: Number(value.monthly_amount),
        dueDay: Number(value.due_day),
        memberInterestRate: Number(value.member_interest_rate),
        nonMemberInterestRate: Number(value.non_member_interest_rate),
        loanCap: Number(value.loan_cap),
        latePenaltyAmount: value.late_penalty_amount
          ? Number(value.late_penalty_amount)
          : undefined,
        applyPenalty: value.apply_penalty,
        penaltyGraceDays:
          value.apply_penalty && value.penalty_grace_days !== ""
            ? Number(value.penalty_grace_days)
            : undefined,
        startDate: dateFormatterWithSeparator(value.start_date),
        durationMonths: Number(value.duration_months),
        maxMembers: value.max_members ? Number(value.max_members) : undefined,
      };
      mutation.mutate(input);
    },
  });

  const { name, applyPenalty } = useSelector(form.store, (state) => ({
    name: state.values.name,
    applyPenalty: state.values.apply_penalty,
  }));

  return (
    <KeyboardAwareScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerClassName="pt-6 pb-4"
    >
      <form.AppForm>
        <View className="gap-y-6 px-4">
          <form.AppField
            name="icon_url"
            children={(field) => (
              <View className="items-center pt-2">
                <ProfileImagePicker
                  onValueChange={field.handleChange}
                  imagePickerOptions={{
                    shape: "oval",
                    allowsEditing: true,
                    aspect: [1, 1],
                  }}
                  alt={name}
                  source={field.state.value}
                />
              </View>
            )}
          />
          <View className="gap-y-4">
            <SectionTitle>Kosh details</SectionTitle>
            <form.AppField
              name="name"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={PERSON_ICON} size={18} />}
                  label="Kosh name"
                  placeholder="e.g. Family Savings"
                />
              )}
            />
            <form.AppField
              name="description"
              children={(field) => (
                <field.TextField
                  singleLine={false}
                  prefix={<Icon source={NOTES_ICON} size={18} />}
                  label="Description (optional)"
                  placeholder="What is this kosh for?"
                />
              )}
            />
          </View>

          <View className="gap-y-4">
            <SectionTitle>Contributions & term</SectionTitle>
            <form.AppField
              name="monthly_amount"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={PAYMENT_ICON} size={18} />}
                  label="Monthly contribution (NPR)"
                  placeholder="e.g. 1000"
                  keyboardOptions={{
                    keyboardType: "decimal",
                  }}
                />
              )}
            />
            <form.AppField
              name="due_day"
              children={(field) => (
                <field.SelectField
                  variant="dialog"
                  prefix={<Icon source={EVENT_REPEAT_ICON} size={18} />}
                  label="Due day of the month"
                  options={DUE_DAY_OPTIONS}
                  title="Select Due Date"
                />
              )}
            />
            <form.AppField
              name="start_date"
              children={(field) => (
                <field.DateField
                  prefix={<Icon source={CALENDAR_ICON} size={18} />}
                  label="Start date"
                  placeholder="Select a start date"
                  description="If not set, it will default to today"
                  maximumDate={new Date()}
                />
              )}
            />
            <form.AppField
              name="duration_months"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={CLOCK_ICON} size={18} />}
                  label="Duration (months)"
                  placeholder="e.g. 12"
                  keyboardOptions={{
                    keyboardType: "number",
                  }}
                />
              )}
            />
          </View>

          <View className="gap-y-4">
            <SectionTitle>Loans & interest</SectionTitle>
            <form.AppField
              name="member_interest_rate"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={PERCENTAGE_ICON} size={18} />}
                  label="Member interest rate (%)"
                  placeholder="e.g. 10"
                  keyboardOptions={{
                    keyboardType: "decimal",
                  }}
                />
              )}
            />
            <form.AppField
              name="non_member_interest_rate"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={PERCENTAGE_ICON} size={18} />}
                  label="Non-member interest rate (%)"
                  placeholder="e.g. 15"
                  keyboardOptions={{
                    keyboardType: "decimal",
                  }}
                />
              )}
            />
            <form.AppField
              name="loan_cap"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={ACCOUNT_BALANCE_ICON} size={18} />}
                  label="Loan cap (NPR)"
                  placeholder="e.g. 50000"
                  keyboardOptions={{
                    keyboardType: "decimal",
                  }}
                />
              )}
            />

            <form.AppField
              name="apply_penalty"
              children={(field) => (
                <field.SwitchField
                  className="gap-y-0"
                  label="Apply late penalty"
                  description="Charge the late penalty when contributions stay unpaid."
                />
              )}
            />
            {applyPenalty ? (
              <View className="gap-y-6">
                <form.AppField
                  name="late_penalty_amount"
                  children={(field) => (
                    <field.TextField
                      prefix={<Icon source={WARNING_ICON} size={18} />}
                      label="Late penalty (NPR)"
                      placeholder="Optional"
                      keyboardOptions={{
                        keyboardType: "decimal",
                      }}
                    />
                  )}
                />
                <form.AppField
                  name="penalty_grace_days"
                  children={(field) => (
                    <field.TextField
                      prefix={<Icon source={TIMER_ICON} size={18} />}
                      label="Penalty applies after (days)"
                      description="Days after the due date before the penalty is charged. Leave empty to apply from the day after the due date."
                      placeholder="Optional"
                      keyboardOptions={{
                        keyboardType: "number",
                      }}
                    />
                  )}
                />
              </View>
            ) : null}
          </View>

          <View className="gap-y-4">
            <SectionTitle>Membership</SectionTitle>
            <form.AppField
              name="max_members"
              children={(field) => (
                <field.TextField
                  prefix={<Icon source={GROUP_ICON} size={18} />}
                  label="Maximum members (optional)"
                  placeholder="Optional"
                  keyboardOptions={{
                    keyboardType: "number",
                  }}
                />
              )}
            />
          </View>

          <View className="mb-2 gap-y-4">
            <SectionTitle>Security</SectionTitle>
            <form.AppField
              name="transaction_pin"
              children={(field) => (
                <field.PasswordField
                  label="Transaction PIN"
                  placeholder="6 digits"
                  keyboardOptions={{
                    keyboardType: "numberPassword",
                  }}
                  maxLength={6}
                />
              )}
            />
          </View>

          <form.SubmitButton>
            <ThemedText className="font-notosans-medium text-primary-foreground">
              Create Kosh
            </ThemedText>
          </form.SubmitButton>
        </View>
      </form.AppForm>
    </KeyboardAwareScrollView>
  );
};
