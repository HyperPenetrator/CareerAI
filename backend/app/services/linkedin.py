import urllib.parse

def build_linkedin_jobs_url(title: str, location: str = "Remote") -> str:
    """
    Constructs a pre-filtered LinkedIn Job Search URL.
    """
    base_url = "https://www.linkedin.com/jobs/search/"
    params = {
        "keywords": title,
        "location": location
    }
    if location.lower() == "remote":
        params["f_WT"] = "2" # 2 is Remote in LinkedIn's search params filter f_WT
    
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}?{query_string}"
