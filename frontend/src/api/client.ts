export interface PredictionRequest {
  clump_thickness: number
  uniformity_of_cell_size: number
  uniformity_of_cell_shape: number
  marginal_adhesion: number
  single_epithelial_cell_size: number
  bare_nuclei: number
  bland_chromatin: number
  normal_nucleoli: number
  mitoses: number
}

export interface PredictionResponse {
  prediction: number
  label: 'Benign' | 'Malignant'
  probability: {
    benign: number
    malignant: number
  }
}

/**
 * Requests are same-origin: `/api` is proxied to the FastAPI service by Vite in
 * development and by nginx in production, so the browser never issues a
 * cross-origin request and the backend needs no CORS middleware.
 */
const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    const detail = body?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(item.loc) ? item.loc.at(-1) : undefined
          return field ? `${field}: ${item.msg}` : item.msg
        })
        .filter(Boolean)
        .join(' · ')
    }
  } catch {
    // Response carried no JSON body — fall through to the generic message.
  }
  return `Request failed with status ${response.status}`
}

export async function predict(
  payload: PredictionRequest,
  signal?: AbortSignal,
): Promise<PredictionResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the prediction service.', 0)
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return (await response.json()) as PredictionResponse
}

export async function health(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/`, { signal })
    return response.ok
  } catch {
    return false
  }
}
