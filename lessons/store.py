# Lessons/critique storage

class LessonsStore:
    def __init__(self):
        self.lessons = []

    def add_lesson(self, lesson):
        self.lessons.append(lesson)

    def get_recent(self, n):
        return self.lessons[-n:] if n <= len(self.lessons) else self.lessons
