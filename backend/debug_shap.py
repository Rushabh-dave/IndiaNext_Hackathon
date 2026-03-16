import shap
import numpy as np

bg = np.array([[0.8, 0.2]] * 10)
inp = np.array([[0.01, 0.99]])

explainer = shap.KernelExplainer(lambda x: x, bg, silent=True)
sv = explainer.shap_values(inp, nsamples=100, silent=True)
arr = np.array(sv)

print(f"shap_values type: {type(sv)}")
print(f"np.array shape: {arr.shape}")
print(f"ndim: {arr.ndim}")
print(f"full array:\n{arr}")
