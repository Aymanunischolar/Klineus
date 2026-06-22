DEFAULT_SITE_SETTINGS = {
    "brand_name": "Klineus",
    "logo_path": "/static/images/klineus-logo.png",
    "favicon_path": None,
    "default_language": "de",
    "supported_languages": ["de", "en"],
    "nav_links": [
        {
            "label": {
                "de": "Unser Produkt",
                "en": "Our Product",
            },
            "href": "/product",
            "variant": "nav",
        },
        {
            "label": {
                "de": "Über uns",
                "en": "About Us",
            },
            "href": "/team",
            "variant": "nav",
        },
    ],
    "footer_links": [
        {
            "label": {
                "de": "Impressum",
                "en": "Imprint",
            },
            "href": "/legal#terms",
            "variant": "footer",
        },
        {
            "label": {
                "de": "Datenschutz",
                "en": "Privacy",
            },
            "href": "/legal#privacy",
            "variant": "footer",
        },
    ],
}