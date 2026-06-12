"""
Quant Black Box — Strategy validation utilities.
"""

from __future__ import annotations


def validate_strategy_params(parameters: dict, params_schema: dict) -> list[str]:
    """
    Validate a parameter dict against a schema.

    Parameters
    ----------
    parameters : dict
        Actual parameter values.
    params_schema : dict
        Schema with keys: type, default, min, max, choices.

    Returns
    -------
    list[str]
        List of error messages (empty if valid).
    """
    errors: list[str] = []
    for key, schema in params_schema.items():
        if key not in parameters:
            # Missing optional parameter — fill default
            if "default" in schema:
                parameters[key] = schema["default"]
            continue
        value = parameters[key]
        expected_type = schema.get("type", "float")
        if expected_type == "int" and not isinstance(value, int):
            errors.append(f"{key}: expected int, got {type(value).__name__}")
        elif expected_type == "float" and not isinstance(value, (int, float)):
            errors.append(f"{key}: expected float, got {type(value).__name__}")
        if "min" in schema:
            if value < schema["min"]:
                errors.append(f"{key}: {value} < min {schema['min']}")
        if "max" in schema:
            if value > schema["max"]:
                errors.append(f"{key}: {value} > max {schema['max']}")
        if "choices" in schema:
            if value not in schema["choices"]:
                errors.append(
                    f"{key}: {value} not in {schema['choices']}"
                )
    return errors


def validate_backtest_request(data: dict) -> list[str]:
    """Validate a backtest request body."""
    errors: list[str] = []
    required = ["strategy_name", "asset", "start_date", "end_date"]
    for field in required:
        if field not in data or not data[field]:
            errors.append(f"Missing required field: {field}")
    if errors:
        return errors
    # Simple date validation
    import re

    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    if not date_pattern.match(str(data["start_date"])):
        errors.append("start_date must be YYYY-MM-DD")
    if not date_pattern.match(str(data["end_date"])):
        errors.append("end_date must be YYYY-MM-DD")
    return errors
