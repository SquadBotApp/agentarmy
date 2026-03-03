class Agent:
    def __init__(self, name, router):
        self.name = name
        self.router = router

    def run(self, task):
        return self.router.execute(task)
