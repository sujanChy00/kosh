import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

const formatAmount = (amount: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number(amount),
  );

const INVITE_STATUS_MESSAGES: Record<string, { title: string; body: string }> =
  {
    not_found: {
      title: "Invite not found",
      body: "This invite link doesn't look right. Ask the Adhyaksh for a fresh invite.",
    },
    expired: {
      title: "Invite expired",
      body: "This invite has expired. Ask the Adhyaksh to generate a new one.",
    },
    revoked: {
      title: "Invite revoked",
      body: "This invite has been revoked and can no longer be used.",
    },
  };

const CenterCard = ({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) => (
  <Card>
    <Card.Body className="items-center gap-3 py-4 text-center">
      <Card.Title className="text-center">{title}</Card.Title>
      {body ? (
        <ThemedText className="text-center text-sm text-muted">
          {body}
        </ThemedText>
      ) : null}
      {children}
    </Card.Body>
  </Card>
);

const JoinScreen = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ token?: string }>();
  const paramToken =
    typeof params.token === "string" ? params.token.trim().toUpperCase() : "";
  const [enteredToken, setEnteredToken] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [requested, setRequested] = useState(false);

  // Token comes from the invite link/QR, or from a code typed in manually.
  const token = paramToken || enteredToken.trim().toUpperCase();
  const isManualEntry = !paramToken;

  const submitCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setEnteredToken(code);
  };

  const changeCode = () => {
    setEnteredToken("");
    setCodeInput("");
  };

  const previewQuery = useQuery(
    trpc.invite.preview.queryOptions({ token }, { enabled: token.length > 0 }),
  );

  const requestMutation = useMutation(
    trpc.invite.requestJoin.mutationOptions({
      onSuccess: () => {
        haptics("success");
        setRequested(true);
        successToast({ title: "Join request sent" });
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Could not request to join",
        });
        previewQuery.refetch();
      },
    }),
  );

  const preview = previewQuery.data;
  const inviteIssue = preview && INVITE_STATUS_MESSAGES[preview.inviteStatus];

  if (!token)
    return (
      <>
        <View className="px-4 pt-20 gap-y-10">
          <View className="gap-y-1">
            <ThemedText className="text-xl font-notosans-semibold capitalize">
              Enter invitation code
            </ThemedText>
            <ThemedText className="text-muted-foreground">
              Paste the invite code you got from the Adhyaksh of the kosh.
            </ThemedText>
          </View>
          <TextInput placeholder="e.g. NEWK-XXXXXX" label="Invite code" />
        </View>
        <KeyboardStickyView
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 12,
          }}
          offset={{
            closed: -20,
            opened: -10,
          }}
        >
          <PrimaryButton>
            <PrimaryButton.Label>Join</PrimaryButton.Label>
          </PrimaryButton>
        </KeyboardStickyView>
      </>
    );

  return <View></View>;

  // return (
  //   <ScrollView
  //     contentInsetAdjustmentBehavior="automatic"
  //     showsVerticalScrollIndicator={false}
  //     contentContainerClassName="p-4 gap-4"
  //   >
  //     <Stack.Screen options={{ headerTitle: "Join kosh" }} />

  //     {!token ? (
  //       <Card className="gap-3">
  //         <Card.Body className="items-center gap-3 py-2">
  //           <Card.Title className="text-center">Enter invite code</Card.Title>
  //           <Card.Description className="text-center text-sm">
  //             Paste the invite code you got from the Adhyaksh of the kosh.
  //           </Card.Description>
  //           <InputGroup>
  //             <InputGroup.Input
  //               value={codeInput}
  //               onChangeText={setCodeInput}
  //               onSubmitEditing={submitCode}
  //               autoCapitalize="characters"
  //               autoCorrect={false}
  //               autoComplete="off"
  //               placeholder="e.g. NEWK-XXXXXX"
  //               returnKeyType="go"
  //             />
  //           </InputGroup>
  //         </Card.Body>
  //         <Card.Footer>
  //           <PrimaryButton
  //             onPress={submitCode}
  //             disabled={codeInput.trim().length === 0}
  //           >
  //             <PrimaryButton.Label>Continue</PrimaryButton.Label>
  //           </PrimaryButton>
  //         </Card.Footer>
  //       </Card>
  //     ) : requested ? (
  //       <CenterCard
  //         title="Request sent"
  //         body="Your join request is now waiting for the Adhyaksh to approve it. You'll be notified once they review it."
  //       >
  //         <PrimaryButton onPress={() => router.replace("/")}>
  //           <PrimaryButton.Label>Done</PrimaryButton.Label>
  //         </PrimaryButton>
  //       </CenterCard>
  //     ) : previewQuery.isLoading ? (
  //       <View className="items-center justify-center py-10">
  //         <ActivityIndicator />
  //       </View>
  //     ) : previewQuery.isError || !preview || !preview.kosh ? (
  //       <CenterCard
  //         title="Could not load invite"
  //         body={
  //           previewQuery.data?.inviteStatus === "not_found"
  //             ? "This invite code doesn't look right."
  //             : "Something went wrong loading this invite. Try again."
  //         }
  //       >
  //         <PrimaryButton onPress={() => previewQuery.refetch()}>
  //           <PrimaryButton.Label>Try again</PrimaryButton.Label>
  //         </PrimaryButton>
  //         {isManualEntry ? (
  //           <OutlineButton onPress={changeCode}>
  //             <OutlineButton.Label>Try another code</OutlineButton.Label>
  //           </OutlineButton>
  //         ) : null}
  //       </CenterCard>
  //     ) : inviteIssue ? (
  //       <CenterCard title={inviteIssue.title} body={inviteIssue.body}>
  //         <PrimaryButton onPress={() => router.replace("/")}>
  //           <PrimaryButton.Label>Ok</PrimaryButton.Label>
  //         </PrimaryButton>
  //         {isManualEntry ? (
  //           <OutlineButton onPress={changeCode}>
  //             <OutlineButton.Label>Try another code</OutlineButton.Label>
  //           </OutlineButton>
  //         ) : null}
  //       </CenterCard>
  //     ) : preview.yourMembership === "active" ? (
  //       <CenterCard
  //         title={`You're already a member`}
  //         body={
  //           preview.kosh.name
  //             ? `You're already part of "${preview.kosh.name}".`
  //             : "You're already a member of this kosh."
  //         }
  //       >
  //         <PrimaryButton onPress={() => router.replace("/")}>
  //           <PrimaryButton.Label>Go to My Kosh</PrimaryButton.Label>
  //         </PrimaryButton>
  //       </CenterCard>
  //     ) : preview.yourMembership === "pending" ? (
  //       <CenterCard
  //         title="Request pending"
  //         body="You already have a pending request to join this kosh. The Adhyaksh hasn't reviewed it yet."
  //       >
  //         <PrimaryButton onPress={() => router.replace("/")}>
  //           <PrimaryButton.Label>Done</PrimaryButton.Label>
  //         </PrimaryButton>
  //       </CenterCard>
  //     ) : (
  //       <Card className="gap-3">
  //         <Card.Body className="items-center gap-3 py-2">
  //           <Card.Title className="text-center text-xl">
  //             {preview.kosh.name}
  //           </Card.Title>
  //           {preview.kosh.description ? (
  //             <Card.Description className="text-center text-sm">
  //               {preview.kosh.description}
  //             </Card.Description>
  //           ) : null}
  //           <View className="flex-row items-center gap-2">
  //             <ThemedText className="text-sm text-muted">
  //               NPR {formatAmount(preview.kosh.monthlyAmount)} / month
  //             </ThemedText>
  //             <View className="h-1 w-1 rounded-full bg-muted" />
  //             <ThemedText className="text-sm text-muted">
  //               {preview.kosh.memberCount}{" "}
  //               {preview.kosh.memberCount === 1 ? "member" : "members"}
  //             </ThemedText>
  //           </View>
  //           <ThemedText className="text-xs text-muted">
  //             {preview.expiresAt
  //               ? `Invite expires ${new Date(
  //                   preview.expiresAt,
  //                 ).toLocaleDateString(undefined, {
  //                   day: "numeric",
  //                   month: "short",
  //                   year: "numeric",
  //                 })}`
  //               : "Invite"}{" "}
  //             · {preview.useCount} used
  //             {preview.maxUses ? ` of ${preview.maxUses}` : ""}
  //           </ThemedText>
  //         </Card.Body>
  //         <Card.Footer className="gap-2">
  //           <PrimaryButton
  //             onPress={() => requestMutation.mutate({ token })}
  //             disabled={requestMutation.isPending}
  //           >
  //             {requestMutation.isPending ? (
  //               <ActivityIndicator color="#fff" />
  //             ) : null}
  //             <PrimaryButton.Label>
  //               {requestMutation.isPending ? "Sending…" : "Join this kosh"}
  //             </PrimaryButton.Label>
  //           </PrimaryButton>
  //           <OutlineButton onPress={() => router.replace("/")}>
  //             <OutlineButton.Label>Not now</OutlineButton.Label>
  //           </OutlineButton>
  //         </Card.Footer>
  //       </Card>
  //     )}
  //   </ScrollView>
  // );
};

export default JoinScreen;
