import os
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from supabase_client import get_supabase_client
from google import genai
from google.genai import types

def verify_job_genuine(company, role, direct_link):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return True # Skip verification if no API key is provided
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
        Analyze this internship posting:
        Company: {company}
        Role: {role}
        Link: {direct_link}
        
        Is this a genuine, legitimate internship? 
        Answer ONLY 'YES' if it is a real internship at a real company. 
        Answer 'NO' if it looks like spam, a paid course disguised as an internship, a scam, or highly suspicious.
        """
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return 'YES' in response.text.upper()
    except Exception as e:
        print(f"Gemini Verification Error for {company}: {e}")
        return True # Default to True if API fails

def get_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    return webdriver.Chrome(options=chrome_options)

def determine_tier(company, location):
    company_lower = company.lower()
    location_lower = location.lower() if location else ""
    
    tier1 = ['google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix']
    tier2 = ['oracle', 'cisco', 'adobe', 'razorpay', 'cred', 'salesforce', 'uber']
    
    if any(t1 in company_lower for t1 in tier1):
        return 1
    elif any(t2 in company_lower for t2 in tier2):
        return 2
    elif 'pune' in location_lower or 'mumbai' in location_lower or 'nashik' in location_lower or 'maharashtra' in location_lower:
        return 3
    else:
        return 3 # Default to Tier 3 if it doesn't match 1 or 2

def scrape_linkedin():
    print("Scraping LinkedIn internships...")
    jobs_data = []
    driver = get_driver()
    
    try:
        # Search for software intern roles in India, posted in the past 24 hours
        url = "https://www.linkedin.com/jobs/search?keywords=Software%20Intern&location=India&f_TPR=r86400"
        driver.get(url)
        time.sleep(5) # Wait for initial load
        
        # Scroll to load more jobs (basic implementation)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        job_cards = soup.find_all('div', class_='base-card')
        
        for card in job_cards[:10]: # Limit to top 10 for safety/speed
            try:
                title_elem = card.find('h3', class_='base-search-card__title')
                company_elem = card.find('h4', class_='base-search-card__subtitle')
                location_elem = card.find('span', class_='job-search-card__location')
                link_elem = card.find('a', class_='base-card__full-link')
                
                if not (title_elem and company_elem and link_elem):
                    continue
                    
                title = title_elem.text.strip()
                company = company_elem.text.strip()
                location = location_elem.text.strip() if location_elem else "India"
                direct_link = link_elem.get('href')
                
                # Basic direct apply url cleanup (strip tracking params)
                if '?' in direct_link:
                    direct_link = direct_link.split('?')[0]
                
                tier = determine_tier(company, location)
                
                # Append to list
                jobs_data.append({
                    "tier": tier,
                    "company": company,
                    "role": title,
                    "direct_link": direct_link,
                    "location": location,
                    "hr_contact": None # LinkedIn public search doesn't easily expose HR without login
                })
            except Exception as e:
                print(f"Error parsing a LinkedIn job card: {e}")
                
    except Exception as e:
        print(f"LinkedIn Scraper Error: {e}")
    finally:
        driver.quit()
        
    return jobs_data

def scrape_naukri():
    print("Scraping Naukri internships...")
    jobs_data = []
    driver = get_driver()
    
    try:
        # Search for IT/Software internships in Maharashtra
        url = "https://www.naukri.com/it-internship-jobs-in-maharashtra"
        driver.get(url)
        time.sleep(5) # Wait for dynamic JS content to load
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        job_cards = soup.find_all('div', class_='srp-jobtuple-wrapper')
        
        for card in job_cards[:10]:
            try:
                title_elem = card.find('a', class_='title')
                company_elem = card.find('a', class_='comp-name')
                location_elem = card.find('span', class_='locWdth')
                
                if not (title_elem and company_elem):
                    continue
                
                title = title_elem.text.strip()
                company = company_elem.text.strip()
                location = location_elem.text.strip() if location_elem else "Maharashtra"
                direct_link = title_elem.get('href')
                
                tier = determine_tier(company, location)
                
                jobs_data.append({
                    "tier": tier,
                    "company": company,
                    "role": title,
                    "direct_link": direct_link,
                    "location": location,
                    "hr_contact": None # Advanced parsing required for Recruiter details
                })
            except Exception as e:
                print(f"Error parsing a Naukri job card: {e}")
                
    except Exception as e:
        print(f"Naukri Scraper Error: {e}")
    finally:
        driver.quit()
        
    return jobs_data

def process_internships(supabase, jobs_data):
    if not jobs_data:
        print("No jobs found to insert.")
        return
        
    print(f"Processing and uploading {len(jobs_data)} internships to Supabase...")
    for job in jobs_data:
        try:
            # Check if job already exists based on direct_link to prevent duplicates
            existing = supabase.table('internships').select('id').eq('direct_link', job["direct_link"]).execute()
            if existing.data and len(existing.data) > 0:
                continue # Skip duplicate
                
            # Verify job genuineness using Gemini AI
            if not verify_job_genuine(job["company"], job["role"], job["direct_link"]):
                print(f"Skipping scam/spam job: {job['role']} at {job['company']}")
                continue

            # Insert into internships table
            internship_res = supabase.table('internships').insert({
                "tier": job["tier"],
                "company": job["company"],
                "role": job["role"],
                "direct_link": job["direct_link"],
                "location": job["location"]
            }).execute()
            
            # Get the ID of the newly inserted internship
            if internship_res.data and len(internship_res.data) > 0:
                internship_id = internship_res.data[0]['id']
                
                # Insert HR contact if exists
                if job.get("hr_contact"):
                    supabase.table('hr_contacts').insert({
                        "internship_id": internship_id,
                        "hr_name": job["hr_contact"]["name"],
                        "linkedin_url": job["hr_contact"]["linkedin_url"]
                    }).execute()
        except Exception as e:
            print(f"Error inserting job {job['company']}: {e}")

def delete_expired_postings(supabase):
    print("Cleaning up expired job postings (older than 2 days)...")
    try:
        time_threshold = (datetime.now() - timedelta(days=2)).isoformat()
        supabase.table('internships').delete().lt('posted_time', time_threshold).execute()
        print("Cleanup complete.")
    except Exception as e:
        print(f"Error during cleanup: {e}")

def main():
    print("Starting 24/7 Ghost Automation Scraper...")
    
    try:
        supabase = get_supabase_client()
        print("Successfully connected to Supabase.")
        
        # Run scrapers
        linkedin_jobs = scrape_linkedin()
        naukri_jobs = scrape_naukri()
        
        all_jobs = linkedin_jobs + naukri_jobs
        
        # Process and upload data
        process_internships(supabase, all_jobs)
        
        # Prune old data
        delete_expired_postings(supabase)
        
        print("Scraping cycle completed successfully.")
        
    except Exception as e:
        print(f"Error during scraping process: {e}")

if __name__ == "__main__":
    main()
