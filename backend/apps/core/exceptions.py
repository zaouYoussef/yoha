import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("apps.core.exceptions")


def yoha_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        payload = {"error": True, "detail": response.data}
        response.data = payload
        return response

    # Log the exception for system administration
    logger.error("Unhandled Exception caught in API handler", exc_info=exc, extra={"context": context})

    # Return a generic secure error payload
    return Response(
        {"error": True, "detail": "Une erreur interne est survenue. Veuillez réessayer plus tard."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


class BusinessError(Exception):
    """Erreur métier contrôlée (pas de fuite d'info interne)."""

    def __init__(self, message: str, code: str = "business_error", status_code=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)
