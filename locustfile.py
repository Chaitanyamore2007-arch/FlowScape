from locust import HttpUser, task, between

class FlowScapeUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def get_venues(self):
        self.client.get("/")

    @task(3)
    def simulate_booking(self):
        self.client.post("/bookings?user_id=load-test-user", json={
            "venue_id": "123e4567-e89b-12d3-a456-426614174000",
            "start_time": "2024-01-01T10:00:00Z",
            "end_time": "2024-01-01T11:00:00Z"
        })
