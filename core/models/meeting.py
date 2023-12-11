from django.db import models


class Meeting(models.Model):
    class MeetingStatus(models.TextChoices):
        PLANNED = "planned", "Planned"
        OPEN = "open", "Open"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    number = models.IntegerField()
    status = models.CharField(max_length=20, choices=MeetingStatus.choices)
    date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Meetings"

    def __str__(self):
        return f"Meeting {self.number}"


class Decision(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE)
    number = models.IntegerField()
    description = models.TextField()

    class Meta:
        verbose_name_plural = "Decisions"

    def __str__(self):
        return f"Meeting {self.meeting.number} - decision {self.number}"
