from django.db import transaction

from apps.audit.services import log_audit

from .notifications import send_order_status_email
from .models import CourierProfile, Order, OrderStatusHistory

RESTAURANT_ALLOWED = {
    Order.Status.PREPARING: {Order.Status.PICKUP_CONFIRMED},
}
COURIER_ALLOWED = {
    Order.Status.DELIVERING: {Order.Status.PICKUP_CONFIRMED, Order.Status.PREPARING},
    Order.Status.DELIVERED: {Order.Status.DELIVERING},
}


def assert_role_may_cancel(*, actor, order: Order) -> None:
    if actor is None:
        return
    if getattr(actor, "is_superuser", False) or getattr(actor, "role", None) == "admin":
        return
    if not order.can_transition_to(Order.Status.CANCELLED):
        raise ValueError("Cette commande ne peut plus être annulée.")

    role = getattr(actor, "role", None)
    if role == "restaurant":
        if order.restaurant_id != actor.restaurant_profile_id:
            raise ValueError("Accès refusé.")
        if order.status not in (
            Order.Status.PICKUP_CONFIRMED,
            Order.Status.PREPARING,
        ):
            raise ValueError(
                "Après récupération par le livreur, seul le livreur peut annuler la course."
            )
    elif role == "courier":
        if order.courier_id != actor.courier_profile_id:
            raise ValueError("Accès refusé.")
        allowed = Order.BEFORE_PICKUP_STATUSES | {Order.Status.DELIVERING}
        if order.status not in allowed:
            raise ValueError("Annulation impossible à ce stade.")
    else:
        raise ValueError("Transition non autorisée pour ce rôle.")


def assert_role_may_transition(*, actor, order: Order, new_status: str) -> None:
    if new_status == Order.Status.CANCELLED:
        assert_role_may_cancel(actor=actor, order=order)
        return
    if actor is None:
        return
    if getattr(actor, "is_superuser", False) or getattr(actor, "role", None) == "admin":
        return
    role = getattr(actor, "role", None)
    if role == "restaurant":
        allowed_from = RESTAURANT_ALLOWED.get(new_status, set())
        if order.status not in allowed_from:
            raise ValueError(
                "Attendez qu'un livreur confirme la course avant de lancer la préparation."
            )
    elif role == "courier":
        allowed_from = COURIER_ALLOWED.get(new_status, set())
        if order.status not in allowed_from:
            raise ValueError(f"Transition interdite pour le livreur : {order.status} → {new_status}")
    else:
        raise ValueError("Transition non autorisée pour ce rôle.")


def _cancellation_phase_for(status: str) -> str:
    if status in Order.BEFORE_PICKUP_STATUSES:
        return Order.CancelledPhase.BEFORE_PICKUP
    if status == Order.Status.DELIVERING:
        return Order.CancelledPhase.AFTER_PICKUP
    return ""


@transaction.atomic
def transition_order(*, order: Order, new_status: str, actor, note: str = "") -> Order:
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status == new_status:
        return order
    assert_role_may_transition(actor=actor, order=order, new_status=new_status)
    if not order.can_transition_to(new_status):
        raise ValueError(f"Transition interdite : {order.status} → {new_status}")
    old = order.status
    order.status = new_status
    update_fields = ["status", "version", "updated_at"]

    if new_status == Order.Status.CANCELLED:
        order.cancelled_phase = _cancellation_phase_for(old)
        order.cancellation_reason = (note or "").strip()
        update_fields.extend(["cancelled_phase", "cancellation_reason"])

    order.version += 1
    order.save(update_fields=update_fields)
    OrderStatusHistory.objects.create(
        order=order,
        from_status=old,
        to_status=new_status,
        changed_by=actor,
        note=note or order.cancellation_reason,
    )
    log_audit(
        actor=actor,
        action="order.status_change",
        target_type="order",
        target_id=str(order.id),
        metadata={
            "from": old,
            "to": new_status,
            "public_id": order.public_id,
            "cancelled_phase": order.cancelled_phase or None,
        },
    )
    if new_status == Order.Status.PREPARING:
        pass
    else:
        send_order_status_email(order, new_status)
    from .push_notifications import notify_client_order_status

    notify_client_order_status(order, new_status)
    return order


@transaction.atomic
def assign_courier(*, order: Order, courier, actor) -> Order:
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.courier_id is not None:
        raise ValueError("Cette course a déjà été prise par un autre livreur.")
    if order.status not in (Order.Status.PLACED, Order.Status.PREPARING):
        raise ValueError("Cette commande n'est plus disponible.")
    old_status = order.status
    order.courier = courier
    if order.status == Order.Status.PLACED:
        order.status = Order.Status.PICKUP_CONFIRMED
    order.version += 1
    order.save(update_fields=["courier", "status", "version", "updated_at"])
    OrderStatusHistory.objects.create(
        order=order,
        from_status=old_status,
        to_status=order.status,
        changed_by=actor,
        note=f"Livreur: {courier.display_name}",
    )
    log_audit(
        actor=actor,
        action="order.assign_courier",
        target_type="order",
        target_id=str(order.id),
        metadata={"courier_id": courier.id, "public_id": order.public_id},
    )
    if order.status == Order.Status.PICKUP_CONFIRMED:
        send_order_status_email(order, Order.Status.PICKUP_CONFIRMED)
        from .push_notifications import notify_client_order_status, notify_restaurant_new_order

        notify_client_order_status(order, Order.Status.PICKUP_CONFIRMED)
        notify_restaurant_new_order(order)
    return order


@transaction.atomic
def auto_dispatch_order(*, order: Order) -> Order:
    """Assigne un livreur disponible et passe la commande en « en route vers le restaurant »."""
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status != Order.Status.PLACED:
        return order
    courier = CourierProfile.objects.filter(is_active=True).order_by("id").first()
    if not courier:
        raise ValueError("Aucun livreur disponible.")
    return assign_courier(order=order, courier=courier, actor=None)


@transaction.atomic
def mark_order_ready_for_pickup(*, order: Order, actor=None) -> Order:
    """Restaurant a terminé — le livreur peut récupérer la commande."""
    if order.status == Order.Status.PICKUP_CONFIRMED:
        return transition_order(
            order=order,
            new_status=Order.Status.PREPARING,
            actor=actor,
            note="Commande prête au comptoir",
        )
    return order
