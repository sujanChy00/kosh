import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { AlertDialog, Text, TextButton } from "@expo/ui/jetpack-compose";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCSSVariable } from "uniwind";

interface Props {
  koshId: string;
  koshName?: string;
  visible: boolean;
  setVisible: (v: boolean) => void;
}

export const DeleteKoshAlert = ({
  koshId,
  koshName,
  visible,
  setVisible,
}: Props) => {
  const router = useRouter();
  const haptics = useHaptics();
  const [dangerColor] = useCSSVariable(["--color-danger"]) as [string];

  const deleteMutation = useMutation(
    trpc.kosh.delete.mutationOptions({
      onSuccess: () => {
        haptics("success");
        successToast({ title: "Kosh deleted successfully" });
        queryClient.invalidateQueries({
          queryKey: trpc.kosh.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.kosh.getById.queryKey({ koshId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.kosh.recentActivity.queryKey(),
        });
        setVisible(false);
        router.replace("/(main)/(tab)");
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Failed to delete kosh",
        });
      },
    }),
  );

  if (!visible) return null;

  return (
    <AlertDialog onDismissRequest={() => setVisible(false)}>
      <AlertDialog.Title>
        <Text style={{ fontSize: 20 }}>Delete Kosh?</Text>
      </AlertDialog.Title>

      <AlertDialog.Text>
        <Text>
          {koshName
            ? `Are you sure you want to delete "${koshName}"?`
            : "Are you sure you want to delete this kosh?"}{" "}
          This action cannot be undone and will remove all associated member,
          contribution, and loan records.
        </Text>
      </AlertDialog.Text>

      <AlertDialog.DismissButton>
        <TextButton
          onClick={() => setVisible(false)}
          enabled={!deleteMutation.isPending}
        >
          <Text>Cancel</Text>
        </TextButton>
      </AlertDialog.DismissButton>

      <AlertDialog.ConfirmButton>
        <TextButton
          onClick={() => {
            if (koshId) {
              deleteMutation.mutate({ koshId });
            }
          }}
          enabled={!deleteMutation.isPending}
        >
          <Text color={dangerColor}>
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
    </AlertDialog>
  );
};
