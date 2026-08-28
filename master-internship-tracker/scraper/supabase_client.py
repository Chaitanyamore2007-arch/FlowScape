import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

def get_supabase_client() -> Client:
    """
    Initializes and returns a Supabase client using credentials
    from environment variables.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY environment variables.")
        
    return create_client(url, key)
