import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, predict, type PredictionRequest, type PredictionResponse } from '../api/client'
import { DEFAULT_VALUES, FEATURES, SAMPLES, type FeatureKey } from '../data/features'
import FeatureField from '../components/FeatureField'
import ResultCard from '../components/ResultCard'

export default function Predict() {
  const [values, setValues] = useState<PredictionRequest>(DEFAULT_VALUES)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  /** Marks a result as superseded once the inputs move away from what produced it. */
  const [isStale, setIsStale] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const handleChange = useCallback((key: FeatureKey, value: number) => {
    setValues((current) => ({ ...current, [key]: value }))
    setIsStale(true)
  }, [])

  const applyValues = useCallback((next: PredictionRequest) => {
    setValues(next)
    setResult(null)
    setError(null)
    setIsStale(false)
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const response = await predict(values, controller.signal)
      setResult(response)
      setIsStale(false)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setResult(null)
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Something went wrong while running the model.',
      )
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false)
        abortRef.current = null
      }
    }
  }

  return (
    <>
      <section className="page-head">
        <div className="shell page-head__inner">
          <div>
            <p className="eyebrow">Classifier</p>
            <h1>Grade The Sample</h1>
          </div>

          <div className="samples">
            <span className="eyebrow">Load preset:</span>
            {SAMPLES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                className="btn btn--ghost"
                title={sample.note}
                onClick={() => applyValues(sample.values)}
              >
                {sample.name}
              </button>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => applyValues(DEFAULT_VALUES)}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <div className="shell">
        <form className="predict-layout" onSubmit={handleSubmit} noValidate>
          <div>
            <div className="field-grid">
              {FEATURES.map((feature) => (
                <FeatureField
                  key={feature.key}
                  meta={feature}
                  value={values[feature.key]}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              ))}
            </div>

            <div className="submit-bar">
              <button type="submit" className="btn btn--red" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Running
                  </>
                ) : (
                  <>Run classifier →</>
                )}
              </button>
              <p className="eyebrow">All nine values are graded 1–10</p>
            </div>
          </div>

          <aside className="result-rail">
            {error && (
              <div className="alert" role="alert">
                <strong>Prediction failed</strong>
                {error}
              </div>
            )}
            <ResultCard result={result} isStale={isStale} />
          </aside>
        </form>
      </div>
    </>
  )
}
