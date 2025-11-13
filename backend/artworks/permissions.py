from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Csak a tulajdonos szerkesztheti a művet, mások csak olvashatják.
    """

    def has_object_permission(self, request, view, obj):
        # Olvasási jog bárkinek 
        if request.method in permissions.SAFE_METHODS:
            return True

        # Írási jog csak a tulajdonosnak
        return obj.user == request.user
