import { JoiningKoshPreview } from "@/components/kosh-join/joining-kosh-preview";
import { KoshInvitationCodeError } from "@/components/kosh-join/kosh-invitation-code-error";
import { RequestedToJoin } from "@/components/kosh-join/requested-to-join";
import { PendingComponent } from "@/components/layout/pending-component";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

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

const JoinScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token =
    typeof params.token === "string" ? params.token.trim().toUpperCase() : "";
  const [requested, setRequested] = useState(false);

  const previewQuery = useQuery(
    trpc.invite.preview.queryOptions({ token }, { enabled: token.length > 0 }),
  );

  const preview = previewQuery.data;
  const inviteIssue = preview && INVITE_STATUS_MESSAGES[preview.inviteStatus];

  if (!token)
    return (
      <KoshInvitationCodeError
        title="Could not load invite"
        cancelButtonText={"Try again"}
        onConfirm={(code) => {
          router.setParams({
            token: code,
          });
          previewQuery.refetch();
        }}
        onRetry={() => router.replace("/kosh")}
        message={"Something went wrong loading this invite. Try again."}
      />
    );

  if (requested) return <RequestedToJoin />;

  if (previewQuery.isLoading) return <PendingComponent />;

  if (previewQuery.isError || !preview || !preview.kosh)
    return (
      <KoshInvitationCodeError
        title="Could not load invite"
        cancelButtonText={"Try again"}
        onConfirm={(code) => {
          router.setParams({
            token: code,
          });
          previewQuery.refetch();
        }}
        onRetry={() => previewQuery.refetch()}
        message={
          previewQuery.data?.inviteStatus === "not_found"
            ? "This invite code doesn't look right."
            : "Something went wrong loading this invite. Try again."
        }
      />
    );

  if (inviteIssue)
    return (
      <KoshInvitationCodeError
        title={inviteIssue.title}
        onConfirm={(code) => {
          router.setParams({
            token: code,
          });
          previewQuery.refetch();
        }}
        onRetry={() => previewQuery.refetch()}
        message={inviteIssue.body}
      />
    );
  if (preview.yourMembership === "active")
    return (
      <KoshInvitationCodeError
        title={"You're already a member"}
        onConfirm={(code) => {
          router.setParams({
            token: code,
          });
          previewQuery.refetch();
        }}
        onRetry={() => router.replace("/kosh")}
        message={
          preview.kosh.name
            ? `You're already part of "${preview.kosh.name}".`
            : "You're already a member of this kosh."
        }
      />
    );
  if (preview.yourMembership === "pending")
    return (
      <KoshInvitationCodeError
        title="Request pending"
        onConfirm={(code) => {
          router.setParams({
            token: code,
          });
          previewQuery.refetch();
        }}
        onRetry={() => router.replace("/kosh")}
        message={
          "You already have a pending request to join this kosh. The Adhyaksh hasn't reviewed it yet."
        }
      />
    );
  return (
    <JoiningKoshPreview
      preview={preview}
      token={token}
      onRefetch={previewQuery.refetch}
      onSuccess={() => setRequested(true)}
    />
  );
};

export default JoinScreen;
