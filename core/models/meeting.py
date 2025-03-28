from django.db import models


class Meeting(models.Model):
    class MeetingStatus(models.TextChoices):
        PLANNED = "planned", "Planned"
        OPEN = "open", "Open"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    number = models.IntegerField(unique=True, null=True)
    title = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=MeetingStatus.choices)
    date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    internal_api_id = models.IntegerField(unique=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Meetings"

    def __str__(self):
        return f"Meeting {self.number}"


class Decision(models.Model):
    meeting = models.ForeignKey(
        Meeting, null=True, default=None, on_delete=models.CASCADE
    )
    number = models.CharField(
        max_length=255, blank=True, null=True, default="", unique=True
    )
    title = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name_plural = "Decisions"

    def __str__(self):
        return f"Meeting {self.meeting.number} - Decision {self.number}"
