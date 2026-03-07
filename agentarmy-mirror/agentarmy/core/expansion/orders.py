"""Orders module - manages agent orders/tasks"""
class Orders:
    def __init__(self):
        self.orders = []
    
    def add(self, order):
        self.orders.append(order)
    
    def get_all(self):
        return self.orders

