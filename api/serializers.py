from rest_framework import serializers
from core.models import Substance
from core.models import Group
from core.models import Usage

class SubstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Substance
        fields = '__all__'

class GroupSerializer(serializers.ModelSerializer):
    substances = SubstanceSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'name_alt', 'annex', 'description', 'substances']

class UsageSerializer(serializers.ModelSerializer):
    # parent = serializers.SerializerMethodField()
    class Meta:
        model = Usage
        fields = ('id', 'name', 'parent',)

    def to_representation(self, instance):
        self.fields['parent'] = UsageSerializer(read_only=True)
        return super(UsageSerializer, self).to_representation(instance)