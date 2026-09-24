import { AnimatedView } from "@/components/animated-view";
import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { KoshLoanList } from "@/components/loan/kosh-loan-list";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { DangerSoftButton, SecondaryButton } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useMaterialColors } from "@expo/ui/jetpack-compose";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { FadeOut, ZoomIn } from "react-native-reanimated";

const PAGE_SIZE = 10;

const AllLoanScreen = () => {
  const materialColors = useMaterialColors();
  const {
    id: koshId,
    dateFrom,
    dateTo,
    memberId,
  } = useGlobalSearchParams<{
    id: string;
    memberId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>();
  const router = useRouter();

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    isLoading,
    error,
    isError,
  } = useInfiniteQuery(
    trpc.loan.allLoansByKosh.infiniteQueryOptions(
      {
        koshId,
        status: "all",
        memberId: memberId === "all" ? undefined : memberId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        limit: PAGE_SIZE,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const isFiltered = !!memberId || !!dateFrom || !!dateTo;
  const clearFilters = useCallback(() => {
    router.setParams({
      memberId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, [router]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <PendingComponent />;

  if (isError) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load kosh loans."}
      />
    );
  }

  return (
    <>
      <View
        className="absolute bottom-safe-offset-8 right-safe-offset-4 z-30 gap-y-3"
        pointerEvents="box-none"
      >
        {isFiltered && (
          <AnimatedView
            entering={ZoomIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <DangerSoftButton
              style={{
                backgroundColor: materialColors.errorContainer,
              }}
              className="p-0 size-12.5 rounded-2xl"
              onPress={clearFilters}
            >
              <StyledSymbolView
                tintColor={materialColors.error}
                name={{
                  android: "format_paint",
                }}
              />
            </DangerSoftButton>
          </AnimatedView>
        )}
        <SecondaryButton
          style={{
            backgroundColor: materialColors.primaryContainer,
          }}
          className="p-0 size-12.5 rounded-2xl"
          onPress={() =>
            router.push({
              pathname: "/kosh/[id]/filter-loans",
              params: {
                id: koshId,
              },
            })
          }
        >
          <StyledSymbolView
            tintColor={materialColors.primary}
            name={{
              android: "filter_list",
            }}
          />
        </SecondaryButton>
      </View>
      {items.length === 0 ? (
        <EmptyComponent
          actionButtonOnPress={clearFilters}
          actionButtonContent={
            <ThemedText className="text-primary-foreground">
              Clear Filters
            </ThemedText>
          }
          message={
            isFiltered
              ? "No loans match your filters"
              : "No loans or requests found"
          }
          description={
            isFiltered
              ? "Try adjusting or resetting the filters."
              : "Loans and pending requests for this kosh will appear here."
          }
        />
      ) : (
        <KoshLoanList
          items={items}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </>
  );
};

export default AllLoanScreen;
