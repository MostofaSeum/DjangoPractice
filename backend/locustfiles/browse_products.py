from locust import HttpUser, task

class WebsiteUser(HttpUser):
    host = "http://localhost:8000"

    @task
    def view_products(self):
        response = self.client.get("/api/products")
        response.raise_for_status()