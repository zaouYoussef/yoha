from apps.core.media import delete_stored_keys


def restaurant_image_keys(restaurant) -> list[str]:
    keys = []
    if restaurant.cover_file:
        keys.append(restaurant.cover_file)
    if restaurant.cover_thumb:
        keys.append(restaurant.cover_thumb)
    if restaurant.logo_file:
        keys.append(restaurant.logo_file)
    if restaurant.logo_thumb:
        keys.append(restaurant.logo_thumb)
    return keys


def menu_item_image_keys(item) -> list[str]:
    keys = []
    if item.image_file:
        keys.append(item.image_file)
    if item.image_thumb:
        keys.append(item.image_thumb)
    return keys


def clear_restaurant_cover(restaurant) -> None:
    delete_stored_keys(restaurant.cover_file, restaurant.cover_thumb)
    restaurant.cover_file = ""
    restaurant.cover_thumb = ""
    restaurant.cover_url = ""


def clear_restaurant_logo(restaurant) -> None:
    delete_stored_keys(restaurant.logo_file, restaurant.logo_thumb)
    restaurant.logo_file = ""
    restaurant.logo_thumb = ""
    restaurant.logo_url = ""


def clear_menu_item_image(item) -> None:
    delete_stored_keys(item.image_file, item.image_thumb)
    item.image_file = ""
    item.image_thumb = ""
    item.image_url = ""
