"""Universes module - manages parallel universes"""
class Universes:
    def __init__(self):
        self.universes = []
    
    def create(self, strategy):
        self.universes.append({"strategy": strategy})
        return self.universes
    
    def get_all(self):
        return self.universes

