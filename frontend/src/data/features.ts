import type { PredictionRequest } from '../api/client'

export type FeatureKey = keyof PredictionRequest

export type Accent = 'red' | 'blue' | 'yellow'

export interface FeatureMeta {
  key: FeatureKey
  /** Column name as it appears in the training data. */
  column: string
  label: string
  hint: string
  accent: Accent
}

/** All nine inputs are graded 1–10 by a cytopathologist; the API enforces the same bounds. */
export const FEATURE_MIN = 1
export const FEATURE_MAX = 10

export const FEATURES: FeatureMeta[] = [
  {
    key: 'clump_thickness',
    column: 'Clump Thickness',
    label: 'Clump Thickness',
    hint: 'Benign cells cluster in monolayers; malignant cells stack in multilayers.',
    accent: 'red',
  },
  {
    key: 'uniformity_of_cell_size',
    column: 'Uniformity of Cell Size',
    label: 'Uniformity of Cell Size',
    hint: 'Variation in cell size across the sample. Cancer cells vary widely.',
    accent: 'blue',
  },
  {
    key: 'uniformity_of_cell_shape',
    column: 'Uniformity of Cell Shape',
    label: 'Uniformity of Cell Shape',
    hint: 'Irregular, inconsistent outlines point toward malignancy.',
    accent: 'yellow',
  },
  {
    key: 'marginal_adhesion',
    column: 'Marginal Adhesion',
    label: 'Marginal Adhesion',
    hint: 'Normal cells stick together. Loss of adhesion is a malignancy signal.',
    accent: 'blue',
  },
  {
    key: 'single_epithelial_cell_size',
    column: 'Single Epithelial Cell Size',
    label: 'Single Epithelial Cell Size',
    hint: 'Significantly enlarged single epithelial cells may be malignant.',
    accent: 'red',
  },
  {
    key: 'bare_nuclei',
    column: 'Bare Nuclei',
    label: 'Bare Nuclei',
    hint: 'Nuclei not surrounded by cytoplasm. Typically seen in benign tumours.',
    accent: 'yellow',
  },
  {
    key: 'bland_chromatin',
    column: 'Bland Chromatin',
    label: 'Bland Chromatin',
    hint: 'Uniform nuclear texture in benign cells; coarser in cancer cells.',
    accent: 'red',
  },
  {
    key: 'normal_nucleoli',
    column: 'Normal Nucleoli',
    label: 'Normal Nucleoli',
    hint: 'Small structures in the nucleus, more prominent in cancer cells.',
    accent: 'blue',
  },
  {
    key: 'mitoses',
    column: 'Mitoses',
    label: 'Mitoses',
    hint: 'The rate of cell division. Higher counts indicate aggressive growth.',
    accent: 'yellow',
  },
]

export const DEFAULT_VALUES: PredictionRequest = {
  clump_thickness: 1,
  uniformity_of_cell_size: 1,
  uniformity_of_cell_shape: 1,
  marginal_adhesion: 1,
  single_epithelial_cell_size: 2,
  bare_nuclei: 1,
  bland_chromatin: 3,
  normal_nucleoli: 1,
  mitoses: 1,
}

export interface Sample {
  name: string
  note: string
  values: PredictionRequest
}

/** Two verbatim rows from data/raw/Brest_cancer_data.csv, for one-click demos. */
export const SAMPLES: Sample[] = [
  {
    name: 'Sample 1000025',
    note: 'Labelled benign in the source dataset',
    values: {
      clump_thickness: 5,
      uniformity_of_cell_size: 1,
      uniformity_of_cell_shape: 1,
      marginal_adhesion: 1,
      single_epithelial_cell_size: 2,
      bare_nuclei: 1,
      bland_chromatin: 3,
      normal_nucleoli: 1,
      mitoses: 1,
    },
  },
  {
    name: 'Sample 1017122',
    note: 'Labelled malignant in the source dataset',
    values: {
      clump_thickness: 8,
      uniformity_of_cell_size: 10,
      uniformity_of_cell_shape: 10,
      marginal_adhesion: 8,
      single_epithelial_cell_size: 7,
      bare_nuclei: 10,
      bland_chromatin: 9,
      normal_nucleoli: 7,
      mitoses: 1,
    },
  },
]
