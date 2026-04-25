"use client";

import { useState, useCallback, useEffect } from "react";

interface FetchArgs {
  page: number;
  pageSize: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseDataFetchingOptions<T> {
  page: number;
  pageSize: number;
  fetchFunction: (args: FetchArgs) => Promise<{
    data: T[];
    total: number;
  }>;
}

export function useDataFetching<T>({
  page,
  pageSize,
  fetchFunction,
}: UseDataFetchingOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    pageSize,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFunction({ page, pageSize });

      setData(res.data);
      setPagination({
        page,
        pageSize,
        total: res.total,
        totalPages: Math.ceil(res.total / pageSize),
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fetchFunction]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    refetch,
  };
}
