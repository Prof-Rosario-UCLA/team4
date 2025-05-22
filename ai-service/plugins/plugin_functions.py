import random
from typing import Annotated
from semantic_kernel.functions import kernel_function


# -------------------------------------------------------------Destinations Plugin------------------------------------------------------------


class DestinationsPlugin:
    def __init__(self):
        self.destinations = [
            "Barcelona, Spain",
            "Paris, France",
            "Berlin, Germany",
            "Tokyo, Japan",
            "Sydney, Australia",
            "New York, USA",
            "Cairo, Egypt",
            "Cape Town, South Africa",
            "Rio de Janeiro, Brazil",
            "Bali, Indonesia"
        ]

        self.last_destination = None

    @kernel_function(description="Provides a random vacation destination.")
    def get_random_destination(self) -> Annotated[str, "Returns a random vacation destination."]:
        # Get available destinations (excluding last one if possible)
        available_destinations = self.destinations.copy()
        if self.last_destination and len(available_destinations) > 1:
            available_destinations.remove(self.last_destination)

        # Select a random destination
        destination = random.choice(available_destinations)

        # Update the last destination
        self.last_destination = destination

        return destination
    
    @kernel_function(description="Provides the availability of a destination.")
    def get_availability(
        self, destination: Annotated[str, "The destination to check availability for."]
    ) -> Annotated[str, "Returns the availability of the destination."]:
        return """
        Barcelona - Unavailable
        Paris - Available
        Berlin - Available
        Tokyo - Unavailable
        New York - Available
        Sydney - Available
        Cairo - Available
        Cape Town - Available
        Rio de Janeiro - Unavailable
        Bali - Avaialable
        """ 
    


# -------------------------------------------------------------Prompt Plugin------------------------------------------------------------

class PromptPlugin:
    @kernel_function(
        name="build_augmented_prompt",
        description="Build an augmented prompt using retrieval context or function results.",
    )
    @staticmethod
    def build_augmented_prompt(query: str, retrieval_context: str) -> str:
        return(
            f"Retrieved Context:\n{retrieval_context}\n\n"
            f"User Query: {query}\n\n"
            "First review the retrieved context and compare it with the available plugin functions. If they have information mismatch, retrieve the information from context with more relevant keywords and details."
            "If the context doesn't answer the query, try calling available plugin functions. If no context is available, say so."
        )
    

# -------------------------------------------------------------Prompt Plugin------------------------------------------------------------

class WeatherInfoPlugin:
    """A Plugin that provides the average temperature for a travel destination."""
    def __init__(self):
        # Dictionary of destinations and their average temperatures
        self.destination_temperatures = {
            "maldives": "82°F (28°C)",
            "swiss alps": "45°F (7°C)",
            "african safaris": "75°F (24°C)"
        }
    @kernel_function(description="Get the average temperature for a specific travel destination.")
    def get_destination_temperature(self, destination: str) -> Annotated[str, "Returns the average temperature for the destination."]:
        """Get the average temperature for a travel destination."""
        normalized_destination = destination.lower()

        if normalized_destination in self.destination_temperatures:
            return f"The average temperature in {destination} is {self.destination_temperatures[normalized_destination]}."
        else:
            return f"Sorry, I don't have temperature information for {destination}. Available destinations are: Maldives, Swiss Alps, and African safaris."
        