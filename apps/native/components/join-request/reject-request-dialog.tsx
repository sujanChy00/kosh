import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { AlertDialog, Text, TextButton } from "@expo/ui/jetpack-compose";
import { useRecyclingState } from "@legendapp/list/react-native";
import { useMutation } from "@tanstack/react-query";
import { useCSSVariable } from "uniwind";
import { Host } from "../layout/host";
import { DangerButton } from "../ui/button";

interface RejectJoinRequestDialogProps {
  requestId: string;
  koshId: string;
}

export const RejectJoinRequestDialog = ({
  requestId,
  koshId,
}: RejectJoinRequestDialogProps) => {
  const dangerColor = useCSSVariable("--color-danger") as string;
  const haptics = useHaptics();
  const [isVisible, setIsVisible] = useRecyclingState(false);

  const reviewMutation = useMutation(
    trpc.invite.review.mutationOptions({
      onSuccess: () => {
        successToast({
          title: "Join request rejected",
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invite.requests.queryKey({ koshId }),
        });
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Failed to update the request",
        });
      },
    }),
  );

  const onReject = () => {
    reviewMutation.mutate({ requestId, decision: "rejected" });
  };
  return (
    <>
      <DangerButton
        onPress={() => {
          setIsVisible(true);
        }}
        className="h-10"
        wrapperClassName="flex-1"
      >
        <DangerButton.Label>Reject</DangerButton.Label>
      </DangerButton>
      <Host matchContents>
        {isVisible && (
          <AlertDialog onDismissRequest={() => setIsVisible(false)}>
            <AlertDialog.Title>
              <Text
                style={{
                  fontFamily: "notosans-regular",
                }}
              >
                Reject Request?
              </Text>
            </AlertDialog.Title>
            <AlertDialog.Text>
              <Text
                style={{
                  fontFamily: "notosans-regular",
                }}
              >
                This user won't be added to the kosh.
              </Text>
            </AlertDialog.Text>
            <AlertDialog.ConfirmButton>
              <TextButton
                enabled={!reviewMutation.isPending}
                onClick={() => {
                  onReject();
                }}
              >
                <Text
                  color={dangerColor}
                  style={{
                    fontFamily: "notosans-regular",
                  }}
                >
                  {reviewMutation.isPending ? "please wait..." : "Reject"}
                </Text>
              </TextButton>
            </AlertDialog.ConfirmButton>
            <AlertDialog.DismissButton>
              <TextButton
                enabled={!reviewMutation.isPending}
                onClick={() => {
                  setIsVisible(false);
                }}
              >
                <Text
                  style={{
                    fontFamily: "notosans-regular",
                  }}
                >
                  Cancel
                </Text>
              </TextButton>
            </AlertDialog.DismissButton>
          </AlertDialog>
        )}
      </Host>
    </>
  );
};
