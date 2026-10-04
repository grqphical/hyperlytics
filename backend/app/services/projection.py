import numpy as np
import pandas as pd

# Stretches the standardized scores before projecting. Smaller = points cluster
# nearer the center; larger = elite outliers get pushed against the boundary.
SCALE = 0.6


def to_poincare_ball(z: pd.DataFrame, scale: float = SCALE) -> pd.DataFrame:
    """
    Map standardized (offense, defense, physical) z-scores into the Poincare ball.

    Treat each player's z-scores as a vector v. Walking a hyperbolic distance r
    from the origin along v/|v| lands at radius tanh(r/2) in the ball. The
    direction is kept and the radius is squashed into (0, 1).

    Rows with any NaN stay NaN.
    """
    v = z.to_numpy(dtype=float) * scale
    r = np.linalg.norm(v, axis=1, keepdims=True)
    with np.errstate(invalid="ignore", divide="ignore"):
        factor = np.where(r > 0, np.tanh(r / 2) / r, 0.0)
    return pd.DataFrame(v * factor, index=z.index, columns=["x", "y", "z"])