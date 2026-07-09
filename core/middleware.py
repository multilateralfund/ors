from django.middleware.csrf import get_token


class EnsureCsrfCookieMiddleware:
    """
    Re-issues the csrftoken cookie on every authenticated response, so a
    session cookie can never end up without a matching CSRF cookie (which
    causes DRF's SessionAuthentication to reject writes with "CSRF cookie
    not set" even for a properly authenticated user).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(request, "user", None) and request.user.is_authenticated:
            get_token(request)
        return self.get_response(request)
