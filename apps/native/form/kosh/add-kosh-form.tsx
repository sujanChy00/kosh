import { ProfileImagePicker } from "@/components/setting/profile-image-picker";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { isIOS } from "@/constants/platform";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { isRemoteImage, uploadToCloudinary } from "@/lib/cloudinary";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import type { CreateKoshInput } from "@kosh-app/api/routers/kosh";
import { DUE_DAY_OPTIONS } from "@kosh-app/utils/constants/data";
import { dateFormatterWithSeparator } from "@kosh-app/utils/date";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
        queryClient.refetchQueries();
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
    member_interest_rate: "10",
    non_member_interest_rate: "15",
    loan_cap: "",
    late_penalty_amount: "",
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
        startDate: dateFormatterWithSeparator(value.start_date),
        durationMonths: Number(value.duration_months),
        maxMembers: value.max_members ? Number(value.max_members) : undefined,
      };
      mutation.mutate(input);
    },
  });

  const { name } = useSelector(form.store, (state) => ({
    name: state.values.name,
  }));

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
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
                    accessibilityLabel="Kosh Name"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "group",
                          ios: "person.2.fill",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Kosh name"
                    placeholder="e.g. Family Savings"
                  />
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextField
                    accessibilityLabel="Kosh Description"
                    multiline
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "notes",
                          ios: "text.alignleft",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Description"
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
                    accessibilityLabel="Monthly Amount"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "payments",
                          ios: "banknote",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Monthly contribution (NPR)"
                    placeholder="e.g. 1000"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              <form.AppField
                name="due_day"
                children={(field) => (
                  <field.SelectField
                    label="Due day of the month"
                    options={DUE_DAY_OPTIONS}
                  />
                )}
              />
              <form.AppField
                name="start_date"
                children={(field) => (
                  <field.DateField
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
                    accessibilityLabel="Duration"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "schedule",
                          ios: "clock",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Duration (months)"
                    placeholder="e.g. 12"
                    keyboardType="number-pad"
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
                    accessibilityLabel="Member Interest Rate"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "percent",
                          ios: "percent",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Member interest rate (%)"
                    placeholder="e.g. 10"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              <form.AppField
                name="non_member_interest_rate"
                children={(field) => (
                  <field.TextField
                    accessibilityLabel="Non-member Interest Rate"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "percent",
                          ios: "percent",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Non-member interest rate (%)"
                    placeholder="e.g. 15"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              <form.AppField
                name="loan_cap"
                children={(field) => (
                  <field.TextField
                    accessibilityLabel="Loan Cap"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "account_balance",
                          ios: "banknote.fill",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Loan cap (NPR)"
                    placeholder="e.g. 50000"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              <form.AppField
                name="late_penalty_amount"
                children={(field) => (
                  <field.TextField
                    accessibilityLabel="Late Penalty Amount"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "warning",
                          ios: "exclamationmark.octagon",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Late penalty (NPR)"
                    placeholder="Optional"
                    keyboardType="decimal-pad"
                  />
                )}
              />
            </View>

            <View className="gap-y-4">
              <SectionTitle>Membership</SectionTitle>
              <form.AppField
                name="max_members"
                children={(field) => (
                  <field.TextField
                    accessibilityLabel="Maximum Members"
                    prefix={
                      <StyledSymbolView
                        name={{
                          android: "group",
                          ios: "person.3.fill",
                        }}
                        tintColorClassName="accent-muted"
                        size={18}
                      />
                    }
                    label="Maximum members"
                    placeholder="Optional"
                    keyboardType="number-pad"
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
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
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
        <AnimatedSpacer height={100} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
