from pydantic import BaseModel,Field

class Prediction_Request(BaseModel):

    clump_thickness            : int = Field(...,ge=1,le=10)

    uniformity_of_cell_size    : int = Field(...,ge=1,le=10)

    uniformity_of_cell_shape   : int = Field(...,ge=1,le=10)

    marginal_adhesion          : int = Field(...,ge=1,le=10)

    single_epithelial_cell_size: int = Field(...,ge=1,le=10)

    bare_nuclei                : int = Field(...,ge=1,le=10)

    bland_chromatin            : int = Field(...,ge=1,le=10)

    normal_nucleoli            : int = Field(...,ge=1,le=10)

    mitoses                    : int = Field(...,ge=1,le=10)
