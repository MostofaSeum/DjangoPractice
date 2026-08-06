from locust import HttpUser, task,between
from random import randint

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    @task(2)
    def view_product(self):
        collection_id = randint(2,6)
        response = self.client.get(f"/store/products?collection_id={collection_id}",name="/store/products")
        response.raise_for_status()

    @task(4)
    def view_products(self):
        product_id = randint(1,1000)
        response = self.client.get(f"/store/products/{product_id}",name="/store/products/:id")
        response.raise_for_status()
    

    @task(1)
    def add_to_cart(self):
        product_id = randint(1,10)
        response = self.client.post(f"/store/carts/{self.cart_id}/items/",name="/store/carts/items", json = {"product_id": product_id,"quantity":1})
        response.raise_for_status()

    def on_start(self):
        response = self.client.post(f"/store/carts/")
        result =  response.json()
        self.cart_id = result["id"]