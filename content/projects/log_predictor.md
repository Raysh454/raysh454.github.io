---
title: "Log_Predictor"
date: "2025-12-27"
summary: "Log_Predictor is a Python project that demonstrates neural network approaches (both manual and PyTorch implementations) for approximating the base-10 logarithm (log10(x)) of numeric inputs."
repo: "https://github.com/Raysh454/Log_Predictor"
---

# Log_Predictor

**Log_Predictor** is a Python project that demonstrates neural network approaches (both manual and PyTorch implementations) for approximating the base-10 logarithm (`log10(x)`) of numeric inputs. The repository contains code to build, train, and evaluate neural networks for this regression problem and includes utilities for model evaluation and result visualization.

---

## Features

- **Manual Neural Network:**  
  - `manual_nn.py` implements a neural network from scratch using only Python and standard libraries.
  - Supports stochastic gradient descent, manual backpropagation, and custom stopping/learning rate decay logic.
  - Uses parameters stored in JSON files.
- **PyTorch Neural Network:**  
  - `nn.py` provides an equivalent solution using PyTorch’s `nn.Module` for the network definition, SGD for optimization, and MSE loss for training.
  - Model saving and loading for prediction without retraining.
- **Data Utilities:**  
  - `table.py` supplies a lookup table and training/testing data for log10 values.
- **Visualization:**  
  - `plot.py` visualizes and compares the predicted versus true log10 values on a range of input data, leveraging matplotlib.

---

## Repository Structure

```
Log_Predictor/
├── manual_nn.py         # Manual neural network (from scratch, no external ML libraries)
├── nn.py                # PyTorch-based neural network implementation
├── table.py             # Training/testing data and lookup utilities
├── plot.py              # Visualization for prediction results
├── log_model.pth        # (Generated) PyTorch saved model parameters
├── initial_params.json  # Example initial parameters for manual NN
├── parameters_4.json    # Training parameters for 4-node hidden layer
├── parameters_8.json    # Training parameters for 8-node hidden layer
```

---

## Usage

### 1. Manual Neural Network (`manual_nn.py`)

- **Train from scratch**  
  ```
  python manual_nn.py
  ```

- **Predict log10(x) using a trained model**  
  ```
  python manual_nn.py 123.45
  ```
  Outputs the predicted log10 value and the error.

### 2. PyTorch Neural Network (`nn.py`)

- **Train the PyTorch model**  
  ```
  python nn.py
  ```
  Saves the trained state to `log_model.pth`.

- **Predict for a specific value (after training)**  
  ```
  python nn.py 123.45
  ```
  Prints the predicted, true, and error values for log10(x).

### 3. Visualization (`plot.py`)

  ```
  python plot.py
  ```
  Shows a graph comparing predicted versus true log10 values for numbers between 1 and 10.

---

## Requirements

- Python 3.7+
- [PyTorch](https://pytorch.org/)
- [matplotlib](https://matplotlib.org/)
- numpy

Install dependencies as needed:
```bash
pip install torch matplotlib numpy
```

---

## Data and Parameters

- Neural network weights/biases for the manual network are kept in `*.json` files (e.g., `initial_params.json`).
- You can experiment with different numbers of hidden nodes (see provided parameter files).

---

## License

This project is provided for educational and demonstrative purposes. License information not specified.

---
