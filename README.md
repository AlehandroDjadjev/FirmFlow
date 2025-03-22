Firm flow is a webapp that helps you start and develop a business. It includes features such as: Creation and management of a firm, firm-specific chats with the dedicated chatbot. Creation of a default business step-by-step guide, which can be updated, and extra documents using selected chat interactions. Inclusion of extra context to the original dataset with RAG (upload text, pdf or url to site for information extraction).

To start clone the repo and then run the project (locally) by: 
 -initializing your virtual environment - open FirmFlow\backend in cmd and run python -m venv venv 
 -activate the venv with venv\scripts\activate then install your packages with pip install -r requirements.txt 
 -you might have to migrate with python manage.py makemigrations and python manage.py migrate 
 -create .env file with this template:
      OPENAI_API_KEY = ""
      PINECONE_API_KEY = ""
      PINECONE_ENV = "us-east-1"
      PINECONE_INDEX_NAME = "firmflow-vectordb"
      PINECONE_EMBEDDING_MODEL = "text-embedding-3-large"
      GPT_MODEL = "gpt-3.5-turbo"
      NAMESPACE = "default-namespace"
 -run the backend with python manage.py runserver

-open FirmFlow\frontend in cmd and run npm run dev to start frontend 
-install packages if missing upon first launch with npm install 
-copy the url (http://localhost:3000) and paste it into your browser to start

Following that a user should register and create a firm, fill in all the fields regarding its characteristics and enter the "see all projects" page, navigate to the chat. On the right all usable documents will be listed and chat interactions (prompt + response) will be selectable to either update the plan with them (add to the plan with their content) or create a new document (a document describing their topics, that's richer in detail). All documents can later be exported.

Technologies used:

   - Frontend: React + Next.js + Tailwind CSS
   - Backend: Django + Django REST Framework
   - AI: OpenAI (Embeddings + GPT-4) + Pinecone (Vector Search) + RAG (Retrieval-Augmented Generation)

Future plans:

  - Integrate a system for users to invest and track money into businesses
  - Scouting for information based on country-specific laws (only Bulgaria included as of now)
  - improving prompts and refining responses
