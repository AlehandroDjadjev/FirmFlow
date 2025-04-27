
import os
import time
import django
from django.shortcuts import get_object_or_404
import requests
from pathlib import Path
import math
import sys

import json

from bs4 import BeautifulSoup
import re

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from duckduckgo_search import DDGS

import tiktoken #token tracking
ENCODERS = {                          # cache encoders per-model prefix
    "gpt-3.5-turbo": tiktoken.encoding_for_model("gpt-3.5-turbo"),
    "gpt-4o":         tiktoken.get_encoding("cl100k_base"),   # 4-family
}

import time
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Set the settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "firmflow.settings")
# Initialize Django
django.setup()

#driver options
def get_driver():
    options = Options()
    options.add_argument("--headless=new")  # modern headless
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--enable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--window-size=1920x1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")

    # Optional: spoof user agent
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(3) 

    return driver

#Start
from web_scraper.models import ResearchSession 
from llm_api.models import Document, Firm

BASE_DIR = Path(__file__).resolve().parent
PROMPT_DIR = BASE_DIR / "prompts"


GPTurl = "http://localhost:8000/api/LLM/submit/1/" 
REFRESH_URL = "http://localhost:8000/auth/token/refresh/"
RefreshTokenGlobal = ""
AccessToken = ""

TOK_PROMPT_TOTAL   = 0 
TOK_COMPLETION_EST = 0  


def _refresh_access_token() -> None:
    """Refresh AccessToken in‑place; raise if refresh fails."""
    global AccessToken, RefreshTokenGlobal
    resp = requests.post(
        REFRESH_URL,
        headers={"Content-Type": "application/json"},
        json={"refresh": RefreshTokenGlobal},
        timeout=10,
    )
    resp.raise_for_status()  
    resp = resp.json()               # let caller catch other HTTP errors
    AccessToken = resp.get("access")
    RefreshTokenGlobal = resp.get("refresh") # will be None if malformed
    if not AccessToken:
        raise RuntimeError("refresh endpoint did not return 'access' token")

def tokens_for(text: str, model="gpt-4o"):
    enc = ENCODERS.get(model) or tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))

def submit_gpt(prompt_path, user_prompt, model ="gpt-4o"):
    """
    Call the local LLM endpoint once, transparently refreshing the access token
    if we get *exactly* a 401.  All other HTTP codes raise.
    """

    global AccessToken, TOK_PROMPT_TOTAL, TOK_COMPLETION_EST                      # we mutate it here

    prompt_tok = tokens_for(prompt_path, model) + tokens_for(user_prompt, model) #track prompt tokens
    TOK_PROMPT_TOTAL += prompt_tok

    headers = {"Content-Type": "application/json"}
    if AccessToken:
        headers["Authorization"] = f"Bearer {AccessToken}"

    payload = {
        "prompt":         user_prompt,
        "document_id":    None,
        "raw_prompt":     "Y",
        "pathPrompt":     prompt_path,
        "GPTmodel":       model,
    }

    resp = requests.post(GPTurl, headers=headers, json=payload, timeout=120)
    # --- only 401 triggers refresh; everything else we surface immediately ---
    if resp.status_code == 401:
        _refresh_access_token()              # may raise
        return submit_gpt(prompt_path, user_prompt, model=model)  # one retry

    resp.raise_for_status()                  # propagate 4xx/5xx
    try:
        reply = resp.json().get("response", "")
        comp_tok = tokens_for(reply, model)
        TOK_COMPLETION_EST += comp_tok
        print(f"[GPT INTERACTION] Prmpt tkn: {prompt_tok}, Comp tkn: {comp_tok}")
        return reply
    except (ValueError, KeyError):
        return ""     

  
def QueryText(text,urls,extraPrompt = ""):
    queryPrompt = f"""You are an expert research assistant.
                    Your job is to analyze the following text and extract the most important and diverse subtopics it contains. Then, based on these subtopics, generate {urls} search engine queries that would return highly relevant, specific, and in-depth information about each topic when used in Google. No more and no less.
 
                    Be precise and practical — the search queries must be worded in a way that helps find well-written, technical or authoritative sources (such as government guides, research papers, or in-depth articles).
                    - Make sure all major aspects of the original text are represented
                    - Be as specific as needed to get quality results
                    - list search querys with new lines, starting with "-"

                    Return only the list of search queries in the plain presented text format — no numbers or extra explanation.

                    This is an extra extruction(s) to complete when answering: \n{extraPrompt}

                    TEXT TO ANALYSE:
                    """
    
    return submit_gpt(queryPrompt,text,"gpt-4o-2024-08-06").splitlines()   



driver = get_driver() #INTIALIZE DRIVER


def wait_for_network_idle(driver, timeout=10, check_interval=0.25):
    # 1) inject counters for XHR
    driver.execute_script("""
    if (!window._pending_requests) {
      window._pending_requests = 0;
      (function(open) {
        XMLHttpRequest.prototype.open = function() {
          window._pending_requests++;
          this.addEventListener('readystatechange', function() {
            if (this.readyState === 4) {
              window._pending_requests--;
            }
          });
          open.apply(this, arguments);
        };
      })(XMLHttpRequest.prototype.open);
      // 2) and for fetch()
      (function(fetch) {
        window._orig_fetch = fetch;
        window.fetch = function() {
          window._pending_requests++;
          return window._orig_fetch.apply(this, arguments)
            .finally(() => { window._pending_requests--; });
        };
      })(window.fetch);
    }
    """)

    # 3) poll until no pending requests
    end_time = time.time() + timeout
    while time.time() < end_time:
        pending = driver.execute_script("return window._pending_requests")
        if pending == 0:
            return
        time.sleep(check_interval)
    raise TimeoutException(f"Timed out after {timeout}s waiting for network idle")

def accept_google_consent(driver, timeout=5):
    try:
        # Wait until either results OR consent iframe appears
        WebDriverWait(driver, timeout).until(
            EC.any_of(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div#search")),   # normal results
                EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[src*='consent']"))
            )
        )
        # If consent iframe is there – switch, click “Accept”
        iframes = driver.find_elements(By.CSS_SELECTOR, "iframe[src*='consent']")
        if iframes:
            driver.switch_to.frame(iframes[0])
            accept = driver.find_element(By.CSS_SELECTOR, "form [type=submit]")
            accept.click()
            driver.switch_to.default_content()
            print("[GOOGLE] Cookie consent accepted")
    except TimeoutException:
        pass      # nothing showed up – continue

def search_duckduckgo(query: str, max_results: int = 10) -> list[str]:
    urls = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, safesearch="moderate", max_results=max_results):
            if "href" in r:
                urls.append(r["href"])
    return urls

def googleSearch(query,max_results):

    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    driver.get(search_url)
    accept_google_consent()
    
    WebDriverWait(driver, 10).until(
     EC.presence_of_element_located((By.CSS_SELECTOR, "div.yuRUbf > a"))
    )

    results = driver.find_elements(By.CSS_SELECTOR, "div.yuRUbf > a")  # main result block
    urls = [r.get_attribute("href") for r in results[:max_results]]

    #If a capcha page appears use ddg
    if not urls:
        print("[SEARCH] ⚠️ Using DuckDuckGo fallback")
        with DDGS() as ddgs:
         for r in ddgs.text(query, safesearch="moderate", max_results=max_results):
            if "href" in r:
                urls.append(r["href"])

    
    print(f"[SEARCH] Searched for query: {query} - outputted urls: {urls}")
    return urls

def SearchAndCompile(url, scrape_type="priority"):
    print(f"[SCRAPE] Visiting url: {url} for {scrape_type} scrape")
    try:
        
        driver.get(url)

        # Wait up to 10s for all XHR/fetch to complete
        try:
           wait_for_network_idle(driver, timeout=10)
        except TimeoutException:  
          print("[SCRAPE] ⚠️ Network idle timeout; continuing with whatever’s loaded")
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")

        # Remove unwanted tags
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Extract clean text
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines()]
        lines = [line for line in lines if line]
        clean_text = "\n".join(lines)

        if scrape_type == "light":
            clean_text = "\n".join(clean_text.splitlines()[:20])  # Only first 20 lines


        print(f"[SCRAPE] Extracted {len(clean_text.split())} words from {url}")
        return (clean_text)

    except Exception as e:
        print(f"Failed to scrape {url}:", e)
        return None
    
def general_search(input, searches, results, prompt, list):
    print(f"[GENERAL SEARCH] Search initialized with {searches} searches and {results} results per search")
    if(input == ""): return [] #bail if input is blank so script doesnt crash
    for line in QueryText(input,searches, prompt): #txt for query, search count, bonus prompt 
                line = line.strip() 
                if line.startswith("- "): #split query in the list
                    urls = googleSearch(line[2:].strip(),results) #How mainy urls to have for each search
                
                for url in urls: #scrape fully
                  list.append(SearchAndCompile(url, "priority"))  #full scrape

    return urls

        
def SoloSearch(Search, total_results=15, priority_count=5,non_priority_count = 3):
    urls = googleSearch(Search, total_results)
    skeleton = []
    non_priorityCONTEXT = []
    non_prioritySCRAPE = []
    non_priorityURLS = []
    
    print("--[STATUS] WAVE 1 OF SEARCH STARTED --")
    #save priority results as skeleton to be used in the research. 
    #Context from ALL of the searches is used to generate a second search wave
    for i, url in enumerate(urls):
        scrape_type = "priority" if i < priority_count else "light"
        result = SearchAndCompile(url, scrape_type)

        if i < priority_count: 
            skeleton.append(result)
            result = result[:1500] #change for search weight

        non_priorityCONTEXT.append(result)
    
    print("--[STATUS] WAVE 2 OF SEARCH STARTED --")
    #query for second wave with context from the first part of each website
    non_priorityURLS = (general_search(f"### GENERAL TOPIC: \n ****{Search}\n****\n\n ###CONTENT TO QUERY:\n" + "\n\n".join(non_priorityCONTEXT), #USE USER PROMPT FOR BETTER CONTEXT
                   non_priority_count, math.ceil(priority_count / 3), 
                   """Build the query expanding on the themes and topic of this text. 
                    Consentrate" your searches to more over fill gaps in the text and expand undescribed topics. 
                    If mostly everything is covered generate the next logical searchers in the same field, based on the GENERAL TOPIC for the TEXT""", #ALL URLS FULLY SCRAPED, NUMBER IS FOR URL COUNT
                    non_prioritySCRAPE
                   
    ))

    #Prep the output text
    #Prep skeleton
    print("--[STATUS] PREPEARING SKELETON WITH WAVE 1 --")
    output = submit_gpt(f"""You are an assistant responsible for assembling a full-length research document.
            You will be given:
            1. A list of scraped content from web pages — the first few are full pages (high priority), the others are partial (low priority).
            2. The original topic on which all the content is based.

            Your job is to:
            - Combine the provided scraped content into a full-length, **cleaned and readable** document.
            - **Do not summarize, rephrase, or skip any content** — include all of it, keeping it as complete as possible.
            - Only perform light formatting (fix paragraph spacing, remove clear duplicates, fix line breaks, unify headings).
            - Do not add commentary or interpretation — this is not an analysis, it's a compiled base document.
            - Assume this will be the **final version** for this topic.

            ALL content must be preserved, assume that every little detail will later be accessed - they all have to be there.
    """,f"This is the main topic: {Search}.\n### HIGH PRIORITY TEXT" +"\n".join(skeleton) + "### LOW PRIORITY TEXT" +"\n".join(non_priorityCONTEXT),
       "gpt-4o-2024-08-06" #we use 4o to format original text
    )
    
    print("--[STATUS] ADDING CONTENT FROM WAVE 2 --")
    #Expand with low priority content
    output = submit_gpt(f"""You are a formatting assistant responsible for expanding a completed research document.
            You will be given:
            1. A full-length research text, already compiled from high-priority sources.
            2. Additional low-priority scraped content for the same topic.
            3. The original topic the research is based on.

            Your task is:
            - Expand the existing document by incorporating the new low-priority content **under the correct sections or headings**, if such exist.
            - If there is **no clear section** for the topic the low-priority content relates to, **append that content in raw form** at the end of the document.
            - **Do not summarize, paraphrase, or filter** the new content — it must be preserved exactly as-is.
            - You are allowed to **lightly format spacing and line breaks** for readability only — do not change structure or meaning.
            - The final result must contain **all original text + all new content**, in one unified document.
            - This will be the finalized, fully expanded version.

            Your only job is to integrate and organize, not to analyze or rephrase.

        """,f"""### TOPIC: {Search} 
        ### CURRENT RESEARCH DOCUMENT (SKELETON FROM HIGH PRIORITY SOURCES):{0}
        ### NEW LOW PRIORITY SCRAPED CONTENT TO EXPAND WITH:
        {1}
        """.format("\n\n".join(skeleton),"\n\n".join(non_prioritySCRAPE)), 
        "gpt-4o-mini-2024-07-18" #mini is used for formatting
        )
    
    return ("\n".join(output),urls,non_priorityURLS)

def load_json_safely(raw: str) -> dict:
    """
    Strip ``` fences / ```json fences and parse.  
    Returns an empty dict if parsing fails.
    """
    if not raw:
        return {}

    cleaned = raw.strip()

    # Remove leading / trailing markdown fences
    if cleaned.startswith("```"):
        # drop first line
        cleaned = "\n".join(cleaned.splitlines()[1:])
    if cleaned.endswith("```"):
        cleaned = "\n".join(cleaned.splitlines()[:-1])

    cleaned = cleaned.strip()

    # Try to parse as‑is
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Quick fix for single trailing commas
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
        try:
            return json.loads(cleaned)
        except Exception as e:
            print("[JSON PARSE FAIL]", e)
            return {}

def CheckText(text,topic):
    print("--[STATUS] INFO CHECK STARTED --")
    print(f"[INFOCHECK] Checking text for topic: {topic} — Length of text in words: {len(text.split())}")
    rr = submit_gpt(fr"""
                    You are a critical analysis assistant. Your task is to perform a structured evaluation of a compiled research document and return the results in a strict JSON format that will be used by a system for follow-up improvements.

                    Your analysis must be detailed, honest, and system-ready.

                    ---

                    You will follow this exact evaluation process:

                    1. **Subtopic Extraction and Scoring**
                    - Read the research document.
                    - Extract all distinct subtopics that are explicitly or implicitly covered (e.g. "Legal Registration", "Funding Options", "Taxation").
                    - For each subtopic, score how well it is explained and how deep its detail is on a scale from 1 to 10 (10 = fully covered, 1 = barely mentioned).
                    - Label each with a `"marker": "*"` to distinguish subtopic records in the JSON.
                    - Judge topics objectively - they CAN be perfect and can recieve a high score. Be brutaly honest in your judgement

                    2. **Underscribed Topic Identification**
                    - Based on your understanding of the document **and the general topic**, list any important subtopics that were **not discussed or are missing key information** and should be included.
                    - Only include topics that you are confident are relevant but underscribed or completely omitted.
                    - If a topic overlaps with a low-scoring subtopic, do **not** repeat it — just rely on the score to reflect that weakness.

                    3. **Flagging Unlikely or Risky Paragraphs**
                    - Go through the text paragraph-by-paragraph.
                    - Identify any paragraph that may include **potentially false, vague, outdated or in general outright ridiculas information** information.
                    - For each flagged paragraph, return a short snippet from the text and explain **why it may be risky** (e.g. outdated number, oversimplified legal claim, or no source).
                    - Only flag a paragraph if it poses real risk of misinformation — don't over-flag, as further action after a flag is resource heavy.

                    ---

                     **Return Format (JSON only):**
                    ```json
                    {{
                    "topics": [
                        {{"name": "Subtopic name", "score": 1–10, "marker": "*"}},
                        ...
                    ],
                    "underscribed_topics": [
                        "Missing topic name 1",
                        "Missing topic name 2"
                    ],
                    "flagged_paragraphs": [
                       { {
                        "text_snippet": "Short part of the risky paragraph",
                        "reason": "Why this could be misleading or wrong"
                        }},
                        ...
                    ]
                    }}
                """,f"###Original topic:\n {topic} \n###Text to analyse:\n{text}",
                "gpt-4o-2024-08-06" #4o is used because we have text analysis
                )
    
    try: #Parse gpt's json responce
        result = load_json_safely(rr)
        print("Parsed JSON successfully!")
    except json.JSONDecodeError as e:
        print("Failed to parse JSON:")
        print(e)
        result = None

    if result: 
       urls = []
       topics = []
       score_scrape = []
       undescribed_scrape = []
       flagged_scrape = []
    
       for topic in result.get("topics", []): #first check and act on scoring
           score = int(topic['score'])
           if(score < 6): #min score to pass = 6
               topics.append((topic['name'],score))
       
       print(f"[INFOCHECK] Identified {len(topics)} sub-topics as low scoring")
       if(len(topics) > 0):
            urls.extend(general_search("\n".join(f"{name}: {score}" for name, score in topics),
                           len(topics)*2,
                           3,
                           """You've been provided with some text sub-topics that have scored poorly when being analysed.
                           Based on how bad their allocate a part of the total searches provided to it.""",
                           score_scrape
                           ))
            
       topicsU = []
       for topic in result.get("underscribed_topics", []): #then search for the missing paragraphs
            topicsU.append(topic)
       
       print(f"[INFOCHECK] Identified {len(topicsU)} missing paragraphs")
       if topicsU:
            urls.extend(general_search("\n".join(topicsU),
                        len(topicsU),
                        5,
                        "",
                        undescribed_scrape
                        ))
               
       topicsF = []
       for topic in result.get("flagged_paragraphs", []): #finally take the flagged topics and search for them 
            topicsF.append((topic['text_snippet'],topic['reason']))

       print(f"[INFOCHECK] Flagged {len(topicsF)} paragraphs")
       if topicsF:
            urls.extend(general_search("\n".join(f"{text_snippet}: {reason}" for text_snippet, reason in topicsF),
                        round(len(topicsF)* 1.5),
                        3,
                        """You've been provided with some texts that have been flagged as factually inccorect. Based on how heavy
                        the reasoning behind each one is and its actual description generate some detailed searches that would bring and clarify detail on the sketchy information bits""",
                        flagged_scrape
                        )) 
               
       print(f"[INFOCHECK] Applying changes")
       #Finally aplly the changes
       return (submit_gpt(
            f"""You are a formatting and factual correction assistant responsible for improving a compiled research document.
            You will be given:
            1. The full original compiled document.
            2. A list of topic-related fixes, expansions, and insertions. These will be divided by category:
                - Topics that were previously scored poorly and need expansion
                - Topics that were completely missing and should be added
                - Paragraphs previously flagged as factually questionable, now clarified with fresh content

            You must follow these rules strictly:
            - For low-scoring topics: inject the new content **into the corresponding section** of the original text. If that section is missing, append at the end with a clear heading.
            - For missing topics: **append** the new content to the end of the document, each under a clear heading with the topic name.
            - For flagged paragraphs / content: **locate** the matching content in the original document, and **rephrase or replace it** using the clarified scraped info. Keep structure and meaning intact, but remove false or risky wording .
            - Do **not** summarize, paraphrase, or interpret any scraped content unless it's flagged content being reworded.
            - Do **not** change or reformat parts of the original text that are not directly affected.
            - Maintain all existing sections and formatting.

            Only output the fully updated, unified version of the document. No commentary.
            """,
            f"""### ORIGINAL RESEARCH DOCUMENT:
            {text}

            ### Low-Scoring Topics That Need Expansion:
            {0}

            ### Missing Topics to Append:
            {1}

            ### Flagged Paragraphs That Need Rephrasing:
            {2}
            """.format(
               "\n".join(f"TOPIC: {name} (score: {score})\n{scrape}" for (name, score), scrape in zip(topics, score_scrape)),
               "\n".join(f"TOPIC: {topic}\n{scrape}" for topic, scrape in zip(topicsU, undescribed_scrape)),
               "\n".join(f"FLAGGED: {text_snippet}\nREPLACEMENT INFO:\n{scrape}" for (text_snippet, _), scrape in zip(topicsF, flagged_scrape))
            ),
            
            #although in some use cases mini is fit, we are inserting at random - main better
            "gpt-4o-2024-08-06" 
            )
            ,urls,result)

def FormatTextForUser(texts,Input):
    print("--[STATUS] FORMATTING TEXT FOR FINAL RESULTS--")    
    
    #get original big report
    long = submit_gpt(
        f"""You are a formatting assistant responsible for building a full-scale, structured research report.
              
        You will be given:
        - The context on which the information for the report report collected
        - A list of finalized topic texts, each already compiled and cleaned

        Your task is to:
        - Organize this information into a single, unified **long-form report** suitable for **deep human reading** and **AI model referencing**.
        - Each topic must be presented in its **own section**, with a clear heading. All sections must be nicely linked.
        - **Do not summarize, rewrite, or remove any information** — everything provided must be included as-is, only with structural formatting for flow.
        - Add a **table of contents** at the top listing each section title (topic).
        - Include refferences and build a nice logical connection between information. 
        - Keep the speech format official, do not reduce the level of speech when aiming for clearer readability
        - Each section must begin with a heading formatted as:
        `## Topic Name`
        - Within each section:
        - Keep paragraphs spaced
        - Maintain original phrasing
        - Do light cleanup only: line breaks, duplicated phrases, or visible formatting issues
        - Do not add your own commentary or conclusions.
        - Assume this report will be used for **in-depth human review** and **as a source for large language models**, so no content should be excluded or reworded.
        
        But your main instruction is **TO NOT SUMMARIZE ANYTHING - TREAT EVERY LITTLE BIT OF INFO AS IF IT SPECIFICLY IS LATER GOING TO BE REQUESTED**
        """,
        f"""### CONTEXT ON THE INFORAMTION TO COMPILE :
        {Input}

        ### FINALIZED TOPIC TEXTS TO STRUCTURE INTO A MEGA REPORT:
        {0}
        """.format("\n\n".join(f"## {topic_name}\n{content}" for topic_name, content in texts)),
        "gpt-4o-2024-08-06"
        )
    print("[TEXTFORMAT] Finished long report")
    
    medium = submit_gpt(
        f"""You are a summarization assistant responsible for creating a clean, human-friendly version of a very large research report.

        You will be given:
        - The full, raw long-form report containing all topic information and data.
        - The original research prompt for context.

        Your task is to:
        - Create a fully structured, human-readable report (~10 pages max) that is detailed but digestible.
        - Extract the major topics and **use them as section headings**.
        - In each section:
        - Explain the core concepts and findings clearly.
        - Do **not re-include overly technical or bloated content** — instead, list or reference sections that can be looked up in the original report if needed.
        - Use a clean, report-like tone that is useful for someone trying to understand the subject without reading the full version.

        The original long report was compiled to include every detail from priority and extra sources. Now you are refining it for high-level understanding, while still preserving depth and clarity.

        """,
        f"""### CONTEXT ON WHICH THE BIG REPORT WAS BUILT (USE TO CHECK WHICH INFO TO PRIORITIZE):
        {Input}

        ### FULL LONG REPORT:
        {long}
        """,
        "gpt-4o-mini-2024-07-18"
    )
    
    print("[TEXTFORMAT] Finished medium report")

    short = submit_gpt(
            f"""You are an assistant creating a concise summary of a research report.

            You will be given:
            - A refined ~10-page report based on a larger research document.

            Your task is to:
            - Write a **1-page overview** that reads like a **table of contents with explanations**.
            - Clearly list the main topics covered, with 1–2 sentences explaining what was found in each.
            - Do **not summarize deeply** — this is meant as a structural guide and orientation.

            This is the final, skimmable reference for users.

            """,
            f"""### TOPIC REPORT (10-PAGE VERSION):
            {medium}""",
            "gpt-4o-mini-2024-07-18"
            )
    
    print("[TEXTFORMAT] Finished short report")
    return long,medium,short


def DeepSearch(Input,firm_id,refresh_token):
    global RefreshTokenGlobal, AccessToken
    RefreshTokenGlobal = refresh_token
    _refresh_access_token()      
    firm = get_object_or_404(Firm, id=firm_id)
    doc_count = Document.objects.filter(firm=firm).count()
    new_index = doc_count + 1
    session = ResearchSession.objects.create(
        firm=firm,
        title=f"ResearchDocument {new_index}",
        original_prompt=Input
    )

    #save deep search basic info in db
    priority, non_priority, fn  = [], [], []
    mode = None
    searched_info = ""
    topics_for_search = 3 #SELECT HOW MANY TOPICS TO SEARCH
    urlsP , urlsN ,urlsE = [], [], [] #priority urls, non-priority,extra urls used in info check
    texts = []
    scoring = []

    
    #query-ing is optimised with main queries
    QueryABformat = """If you have some simular queries (and simular in topics) merge them in one, and mark it as **PRIORITY**. For standalone ones mark them as **NON-PRIORITY**

                    Output in this following format STRICTLY. Your output should start with "PRIORITY:", each of the queries with NO extra characters in a newline, starting with "-", then "NON-PRIORITY:" and the rest of the queries in newlines
                    "
                    PRIORITY:
                     - Query A
                     - Query B

                    NON-PRIORITY:
                     - Query C
                     - Query D
                    """
    
    #Query original prompt and split for priority and non-priority searches

    print(F"[Session] Research session created with {topics_for_search} topics to research")
    
    start = time.time()

    for line in QueryText(Input,topics_for_search,QueryABformat): #count of topics
        line = line.strip()

        if line == "PRIORITY:": #gpt formatting in QueryText is strictly trusted
            mode = "priority"
            continue
        elif line == "NON-PRIORITY:":
            mode = "non-priority"
            continue

        if line.startswith("- "):
            if mode == "priority":
                priority.append(line[2:].strip())
            elif mode == "non-priority":
                non_priority.append(line[2:].strip())

    
    print(f"[Session] Selected {len(priority)} priority and {len(non_priority)} non-priority searches") #loop though each of the search queries for priority first
    for search, is_priority in [(s,True) for s in priority] + [(s,False) for s in non_priority]:

    
        #by default 15 searches with 5 fu scrapes - returns a tuple with urls and whatnot
        if is_priority: 
         print(f"Starting search for priority topic {search}")
         fn = SoloSearch(search,25,10,3) 
        else:
         print(f"Starting search for non-priority topic {search}")
         fn = SoloSearch(search,17,7,2)  

        searched_info = fn[0]
        urlsP.extend(fn[1])
        urlsN.extend(fn[2])

        fn = CheckText(searched_info,search) #Check info (gpt scor)
        searched_info = fn[0]
        urlsE.extend(fn[1])

        texts.append(searched_info)
        scoring.append(fn[2])

    #format text for outputs and save it to db
    formatted = FormatTextForUser(zip(priority+non_priority, texts), Input)

    session.full_report = formatted[0]
    session.cutdown_report = formatted[1]
    session.summary_report = formatted[2]
    
    print("--[STATUS] SAVING RESEARCH DOCUMENT")
    #save deepsearch basic details in db
    #save topics with their org texts 
    session.topics = {}

    for i in range(len(priority)):
     session.topics[priority[i]] = {
          "text" : priority[i],
          "scoring on original research" : scoring[i]
        }

    for j in range(len(non_priority)):
     session.topics[non_priority[j]] = {
          "text" : non_priority[j],
          "scoring on original research" : scoring[len(priority) + j]
        }

    #save used urls 
    session.urls = {
     "Priority": {},
     "Non-priority": {},
     "Extra-urls": {},
    }

    for i, item in enumerate(urlsP):
     session.urls["Priority"][f"Url: {i+1}"] = item

    for i, item in enumerate(urlsN):
     session.urls["Non-priority"][f"Url: {i+1}"] = item

    for i, item in enumerate(urlsE):
     session.urls["Extra-urls"][f"Url: {i+1}"] = item

    #save the changes
    session.save()
    print("--[STATUS] FINISHED SAVING--")

    driver.quit()
    print("Chrome driver closed.")
    end = time.time()
    print(f"Finished in {end - start:.2f} seconds")
    ''

if __name__ == "__main__":
 testPrompt = "Започване на бизенс с продажба и производство на гмо продукти - как ще се организира и поддържа, рекламира и тн"
 DeepSearch(testPrompt,1,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0NTc1NDk1MywiaWF0IjoxNzQ1NjY4NTUzLCJqdGkiOiJjODZjMjU0MzM4YTc0MzNhOTc2ODhhZmE2M2ZjOTQzOSIsInVzZXJfaWQiOjF9.OoYkoxGOJsKsz5J2Y4nJ_izggYtYeKXd8AxFXOBvTVk")
