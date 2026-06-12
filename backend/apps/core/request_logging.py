import logging
import threading

_request_id_local = threading.local()


def set_request_id(request_id: str) -> None:
    _request_id_local.request_id = request_id


def get_request_id() -> str:
    return getattr(_request_id_local, "request_id", "-")


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True
