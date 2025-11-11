const waitFor = (duration: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (duration <= 0) {
      resolve()
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', onAbort)
      }
      resolve()
    }, duration)

    const onAbort = () => {
      window.clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    if (signal) {
      if (signal.aborted) {
        window.clearTimeout(timeoutId)
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })

export interface FetchWithRetryOptions extends RequestInit {
  retries?: number
  retryDelayMs?: number
  retryOn?: number[]
}

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  { retries = 2, retryDelayMs = 1200, retryOn = [429, 502, 503], signal, ...init }: FetchWithRetryOptions = {},
): Promise<Response> => {
  let attempt = 0
  let lastError: Error | null = null

  while (attempt <= retries) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      const response = await fetch(input, { ...init, signal })

      if (response.ok || !retryOn.includes(response.status) || attempt === retries) {
        return response
      }

      // Consume and discard the body before retrying to avoid resource leaks.
      try {
        await response.body?.cancel()
      } catch {
        // ignore cancellation errors
      }

      attempt += 1
      await waitFor(retryDelayMs * attempt, signal)
      continue
    } catch (error) {
      lastError = error as Error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      if (attempt === retries) {
        break
      }
      attempt += 1
      await waitFor(retryDelayMs * attempt, signal)
    }
  }

  throw lastError ?? new Error('Request failed')
}


