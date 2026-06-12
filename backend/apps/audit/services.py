from .models import AuditLog


def log_audit(*, actor, action: str, target_type: str, target_id: str, ip=None, metadata=None):
    AuditLog.objects.create(
        actor=actor if actor and getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        ip_address=ip,
        metadata=metadata or {},
    )
