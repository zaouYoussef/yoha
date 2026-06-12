import uuid

from django.utils.deprecation import MiddlewareMixin


class RequestIdMiddleware(MiddlewareMixin):
    HEADER = "HTTP_X_REQUEST_ID"

    def process_request(self, request):
        from apps.core.request_logging import set_request_id

        request_id = request.META.get(self.HEADER) or str(uuid.uuid4())
        request.request_id = request_id
        set_request_id(request_id)

    def process_response(self, request, response):
        if hasattr(request, "request_id"):
            response["X-Request-Id"] = request.request_id
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.setdefault("Cross-Origin-Resource-Policy", "same-site")
        return response
