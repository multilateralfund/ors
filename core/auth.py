from django_auth_adfs.backend import AdfsAccessTokenBackend, AdfsAuthCodeBackend
from django.contrib.auth.backends import ModelBackend


class HandleMultipleAuthBackend:
    def authenticate(self, request, **kwargs):
        if request and request.META.get("HTTP_AUTHORIZATION", "").startswith("Bearer "):
            backend = AdfsAccessTokenBackend()
            user = backend.authenticate(request, **kwargs)
            if user:
                return user

        if request and request.GET.get("code"):
            backend = AdfsAuthCodeBackend()
            user = backend.authenticate(request, **kwargs)
            if user:
                return user

        backend = ModelBackend()
        return backend.authenticate(request, **kwargs)

    def get_user(self, user_id):
        try:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            return User.objects.get(pk=user_id)
        except:
            return None
