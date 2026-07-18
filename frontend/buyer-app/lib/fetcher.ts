export class FetchError extends Error {
  info?: Record<string, unknown>;
  status?: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new FetchError("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};
