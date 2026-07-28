from typing import Any, Dict

def success_response(data: Dict[str, Any], message: str = "Operation completed successfully") -> Dict[str, Any]:
    return {
        "status": "SUCCESS",
        "message": message,
        **data
    }

def error_response(message: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
    res = {
        "status": "FAILED",
        "message": message
    }
    if data:
        res.update(data)
    return res
