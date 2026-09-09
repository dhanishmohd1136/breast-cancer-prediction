import { FEATURE_MAX, FEATURE_MIN, type FeatureMeta } from '../data/features'

interface Props {
  meta: FeatureMeta
  value: number
  onChange: (key: FeatureMeta['key'], value: number) => void
  disabled?: boolean
}

export default function FeatureField({ meta, value, onChange, disabled }: Props) {
  const inputId = `field-${meta.key}`
  const hintId = `${inputId}-hint`

  return (
    <div className="field">
      <div className="field__top">
        <div>
          <label className="field__label" htmlFor={inputId}>
            {meta.label}
          </label>
          <p className="field__hint" id={hintId}>
            {meta.hint}
          </p>
        </div>
        <output className={`field__value is-${meta.accent}`} htmlFor={inputId}>
          {value}
        </output>
      </div>

      <div className="field__slider">
        <input
          id={inputId}
          type="range"
          min={FEATURE_MIN}
          max={FEATURE_MAX}
          step={1}
          value={value}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(event) => onChange(meta.key, Number(event.target.value))}
        />
        <div className="field__ticks" aria-hidden="true">
          <span>{FEATURE_MIN}</span>
          <span>{FEATURE_MAX}</span>
        </div>
      </div>
    </div>
  )
}
