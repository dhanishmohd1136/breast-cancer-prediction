import type { PredictionResponse } from '../api/client'

interface Props {
  result: PredictionResponse | null
  isStale: boolean
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function Meter({
  title,
  value,
  variant,
}: {
  title: string
  value: number
  variant: 'benign' | 'malignant'
}) {
  return (
    <div>
      <div className="meter__head">
        <span>{title}</span>
        <span className="meter__pct">{pct(value)}</span>
      </div>
      <div
        className="meter__track"
        role="meter"
        aria-label={`${title} probability`}
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`meter__fill is-${variant}`}
          style={{ width: `${Math.max(value * 100, 0)}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultCard({ result, isStale }: Props) {
  if (!result) {
    return (
      <section className="result" aria-live="polite">
        <div className="result__banner is-idle">
          <span className="result__glyph is-circle" aria-hidden="true" />
          <div>
            <p className="eyebrow">Awaiting input</p>
            <h2 className="result__label">No result</h2>
          </div>
        </div>
        <p className="result__idle">
          Set the nine cytology grades, then run the classifier. The result and its
          confidence split appear here.
        </p>
      </section>
    )
  }

  const isMalignant = result.label === 'Malignant'
  const variant = isMalignant ? 'malignant' : 'benign'

  return (
    <section className="result" aria-live="polite">
      <div className={`result__banner is-${variant}`}>
        <span
          className={`result__glyph${isMalignant ? '' : ' is-circle'}`}
          aria-hidden="true"
        />
        <div>
          <p className="eyebrow">Classification</p>
          <h2 className="result__label">{result.label}</h2>
        </div>
      </div>

      <div className="result__body">
        <Meter title="Benign" value={result.probability.benign} variant="benign" />
        <Meter
          title="Malignant"
          value={result.probability.malignant}
          variant="malignant"
        />
        <p className="result__note">
          {isStale
            ? 'Inputs changed since this run — re-run the classifier to refresh.'
            : 'Probabilities come from the trained model and sum to 100%. Interpretation belongs to a clinician.'}
        </p>
      </div>
    </section>
  )
}
