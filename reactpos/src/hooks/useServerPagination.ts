import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UseServerPaginationOptions {
  endpoint: string;
  defaultPageSize?: number;
  extraParams?: Record<string, string>;
}

export function useServerPagination<T>({
  endpoint,
  defaultPageSize = 10,
  extraParams = {},
}: UseServerPaginationOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Serialize extraParams for dependency tracking
  const extraParamsKey = JSON.stringify(extraParams);
  const prevExtraParamsKey = useRef(extraParamsKey);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search or extraParams change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (prevExtraParamsKey.current !== extraParamsKey) {
      prevExtraParamsKey.current = extraParamsKey;
      setPage(1);
    }
  }, [extraParamsKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      };
      if (debouncedSearch) params.search = debouncedSearch;

      // Merge extra params
      const extra = JSON.parse(extraParamsKey) as Record<string, string>;
      for (const [k, v] of Object.entries(extra)) {
        if (v) params[k] = v;
      }

      const response = await api.get<PagedResponse<T>>(endpoint, { params });
      setData(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch {
      setData([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, debouncedSearch, extraParamsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setSearch = useCallback((val: string) => {
    setSearchRaw(val);
  }, []);

  return {
    data,
    loading,
    page,
    pageSize,
    totalCount,
    totalPages,
    search,
    setSearch,
    setPage,
    setPageSize,
    refresh: fetchData,
  };
}
