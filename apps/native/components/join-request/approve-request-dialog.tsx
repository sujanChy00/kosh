import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import {
  AlertDialog,
  Button,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { useRecyclingState } from "@legendapp/list/react-native";
import { useMutation } from "@tanstack/react-query";
import { Host } from "../layout/host";
import { PrimaryButton } from "../ui/button";

interface ApproveJoinRequestDialogProps {
  requestId: string;
  koshId: string;
}

export const ApproveJoinRequestDialog = ({
  requestId,
  koshId,
}: ApproveJoinRequestDialogProps) => {
  const haptics = useHaptics();
  const [isVisible, setIsVisible] = useRecyclingState(false);

  const reviewMutation = useMutation(
    trpc.invite.review.mutationOptions({
      onSuccess: () => {
        successToast({
          title: "Join request approved",
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

  const onApprove = () => {
    reviewMutation.mutate({ requestId, decision: "approved" });
  };
  return (
    <>
      <PrimaryButton
        onPress={() => {
          setIsVisible(true);
        }}
        className="h-10"
        wrapperClassName="flex-1"
      >
        <PrimaryButton.Label>Approve</PrimaryButton.Label>
      </PrimaryButton>
      <Host matchContents>
        {isVisible && (
          <AlertDialog onDismissRequest={() => setIsVisible(false)}>
            <AlertDialog.Title>
              <Text
                style={{
                  fontFamily: "notosans-regular",
                }}
              >
                Approve Request?
              </Text>
            </AlertDialog.Title>
            <AlertDialog.Text>
              <Text
                style={{
                  fontFamily: "notosans-regular",
                }}
              >
                This user will be added to the kosh.
              </Text>
            </AlertDialog.Text>
            <AlertDialog.ConfirmButton>
              <Button
                enabled={!reviewMutation.isPending}
                onClick={() => {
                  onApprove();
                }}
              >
                <Text
                  style={{
                    fontFamily: "notosans-regular",
                  }}
                >
                  {reviewMutation.isPending ? "please wait..." : "Approve"}
                </Text>
              </Button>
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
