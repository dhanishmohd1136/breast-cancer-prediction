import { Link } from 'react-router-dom'
import { FEATURES } from '../data/features'
import { AUTHOR } from '../data/author'
import { AuthorIcon } from '../components/Icons'

/* Figures below are taken from notebooks/model_training.ipynb (held-out test split)
   and from data/raw/Brest_cancer_data.csv — not estimates. */
const STATS = [
  { value: '96.3%', label: 'Test accuracy', tone: 'red' },
  { value: '95.7%', label: 'Recall on malignant', tone: 'blue' },
  { value: '683', label: 'Training records', tone: 'yellow' },
  { value: '9', label: 'Input measurements', tone: 'ink' },
]

const PILLARS = [
  {
    accent: 'red' as const,
    title: 'Nine Measurements',
    body: 'Every prediction rests on the same nine cytological grades a pathologist records from a fine-needle aspirate, each scored 1 to 10.',
  },
  {
    accent: 'blue' as const,
    title: 'Calibrated Support Vector Machine',
    body: 'Median imputation and standard scaling feed an SVM selected by F1 score against logistic regression, random forest and gradient boosting.',
  },
  {
    accent: 'yellow' as const,
    title: 'Probability, Not Verdict',
    body: 'The service returns the class split, not a bare label. A 51/49 result should read very differently from a 99/1 result.',
  },
]

const STEPS = [
  {
    title: 'Grade the sample',
    body: 'Move nine sliders from 1 to 10. Or load a labelled row from the source dataset to see the pipeline end to end.',
  },
  {
    title: 'Run the model',
    body: 'Values post to the FastAPI service, which validates the bounds and runs the trained scikit-learn pipeline.',
  },
  {
    title: 'Read the split',
    body: 'You get benign and malignant probabilities side by side, so borderline cases stay visibly borderline.',
  },
]

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero__grid">
          <div className="hero__copy">
            <span className="hero__eyebrow eyebrow">
              Wisconsin Cytology · SVM Pipeline
            </span>
            <h1 className="hero__title">
              <em>Nine</em>
              <em className="accent-red">Numbers.</em>
              <em className="accent-blue">One Call.</em>
            </h1>
            <p className="hero__lede">
              A breast cancer cytology classifier built on the Wisconsin dataset. Grade the
              sample, and the model returns a benign or malignant probability split in a
              single request.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--red" to="/predict">
                Run a prediction →
              </Link>
              <a className="btn" href="#method">
                How it works
              </a>
            </div>
          </div>

          {/* Circle, square, half-round: the Bauhaus preliminary course, as a plate. */}
          <div className="hero__composition" aria-hidden="true">
            <span className="comp comp--circle-red" />
            <span className="comp comp--square-blue" />
            <span className="comp comp--bar" />
            <span className="comp comp--half-yellow" />
            <span className="comp comp--dot" />
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Model performance">
        {STATS.map((stat) => (
          <div className={`stat stat--${stat.tone}`} key={stat.label}>
            <div className="stat__value">{stat.value}</div>
            <div className="stat__label">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="shell">
          <div className="section__head">
            <span className="section__index">01</span>
            <h2 className="section__title">Built On Evidence</h2>
            <p className="section__sub">
              Nothing here is a black box for its own sake. The inputs, the pipeline and the
              output format are all fixed and inspectable.
            </p>
          </div>

          <div className="feature-grid">
            {PILLARS.map((pillar) => (
              <article className="feature-card" key={pillar.title}>
                <div className={`feature-card__icon is-${pillar.accent}`} />
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="method">
        <div className="shell">
          <div className="section__head">
            <span className="section__index">02</span>
            <h2 className="section__title">Three Moves</h2>
            <p className="section__sub">
              From raw slide grades to a probability split, with no step hidden between them.
            </p>
          </div>

          <div className="steps">
            {STEPS.map((step, index) => (
              <div className="step" key={step.title}>
                <span className="step__num">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section__head">
            <span className="section__index">03</span>
            <h2 className="section__title">The Inputs</h2>
            <p className="section__sub">
              Each feature is graded 1 to 10 by a cytopathologist. Higher generally means
              more abnormal — with the notable exception of bare nuclei.
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article className="feature-card" key={feature.key}>
                <div className={`feature-card__icon is-${feature.accent}`} />
                <h3>{feature.label}</h3>
                <p>{feature.hint}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="cta">
            <div>
              <h2>
                Grade a sample.
                <br />
                Get the split.
              </h2>
              <p>
                Two preset rows from the source dataset are one click away, so you can see a
                benign and a malignant case before entering your own.
              </p>
            </div>
            <Link className="btn btn--yellow" to="/predict">
              Open the classifier →
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--last">
        <div className="shell">
          <div className="section__head">
            <span className="section__index">04</span>
            <h2 className="section__title">{AUTHOR.role}</h2>
          </div>

          <div className="credit">
            <div>
              <h3 className="credit__name">{AUTHOR.name}</h3>
              <span className="credit__underline" aria-hidden="true" />
            </div>
            <span className="credit__marks" aria-hidden="true">
              <i className="credit__mark credit__mark--circle" />
              <i className="credit__mark credit__mark--square" />
              <i className="credit__mark credit__mark--half" />
            </span>

            <div className="credit__links">
              {AUTHOR.links.map((link) => (
                <a
                  key={link.label}
                  className="btn"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AuthorIcon label={link.label} />
                  {link.label} →
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
